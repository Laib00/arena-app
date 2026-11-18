/**
 * Fetch YouTube captions with English preferred (default track is often a translation, not English).
 */
import {
  YoutubeTranscript,
  YoutubeTranscriptNotAvailableLanguageError,
} from "youtube-transcript";

const EN_TRY_ORDER = ["en", "en-US", "en-GB", "en-AU", "en-CA", "en-IN"];

function segmentsToText(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return "";
  return segments
    .map((s) => String(s?.text || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAvailableLanguagesFromError(err) {
  const raw = err instanceof Error ? err.message : String(err);
  const idx = raw.indexOf("Available languages:");
  if (idx < 0) return [];
  const tail = raw.slice(idx + "Available languages:".length).trim();
  const listPart = tail.replace(/\)\s*$/, "").trim();
  return listPart
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function englishCodes(codes) {
  return [...new Set(codes.filter((c) => /^en([-.]|$)/i.test(c)))];
}

/**
 * @param {string} videoId
 * @param {{ preferredLang?: string }} [opts]
 * @returns {Promise<{ text: string; captionLanguage: string }>}
 */
export async function fetchYoutubeTranscriptPreferEnglish(videoId, opts = {}) {
  const preferred = opts.preferredLang?.trim();
  const tryOrder = [...new Set([...(preferred ? [preferred] : []), ...EN_TRY_ORDER])];
  let lastLangError = null;

  for (const lang of tryOrder) {
    try {
      const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      const text = segmentsToText(segments);
      if (!text) continue;
      return { text, captionLanguage: segments[0]?.lang || lang };
    } catch (e) {
      if (e instanceof YoutubeTranscriptNotAvailableLanguageError) {
        lastLangError = e;
        continue;
      }
      const msg = e instanceof Error ? e.message : String(e);
      if (/disabled|unavailable|not found|could not retrieve|too many requests/i.test(msg)) {
        if (/disabled|unavailable|not found/i.test(msg)) {
          throw new Error(
            "No captions found for this video. Enable English subtitles on YouTube or use paste/upload instead."
          );
        }
        throw new Error(msg);
      }
      throw e;
    }
  }

  const available = lastLangError ? parseAvailableLanguagesFromError(lastLangError) : [];
  const enFromYoutube = englishCodes(available);
  for (const lang of enFromYoutube) {
    if (tryOrder.includes(lang)) continue;
    try {
      const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      const text = segmentsToText(segments);
      if (text) return { text, captionLanguage: segments[0]?.lang || lang };
    } catch {
      /* next */
    }
  }

  if (available.length) {
    throw new Error(
      `No English captions on this video. YouTube lists: ${available.join(", ")}. On YouTube, pick English (CC) and re-import, or paste an English transcript.`
    );
  }

  throw new Error(
    lastLangError instanceof Error
      ? lastLangError.message
      : "Could not fetch an English YouTube transcript."
  );
}