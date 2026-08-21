import type { ChatMessage } from "./types/domain";

// Calls our own serverless proxy at /api/gemini — the Gemini API key
// lives only on the server (see api/gemini.js), never in this browser code.

async function callGemini(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  // Internal messages use { role: 'user' | 'assistant', content }.
  // Gemini's API expects { role: 'user' | 'model', parts: [{ text }] }.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, contents }),
  });

  const raw = await response.text();
  let data: { error?: string; text?: string; warning?: string } | null = null;
  try {
    data = raw ? (JSON.parse(raw) as { error?: string; text?: string; warning?: string }) : null;
  } catch {
    throw new Error(
      "AI API returned an empty or invalid response. " +
        "Check GEMINI_API_KEY in .env, then restart `npm run dev`. " +
        "On the live site, set GEMINI_API_KEY in the host's environment variables."
    );
  }
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data?.text || (data?.warning ? `(${data.warning})` : "(no response)");
}

export { callGemini };
