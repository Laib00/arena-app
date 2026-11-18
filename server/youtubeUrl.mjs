/**
 * Parse a YouTube watch / share URL into a video id.
 * @param {string} raw
 * @returns {{ videoId: string; canonicalUrl: string } | null}
 */
export function parseYouTubeVideoUrl(raw) {
  const input = String(raw || "").trim();
  if (!input) return null;

  let url;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (!["youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"].includes(host)) {
    return null;
  }

  let videoId = "";
  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || "";
  } else {
    videoId = url.searchParams.get("v") || "";
    if (!videoId && url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2] || "";
    }
    if (!videoId && url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2] || "";
    }
  }

  videoId = videoId.split("&")[0].trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return { videoId, canonicalUrl };
}