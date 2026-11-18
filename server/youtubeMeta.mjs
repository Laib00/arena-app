/**
 * YouTube metadata without API key (oEmbed).
 */

const OEMBED = "https://www.youtube.com/oembed";

/**
 * @param {string} canonicalWatchUrl e.g. https://www.youtube.com/watch?v=VIDEO_ID
 * @returns {Promise<{ title: string; authorName: string | null } | null>}
 */
export async function fetchYoutubeOEmbed(canonicalWatchUrl) {
  const url = `${OEMBED}?url=${encodeURIComponent(canonicalWatchUrl)}&format=json`;
  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "ArenaCoachIngest/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const title = typeof data?.title === "string" ? data.title.trim() : "";
    if (!title) return null;
    const authorName = typeof data?.author_name === "string" ? data.author_name.trim() : null;
    return {
      title: title.slice(0, 300),
      authorName: authorName ? authorName.slice(0, 120) : null,
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} canonicalWatchUrl
 * @returns {Promise<string | null>}
 */
export async function fetchYoutubeVideoTitle(canonicalWatchUrl) {
  const meta = await fetchYoutubeOEmbed(canonicalWatchUrl);
  return meta?.title ?? null;
}