/**
 * Phase 5a — YouTube URL → transcript → knowledge_chunks (no video storage).
 * POST JSON: { library_id, url, title? }
 * Authorization: Bearer <user_jwt>
 */
import { createClient } from "@supabase/supabase-js";
import { chunkPastedText } from "./chunkText.mjs";
import { parseYouTubeVideoUrl } from "./youtubeUrl.mjs";
import { fetchYoutubeTranscriptPreferEnglish } from "./youtubeTranscript.mjs";
import { fetchYoutubeOEmbed } from "./youtubeMeta.mjs";

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export async function handleCoachIngestYoutube(req, res, env) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    sendJson(res, 500, { error: "Missing Supabase URL or anon key in environment." });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    sendJson(res, 401, { error: "Missing Authorization Bearer token." });
    return;
  }

  const body = await readJsonBody(req);
  if (body === null) {
    sendJson(res, 400, { error: "Invalid JSON body." });
    return;
  }

  const libraryId = typeof body.library_id === "string" ? body.library_id.trim() : "";
  const urlInput = typeof body.url === "string" ? body.url.trim() : "";
  const titleOpt = typeof body.title === "string" ? body.title.trim() : "";
  const captionLang =
    typeof body.caption_lang === "string" && body.caption_lang.trim()
      ? body.caption_lang.trim()
      : "en";

  if (!libraryId || !urlInput) {
    sendJson(res, 400, { error: "Expected library_id and url." });
    return;
  }

  const parsed = parseYouTubeVideoUrl(urlInput);
  if (!parsed) {
    sendJson(res, 400, { error: "Invalid YouTube URL. Use a link like https://www.youtube.com/watch?v=…" });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    sendJson(res, 401, { error: userErr?.message || "Invalid session." });
    return;
  }
  const userId = userData.user.id;

  const { data: libRow, error: libErr } = await supabase
    .from("knowledge_libraries")
    .select("id, owner_id")
    .eq("id", libraryId)
    .maybeSingle();

  if (libErr || !libRow) {
    sendJson(res, 404, { error: libErr?.message || "Library not found." });
    return;
  }
  if (libRow.owner_id !== userId) {
    sendJson(res, 403, { error: "Not the owner of this library." });
    return;
  }

  const defaultTitle = `YouTube ${parsed.videoId}`;
  const transcriptPromise = fetchYoutubeTranscriptPreferEnglish(parsed.videoId, {
    preferredLang: captionLang,
  });
  const oembedPromise = titleOpt ? null : fetchYoutubeOEmbed(parsed.canonicalUrl);
  const oembed = oembedPromise ? await oembedPromise : null;
  const docTitle = titleOpt || oembed?.title || defaultTitle;

  const { data: docRow, error: docInsErr } = await supabase
    .from("knowledge_documents")
    .insert({
      library_id: libraryId,
      title: docTitle,
      source_type: "url",
      source_url: parsed.canonicalUrl,
      processing_status: "processing",
      metadata: {
        youtube_video_id: parsed.videoId,
        transcript_source: "youtube_captions",
        caption_language_requested: captionLang,
        ...(oembed?.authorName ? { youtube_channel: oembed.authorName } : {}),
      },
    })
    .select("id")
    .maybeSingle();

  if (docInsErr || !docRow?.id) {
    sendJson(res, 400, { error: docInsErr?.message || "Could not create document row." });
    return;
  }

  const documentId = docRow.id;

  let text;
  let captionLanguage;
  try {
    const fetched = await transcriptPromise;
    text = fetched.text;
    captionLanguage = fetched.captionLanguage;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("knowledge_documents")
      .update({ processing_status: "failed", error_message: msg })
      .eq("id", documentId);
    sendJson(res, 400, { error: msg });
    return;
  }

  const parts = chunkPastedText(text);
  if (parts.length === 0) {
    const msg = "Transcript was empty after processing.";
    await supabase
      .from("knowledge_documents")
      .update({ processing_status: "failed", error_message: msg })
      .eq("id", documentId);
    sendJson(res, 400, { error: msg });
    return;
  }

  const chunkRows = parts.map((content, idx) => ({
    document_id: documentId,
    library_id: libraryId,
    chunk_index: idx,
    content,
    metadata: {
      source: "youtube",
      youtube_video_id: parsed.videoId,
      caption_language: captionLanguage,
    },
  }));

  const { error: chunkErr } = await supabase.from("knowledge_chunks").insert(chunkRows);
  if (chunkErr) {
    await supabase
      .from("knowledge_documents")
      .update({ processing_status: "failed", error_message: chunkErr.message })
      .eq("id", documentId);
    sendJson(res, 400, { error: chunkErr.message });
    return;
  }

  await supabase
    .from("knowledge_documents")
    .update({
      processing_status: "ready",
      error_message: null,
      metadata: {
        youtube_video_id: parsed.videoId,
        transcript_source: "youtube_captions",
        caption_language_requested: captionLang,
        caption_language: captionLanguage,
        ...(oembed?.authorName ? { youtube_channel: oembed.authorName } : {}),
      },
    })
    .eq("id", documentId);

  sendJson(res, 200, {
    document_id: documentId,
    title: docTitle,
    source_url: parsed.canonicalUrl,
    youtube_video_id: parsed.videoId,
    chunk_count: parts.length,
    processing_status: "ready",
  });
}