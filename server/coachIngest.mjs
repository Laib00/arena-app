/**
 * Phase 2 — multipart upload → Supabase Storage → extract text → knowledge_chunks (no embeddings).
 * Expects Authorization: Bearer <user_jwt> and multipart fields: library_id, file; optional: title.
 */
import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { chunkPastedText } from "./chunkText.mjs";

function sanitizeFilename(name) {
  const base = String(name || "document")
    .replace(/[/\\?*:|"<>]/g, "-")
    .slice(0, 200);
  return base || "document";
}

async function extractText(buffer, mimeType, originalName) {
  const lower = (originalName || "").toLowerCase();
  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md")
  ) {
    return buffer.toString("utf8");
  }
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const res = await pdfParse(buffer);
    return res.text || "";
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const res = await mammoth.extractRawText({ buffer });
    return res.value || "";
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}

/** Resolve allowed upload from MIME + filename (browsers often mis-report txt/docx). */
function normalizeUploadType(mimeType, originalFilename) {
  const mime = (mimeType || "application/octet-stream").toLowerCase();
  const lower = (originalFilename || "").toLowerCase();
  if (
    mime === "application/pdf" ||
    lower.endsWith(".pdf")
  ) {
    return { mime: "application/pdf", extOk: true };
  }
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    return {
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extOk: true,
    };
  }
  if (
    mime === "text/plain" ||
    mime === "text/markdown" ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md")
  ) {
    return { mime: lower.endsWith(".md") ? "text/markdown" : "text/plain", extOk: true };
  }
  /** e.g. Chrome sometimes sends application/octet-stream for .docx/.txt */
  if (mime === "application/octet-stream" && (lower.endsWith(".txt") || lower.endsWith(".md"))) {
    return { mime: lower.endsWith(".md") ? "text/markdown" : "text/plain", extOk: true };
  }
  if (mime === "application/octet-stream" && lower.endsWith(".docx")) {
    return {
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extOk: true,
    };
  }
  if (mime === "application/octet-stream" && lower.endsWith(".pdf")) {
    return { mime: "application/pdf", extOk: true };
  }
  return { mime, extOk: false };
}

export async function handleCoachIngest(req, res, env) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Missing Supabase URL or anon key in environment." }));
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Missing Authorization Bearer token." }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: userErr?.message || "Invalid session." }));
    return;
  }
  const userId = userData.user.id;

  const form = formidable({
    maxFileSize: 25 * 1024 * 1024,
    keepExtensions: true,
    multiples: false,
  });
  let fields;
  let files;
  try {
    [fields, files] = await form.parse(req);
  } catch (e) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : "Multipart parse failed." }));
    return;
  }

  const libraryId = fields.library_id?.[0];
  const titleOpt = fields.title?.[0];
  const fileArr = files.file;
  const file = Array.isArray(fileArr) ? fileArr[0] : null;

  if (!libraryId || !file) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Expected library_id and file." }));
    return;
  }

  const rawMime = file.mimetype || "application/octet-stream";
  const { mime: mimeType, extOk } = normalizeUploadType(rawMime, file.originalFilename);
  if (!extOk) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: `Unsupported file type (${rawMime}). Use .pdf, .txt, .md, or .docx.`,
      })
    );
    return;
  }

  const { data: libRow, error: libErr } = await supabase
    .from("knowledge_libraries")
    .select("id, owner_id")
    .eq("id", libraryId)
    .maybeSingle();

  if (libErr || !libRow) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: libErr?.message || "Library not found." }));
    return;
  }
  if (libRow.owner_id !== userId) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not the owner of this library." }));
    return;
  }

  const fs = await import("node:fs/promises");
  const buf = await fs.readFile(file.filepath);
  const safeName = sanitizeFilename(file.originalFilename || "upload");
  const storagePath = `${userId}/${libraryId}/${Date.now()}-${safeName}`;
  const bucket = "coach-documents";

  const { data: docRow, error: docInsErr } = await supabase
    .from("knowledge_documents")
    .insert({
      library_id: libraryId,
      title: (titleOpt && titleOpt.trim()) || safeName.replace(/\.[^.]+$/, "") || "Uploaded document",
      source_type: "upload",
      mime_type: mimeType,
      processing_status: "processing",
      storage_path: storagePath,
      metadata: { original_filename: file.originalFilename },
    })
    .select("id")
    .maybeSingle();

  if (docInsErr || !docRow?.id) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: docInsErr?.message || "Could not create document row." }));
    return;
  }

  const documentId = docRow.id;

  const { error: upErr } = await supabase.storage.from(bucket).upload(storagePath, buf, {
    contentType: mimeType,
    upsert: false,
  });

  if (upErr) {
    await supabase
      .from("knowledge_documents")
      .update({ processing_status: "failed", error_message: upErr.message })
      .eq("id", documentId);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: `Storage upload failed: ${upErr.message}` }));
    return;
  }

  let text;
  try {
    text = await extractText(buf, mimeType, file.originalFilename);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("knowledge_documents")
      .update({ processing_status: "failed", error_message: msg })
      .eq("id", documentId);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: msg }));
    return;
  }

  const parts = chunkPastedText(text);
  if (parts.length === 0) {
    await supabase
      .from("knowledge_documents")
      .update({ processing_status: "failed", error_message: "No text extracted (empty document)." })
      .eq("id", documentId);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "No text extracted from file." }));
    return;
  }

  const chunkRows = parts.map((content, idx) => ({
    document_id: documentId,
    library_id: libraryId,
    chunk_index: idx,
    content,
    metadata: { source: "upload", mime_type: mimeType },
  }));

  const { error: chunkErr } = await supabase.from("knowledge_chunks").insert(chunkRows);
  if (chunkErr) {
    await supabase
      .from("knowledge_documents")
      .update({ processing_status: "failed", error_message: chunkErr.message })
      .eq("id", documentId);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: chunkErr.message }));
    return;
  }

  await supabase.from("knowledge_documents").update({ processing_status: "ready", error_message: null }).eq("id", documentId);

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      document_id: documentId,
      storage_path: storagePath,
      chunk_count: parts.length,
      processing_status: "ready",
    })
  );
}
