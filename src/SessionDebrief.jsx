import React, { useEffect, useState } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { DISC } from "./constants";
import { buildEvalPrompt } from "./prompts";

import { NAVY, ACCENT as GOLD } from "./theme";

/** Parse OVERALL / STRENGTHS / … blocks from AI suggestions text. */
export function parseEvalSections(text) {
  if (!text || !String(text).trim()) return null;
  const labels = [
    { key: "overall", re: /^OVERALL\s*$/i },
    { key: "strengths", re: /^STRENGTHS\s*$/i },
    { key: "areas_to_improve", re: /^AREAS TO IMPROVE\s*$/i },
    { key: "client_fit", re: /^CLIENT FIT\s*$/i },
    { key: "key_recommendation", re: /^KEY RECOMMENDATION\s*$/i },
  ];
  const lines = String(text).replace(/\r\n/g, "\n").split("\n");
  const sections = {};
  let current = null;
  let buf = [];
  const flush = () => {
    if (current) sections[current] = buf.join("\n").trim();
    buf = [];
  };
  for (const line of lines) {
    const matched = labels.find((l) => l.re.test(line.trim()));
    if (matched) {
      flush();
      current = matched.key;
      continue;
    }
    if (current) buf.push(line);
  }
  flush();
  if (!Object.values(sections).some(Boolean)) {
    return { overall: String(text).trim() };
  }
  return sections;
}



export function buildClientFeedbackPrompt(himself, client, aim, setting) {
  return `You are roleplaying as the client "${client.name}" from a sales practice session — not as a coach or trainer.

You are: ${client.name}, age ${client.age}, ${client.occupation}, DISC ${client.disc} (${DISC[client.disc].name}). Need level: ${client.needLevel}. Past experience: ${client.badExpReason}.
${client.notes ? `Your built-in challenge: ${client.notes}` : ""}
Scenario aim: ${aim.key}. Setting: ${setting.key}.
The trainee agent was: ${himself.name} (${himself.salesStyle} style).

Speak entirely in first person as ${client.name}. Review the transcript and pick 3–5 specific moments that mattered to you emotionally (not every line). For each moment:
- Quote or paraphrase what the agent said/did
- Say how you felt and why (e.g. pressured, respected, confused, trusted, dismissed)

Do NOT coach the agent. Do NOT say what they should do next. Do NOT use section labels like STRENGTHS or OVERALL. Plain conversational language only. Under 250 words.`;
}

export function buildFactsPrompt(himself, client, aim, setting) {
  return `You are a neutral session observer for sales practice. You report FACTS and measurements only — never coaching advice, never "you should", never judgment about whether something was good or bad.

Trainee: ${himself.name}. Client persona: ${client.name} (grade ${client.grade}, DISC ${client.disc}). Aim: ${aim.key}. Setting: ${setting.key}.

From the transcript, produce plain-text observations with approximate numbers where possible. Use these exact labels on their own lines:
TALK RATIO
TONE / ENERGY
PACE
KEY BEHAVIOURS OBSERVED
OTHER MEASUREMENTS

Rules:
- Facts and counts only (e.g. "Agent spoke in roughly 65% of turns", "Agent asked 4 questions", "Client interrupted twice").
- No recommendations. No praise. No criticism framed as coaching.
- If something cannot be measured from the transcript, say "Not enough data".
- Under 200 words. No markdown.`;
}

/** First reflection — before seeing client feedback (uncontaminated). */
export const REFLECTION_PROMPTS = [
  "Overall, how do you think this conversation went for the client?",
  "What was the hardest moment for you, and why?",
  "What do you believe the client felt toward you in this meeting (trust, pressure, interest, confusion, etc.)?",
  "What did you try to achieve in this conversation (e.g. rapport, discovery, next step)?",
  "If you met this client again tomorrow, what would you do differently?",
];

/** After reading client feedback — second learning layer. */
export const REFLECTION_UPDATE_PROMPTS = [
  "Where did your first reflection match what the client said they felt?",
  "Where were you wrong or surprised? What does that tell you?",
  "Which client feeling do you think you caused most — and what did you say or do that led to it?",
  "Looking at your first reflection, what would you keep, and what would you change?",
  "What is one specific behaviour you'll practice next time with a similar client?",
];

