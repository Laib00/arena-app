import React, { useEffect, useState } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { DISC } from "./constants";

const NAVY = "#0A1628";
const GOLD = "#D4AF37";

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

const REFLECTION_PROMPTS = [
  "What moment in the conversation felt hardest for you, and why?",
  "What would you try differently if you met this client again?",
  "What did you notice about how the client responded to you?",
];

function StepDots({ step }) {
  const steps = ["feedback", "reflection", "facts"];
  const idx = steps.indexOf(step);
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {steps.map((s, i) => (
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
 * Post-session flow: Client feedback → Reflection → Facts.
 * Optional coaching eval stays separate (temporary / later coach stage).
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
  const [step, setStep] = useState("feedback"); // feedback | reflection | facts | done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientFeedback, setClientFeedback] = useState("");
  const [reflection, setReflection] = useState("");
  const [facts, setFacts] = useState("");
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
      const prompt = buildFactsPrompt(himself, client, aim, setting);
      const text = await callAI(prompt, [{
        role: "user",
        content: `Transcript:\n\n${transcriptText()}\n\nTrainee reflection (for context only — do not coach from it):\n${reflection || "(none)"}`,
      }]);
      setFacts(text);
    } catch (e) {
      setError("Couldn't generate facts. " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setStep("feedback");
    setClientFeedback("");
    setReflection("");
    setFacts("");
    setError(null);
    generateFeedback();
  }, [open]);

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      if (onSaveDebrief) {
        await onSaveDebrief({
          clientFeedback,
          reflection: reflection.trim(),
          facts,
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
    feedback: "Client feedback",
    reflection: "Your reflection",
    facts: "Session facts",
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
          {step === "feedback" && " — how the client felt (not coaching)"}
          {step === "reflection" && " — take a moment before seeing the facts"}
          {step === "facts" && " — observations only, no advice"}
        </p>

        {error && <div style={{ background: "#FCE4E4", color: "#7A2E3A", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}

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
              onClick={() => setStep("reflection")}
              style={primaryBtnStyle(loading || !clientFeedback)}
            >
              Continue to reflection <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === "reflection" && (
          <>
            <div style={{ marginBottom: 12 }}>
              {REFLECTION_PROMPTS.map((q) => (
                <div key={q} style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 6 }}>• {q}</div>
              ))}
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write your reflection here (a few sentences is enough)..."
              rows={6}
              style={{
                width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8,
                border: "1px solid #E2DFD6", fontSize: 14, fontFamily: "inherit", color: NAVY,
                resize: "vertical", marginBottom: 14,
              }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => { setStep("facts"); generateFacts(); }}
                style={primaryBtnStyle(false)}
              >
                Continue to facts <ArrowRight size={16} />
              </button>
              <button
                onClick={() => { setStep("facts"); generateFacts(); }}
                style={secondaryBtnStyle}
              >
                Skip reflection
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
            <button
              disabled={loading || !facts || saving}
              onClick={finish}
              style={primaryBtnStyle(loading || !facts || saving)}
            >
              {saving ? "Saving..." : "Finish session"}
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <p style={{ fontSize: 14, color: NAVY, lineHeight: 1.6, marginBottom: 18 }}>
              Your client feedback, reflection, and facts are saved. You can review them anytime in My History.
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
