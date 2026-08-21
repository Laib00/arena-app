import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../supabaseClient";
import { ReflectionAnswersView } from "../SessionDebrief";
import { NAVY, GOLD, CREAM, ACCENT_TINT, inputStyle } from "../theme";
import GradeBadge from "../components/GradeBadge";
import PageHeader from "../components/PageHeader";
import type { ConversationSession, UserProfile } from "../types/domain";

type HistoryConversation = ConversationSession & {
  trainee?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
};

type CoachingReport = {
  reflection?: string | null;
  reflection_update?: string | null;
  client_feedback?: string | null;
  facts?: string | null;
  overall?: string | null;
  strengths?: string | null;
  areas_to_improve?: string | null;
  client_fit?: string | null;
  key_recommendation?: string | null;
  [key: string]: unknown;
};

type HistoryDetail = {
  messages: Array<{ id?: string; role: string; content: string; created_at?: string }>;
  report: CoachingReport | null;
  notes: Array<{
    id: string;
    note: string;
    created_at: string;
    author?: { full_name?: string | null; email?: string | null } | null;
  }>;
};

export default function SessionHistory({
  profile,
  scope,
  onBack,
  onSignOut,
  onContinue,
}: {
  profile: UserProfile;
  scope: "mine" | "team" | string;
  onBack: () => void;
  onSignOut: () => void;
  onContinue?: (conversation: HistoryConversation) => void;
}) {
  const [conversations, setConversations] = useState<HistoryConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);
    let query = supabase
      .from("conversations")
      .select("*, trainee:user_id(full_name, email)")
      .order("started_at", { ascending: false });
    if (scope === "mine") query = query.eq("user_id", profile.id);
    const { data } = await query;
    setConversations(data || []);
    setLoading(false);
  }

  async function openConversation(conv: HistoryConversation) {
    setSelected(conv.id);
    setDetail(null);
    const [{ data: messages }, { data: reports }, { data: notes }] = await Promise.all([
      supabase.from("messages").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: true }),
      supabase.from("coaching_reports").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("progress_notes").select("*, author:author_id(full_name, email)").eq("conversation_id", conv.id).order("created_at", { ascending: false }),
    ]);
    setDetail({
      messages: (messages as HistoryDetail["messages"]) || [],
      report: (reports?.[0] as CoachingReport) || null,
      notes: (notes as HistoryDetail["notes"]) || [],
    });
  }

  async function addManagerNote(conv: HistoryConversation) {
    const text = newNote.trim();
    if (!text) return;
    setSavingNote(true);
    await supabase.from("progress_notes").insert({
      user_id: conv.user_id,
      author_id: profile.id,
      conversation_id: conv.id,
      note: text,
    });
    setNewNote("");
    await openConversation(conv);
    setSavingNote(false);
  }

  function backToSessionList() {
    setSelected(null);
    setDetail(null);
  }

  const selectedConv = conversations.find((c) => c.id === selected);

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "-apple-system, sans-serif" }}>
      <PageHeader
        brand="back"
        onHome={onBack}
        title={scope === "mine" ? "My History" : "Team Dashboard"}
        actions={
          <>
            <button type="button" onClick={onBack} className="arena-topbar-link">Home</button>
            <button type="button" onClick={onSignOut} className="arena-topbar-link">Sign Out</button>
          </>
        }
      />

      <div className={`arena-history-layout${selected ? " has-selection" : ""}`}>
        <div className="arena-history-list">
          {loading ? (
            <div style={{ padding: 20, fontSize: 13, color: "#9CA3AF" }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: "#9CA3AF" }}>No sessions recorded yet.</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "14px 18px", borderBottom: "1px solid #F0EEE7",
                  background: selected === c.id ? ACCENT_TINT : "#fff",
                }}
              >
                <button
                  onClick={() => openConversation(c)}
                  style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: NAVY }}>{c.trainee?.full_name || c.trainee?.email || "Unknown trainee"}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    {c.client_name} <GradeBadge grade={c.client_grade || "Medium"} /> · {c.industry}
                    {!c.ended_at && <span style={{ color: GOLD, fontWeight: 700 }}> · Open</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{c.started_at ? new Date(c.started_at).toLocaleString() : ""}</div>
                </button>
                {!c.ended_at && scope === "mine" && onContinue && (
                  <button
                    onClick={() => onContinue(c)}
                    style={{ marginTop: 8, padding: "6px 12px", borderRadius: 6, border: "none", background: GOLD, color: NAVY, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                  >
                    Continue this session
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="arena-history-detail">
          {!selectedConv ? (
            <div style={{ color: "#9CA3AF", fontSize: 14 }}>Select a session to review it.</div>
          ) : !detail ? (
            <div style={{ color: "#9CA3AF", fontSize: 14 }}>Loading session...</div>
          ) : (
            <div style={{ maxWidth: 700 }}>
              <button type="button" className="arena-history-back-mobile" onClick={backToSessionList}>
                <ArrowLeft size={15} /> Back to sessions
              </button>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, marginBottom: 4, wordBreak: "break-word" }}>
                {selectedConv.trainee?.full_name || selectedConv.trainee?.email} — {selectedConv.client_name}
              </h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
                {selectedConv.industry} · {selectedConv.aim} · {selectedConv.setting} · <GradeBadge grade={selectedConv.client_grade || "Medium"} />
              </p>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Transcript</div>
              <div className="arena-history-transcript">
                {detail.messages.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9CA3AF" }}>No messages recorded.</div>
                ) : (
                  detail.messages.map((m) => (
                    <div key={m.id} style={{ marginBottom: 10, fontSize: 13.5 }}>
                      <span style={{ fontWeight: 700, color: m.role === "agent" ? NAVY : "#B5502F" }}>
                        {m.role === "agent" ? selectedConv.trainee?.full_name || "Agent" : selectedConv.client_name}:
                      </span>{" "}
                      {m.content}
                    </div>
                  ))
                )}
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Reflection (before client feedback)</div>
              <ReflectionAnswersView value={detail.report?.reflection ?? null} />

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Client feedback</div>
              {detail.report?.client_feedback ? (
                <div style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 10, padding: 16, marginBottom: 24, whiteSpace: "pre-wrap", fontSize: 13.5 }}>
                  {String(detail.report.client_feedback)}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>No client feedback for this session.</div>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Reflection update (after client feedback)</div>
              <ReflectionAnswersView value={detail.report?.reflection_update ?? null} />

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Session facts</div>
              {detail.report?.facts ? (
                <div style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 10, padding: 16, marginBottom: 24, whiteSpace: "pre-wrap", fontSize: 13.5 }}>
                  {String(detail.report.facts)}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>No facts recorded.</div>
              )}

              {detail.report && (detail.report.overall || detail.report.strengths || detail.report.areas_to_improve || detail.report.key_recommendation) && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>AI suggestions</div>
                  <div style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 10, padding: 16, marginBottom: 24 }}>
                    {(["overall", "strengths", "areas_to_improve", "client_fit", "key_recommendation"] as const).map((f) =>
                      detail.report?.[f] ? (
                        <div key={f} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase" }}>{f.replace(/_/g, " ")}</div>
                          <div style={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>{String(detail.report[f])}</div>
                        </div>
                      ) : null
                    )}
                  </div>
                </>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Progress Notes</div>
              <div className="arena-notes-row">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this trainee's session..."
                  rows={2}
                  style={{ ...inputStyle, flex: 1, resize: "vertical", fontFamily: "inherit" }}
                />
                <button
                  onClick={() => addManagerNote(selectedConv)}
                  disabled={savingNote || !newNote.trim()}
                  style={{ padding: "0 18px", borderRadius: 8, border: "none", background: GOLD, color: NAVY, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  Add
                </button>
              </div>
              {detail.notes.length === 0 ? (
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>No notes yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {detail.notes.map((n) => (
                    <div key={n.id} style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{n.author?.full_name || n.author?.email}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>{new Date(n.created_at).toLocaleString()}</div>
                      <div style={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>{n.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