const STEP_ORDER = ["reflection", "feedback", "reflection_update", "facts", "suggestions"];

function emptyAnswers(prompts) {
  return prompts.map(() => "");
}

/** Serialize Q&A for DB (JSON string). Returns null if all blank. */
export function serializeReflectionAnswers(prompts, answers) {
  const items = prompts.map((question, i) => ({
    question,
    answer: (answers[i] || "").trim(),
  }));
  if (items.every((item) => !item.answer)) return null;
  return JSON.stringify({ version: 1, items });
}

/** Pretty text for facts prompt / raw_text. */
export function formatReflectionForPrompt(serialized) {
  if (!serialized) return "(none)";
  try {
    const data = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
    if (!data?.items?.length) return "(none)";
    return data.items
      .map((item, i) => `Q${i + 1}. ${item.question}\nA: ${item.answer || "(blank)"}`)
      .join("\n\n");
  } catch {
    return String(serialized);
  }
}

/** Render saved reflection (JSON or legacy plain text) in History. */
export function ReflectionAnswersView({ value }) {
  if (!value) {
    return <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>No answers saved.</div>;
  }

  let items = null;
  try {
    const data = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(data?.items)) items = data.items;
  } catch {
    /* legacy plain string */
  }

  if (!items) {
    return (
      <div style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 10, padding: 16, marginBottom: 24, whiteSpace: "pre-wrap", fontSize: 13.5 }}>
        {value}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 10, padding: 14, marginBottom: 10 }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 6 }}>
            {i + 1}. {item.question}
          </div>
          <div style={{ fontSize: 13.5, color: NAVY, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
            {item.answer || <span style={{ color: "#9CA3AF" }}>(no answer)</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuestionAnswerList({ prompts, answers, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {prompts.map((q, i) => (
        <div key={q} style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6, lineHeight: 1.4 }}>
            {i + 1}. {q}
          </label>
          <textarea
            value={answers[i] || ""}
            onChange={(e) => {
              const next = [...answers];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8,
              border: "1px solid #E2DFD6", fontSize: 14, fontFamily: "inherit", color: NAVY,
              resize: "vertical",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function StepDots({ step }) {
  const idx = STEP_ORDER.indexOf(step);
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          style={{
            height: 4, flex: 1, borderRadius: 999,
            background: i <= idx ? GOLD : "#E2DFD6",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Post-session flow:
 * Experience → Reflection → Client feedback → Reflection update → Facts → AI suggestions (optional)
 * (AI suggestions later replaced by a real coach.)
 */
export default function SessionDebrief({
  open,
  onClose,
  onFinished,
  himself,
  client,
  aim,
  setting,
  displayMessages,
  conversationId,
  callAI,
  onSaveDebrief,
}) {
  const [step, setStep] = useState("reflection");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientFeedback, setClientFeedback] = useState("");
  const [reflectionAnswers, setReflectionAnswers] = useState(() => emptyAnswers(REFLECTION_PROMPTS));
  const [updateAnswers, setUpdateAnswers] = useState(() => emptyAnswers(REFLECTION_UPDATE_PROMPTS));
  const [facts, setFacts] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [suggestionsSections, setSuggestionsSections] = useState(null);
  const [saving, setSaving] = useState(false);

  function transcriptText() {
    return displayMessages
      .map((m) => `${m.role === "user" ? himself.name.toUpperCase() + " (agent)" : client.name.toUpperCase() + " (client)"}: ${m.content}`)
      .join("\n\n");
  }

  async function generateFeedback() {
    setLoading(true);
    setError(null);
    try {
      const prompt = buildClientFeedbackPrompt(himself, client, aim, setting);
      const text = await callAI(prompt, [{ role: "user", content: `Transcript:\n\n${transcriptText()}` }]);
      setClientFeedback(text);
    } catch (e) {
      setError("Couldn't generate client feedback. " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateFacts() {
    setLoading(true);
    setError(null);
    try {
      const reflectionJson = serializeReflectionAnswers(REFLECTION_PROMPTS, reflectionAnswers);
      const updateJson = serializeReflectionAnswers(REFLECTION_UPDATE_PROMPTS, updateAnswers);
      const prompt = buildFactsPrompt(himself, client, aim, setting);
      const text = await callAI(prompt, [{
        role: "user",
        content: `Transcript:\n\n${transcriptText()}\n\nTrainee reflection before client feedback (context only — do not coach):\n${formatReflectionForPrompt(reflectionJson)}\n\nTrainee reflection update after client feedback (context only — do not coach):\n${formatReflectionForPrompt(updateJson)}`,
      }]);
      setFacts(text);
    } catch (e) {
      setError("Couldn't generate facts. " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const reflectionJson = serializeReflectionAnswers(REFLECTION_PROMPTS, reflectionAnswers);
      const updateJson = serializeReflectionAnswers(REFLECTION_UPDATE_PROMPTS, updateAnswers);
      const prompt = buildEvalPrompt(himself, client, aim, setting);
      const text = await callAI(prompt, [{
        role: "user",
        content: `Transcript:\n\n${transcriptText()}\n\nSession facts (context):\n${facts || "(none)"}\n\nTrainee reflection before client feedback:\n${formatReflectionForPrompt(reflectionJson)}\n\nClient feedback:\n${clientFeedback || "(none)"}\n\nTrainee reflection update:\n${formatReflectionForPrompt(updateJson)}`,
      }]);
      setSuggestions(text);
      setSuggestionsSections(parseEvalSections(text));
    } catch (e) {
      setError("Couldn't generate AI suggestions. " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setStep("reflection");
    setClientFeedback("");
    setReflectionAnswers(emptyAnswers(REFLECTION_PROMPTS));
    setUpdateAnswers(emptyAnswers(REFLECTION_UPDATE_PROMPTS));
    setFacts("");
    setSuggestions("");
    setSuggestionsSections(null);
    setError(null);
    setLoading(false);
  }, [open]);

  function goToFeedback() {
    setStep("feedback");
    setClientFeedback("");
    generateFeedback();
  }

  function goToFacts() {
    setStep("facts");
    setFacts("");
    generateFacts();
  }

  function goToSuggestions() {
    setStep("suggestions");
    setSuggestions("");
    setSuggestionsSections(null);
    generateSuggestions();
  }

  async function finish({ includeSuggestions = false } = {}) {
    setSaving(true);
    setError(null);
    try {
      if (onSaveDebrief) {
        await onSaveDebrief({
          clientFeedback,
          reflection: serializeReflectionAnswers(REFLECTION_PROMPTS, reflectionAnswers),
          reflectionUpdate: serializeReflectionAnswers(REFLECTION_UPDATE_PROMPTS, updateAnswers),
          facts,
          suggestions: includeSuggestions ? suggestions : null,
          suggestionsSections: includeSuggestions ? suggestionsSections : null,
          conversationId,
        });
      }
      setStep("done");
      if (onFinished) onFinished();
    } catch (e) {
      setError("Couldn't save this session debrief. " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const titles = {
    reflection: "Your reflection",
    feedback: "Client feedback",
    reflection_update: "Update your reflection",
    facts: "Session facts",
    suggestions: "AI suggestions",
    done: "Session complete",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 24, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
          <X size={20} />
        </button>

        {step !== "done" && <StepDots step={step} />}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sparkles size={18} color={GOLD} />
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: 0 }}>{titles[step]}</h2>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4, marginBottom: 18 }}>
          Session with {client.name}
          {step === "reflection" && " — your view first, before seeing how the client felt"}
          {step === "feedback" && " — how the client felt (not coaching)"}
          {step === "reflection_update" && " — compare your first reflection with the client's feedback"}
          {step === "facts" && " — observations only, no advice"}
          {step === "suggestions" && " — optional coaching tips (later replaced by a real coach)"}
        </p>

        {error && <div style={{ background: "#FCE4E4", color: "#7A2E3A", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        {step === "reflection" && (
          <>
            <QuestionAnswerList
              prompts={REFLECTION_PROMPTS}
              answers={reflectionAnswers}
              onChange={setReflectionAnswers}
              placeholder="Your answer..."
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={goToFeedback} style={primaryBtnStyle(false)}>
                Continue to client feedback <ArrowRight size={16} />
              </button>
              <button onClick={goToFeedback} style={secondaryBtnStyle}>
                Skip for now
              </button>
            </div>
          </>
        )}

        {step === "feedback" && (
          <>
            {loading ? (
              <div style={{ padding: "28px 0", textAlign: "center", color: "#6B7280", fontSize: 14 }}>
                {client.name} is sharing how they felt...
              </div>
            ) : (
              <div style={{ background: "#F7F4EE", borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.65, color: NAVY, whiteSpace: "pre-wrap", marginBottom: 18 }}>
                {clientFeedback}
              </div>
            )}
            <button
              disabled={loading || !clientFeedback}
              onClick={() => setStep("reflection_update")}
              style={primaryBtnStyle(loading || !clientFeedback)}
            >
              Continue <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === "reflection_update" && (
          <>
            <QuestionAnswerList
              prompts={REFLECTION_UPDATE_PROMPTS}
              answers={updateAnswers}
              onChange={setUpdateAnswers}
              placeholder="Your answer after reading the client's feedback..."
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={goToFacts} style={primaryBtnStyle(false)}>
                Continue to facts <ArrowRight size={16} />
              </button>
              <button onClick={goToFacts} style={secondaryBtnStyle}>
                Skip for now
              </button>
            </div>
          </>
        )}

        {step === "facts" && (
          <>
            {loading ? (
              <div style={{ padding: "28px 0", textAlign: "center", color: "#6B7280", fontSize: 14 }}>
                Gathering session observations...
              </div>
            ) : (
              <div style={{ background: "#F7F4EE", borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.65, color: NAVY, whiteSpace: "pre-wrap", marginBottom: 18 }}>
                {facts}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={loading || !facts || saving}
                onClick={goToSuggestions}
                style={primaryBtnStyle(loading || !facts || saving)}
              >
                Get AI suggestions <ArrowRight size={16} />
              </button>
              <button
                disabled={loading || !facts || saving}
                onClick={() => finish({ includeSuggestions: false })}
                style={secondaryBtnStyle}
              >
                {saving ? "Saving..." : "Finish without suggestions"}
              </button>
            </div>
          </>
        )}

        {step === "suggestions" && (
          <>
            {loading ? (
              <div style={{ padding: "28px 0", textAlign: "center", color: "#6B7280", fontSize: 14 }}>
                Preparing coaching suggestions...
              </div>
            ) : (
              <div style={{ background: "#F7F4EE", borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.65, color: NAVY, whiteSpace: "pre-wrap", marginBottom: 18 }}>
                {suggestions}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={loading || !suggestions || saving}
                onClick={() => finish({ includeSuggestions: true })}
                style={primaryBtnStyle(loading || !suggestions || saving)}
              >
                {saving ? "Saving..." : "Finish session"}
              </button>
              {!loading && !suggestions && (
                <button onClick={generateSuggestions} style={secondaryBtnStyle}>
                  Retry
                </button>
              )}
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <p style={{ fontSize: 14, color: NAVY, lineHeight: 1.6, marginBottom: 18 }}>
              Your reflection, client feedback, update, facts{suggestions ? ", and AI suggestions" : ""} are saved. You can review them anytime in My History.
            </p>
            <button onClick={onClose} style={primaryBtnStyle(false)}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function primaryBtnStyle(disabled) {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "11px 18px", borderRadius: 8, border: "none",
    background: GOLD, color: NAVY, fontWeight: 700, fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
  };
}

const secondaryBtnStyle = {
  padding: "11px 14px", borderRadius: 8, border: "1px solid #E2DFD6",
  background: "#fff", color: NAVY, fontWeight: 600, fontSize: 13, cursor: "pointer",
};
