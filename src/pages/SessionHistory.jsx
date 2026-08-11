import React, { useState, useEffect } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";
import { ReflectionAnswersView } from "../SessionDebrief";
import { NAVY, GOLD, CREAM, inputStyle } from "../theme";
import GradeBadge from "../components/GradeBadge";

export default function SessionHistory({ profile, scope, onBack, onSignOut, onContinue }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
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

  async function openConversation(conv) {
    setSelected(conv.id);
    setDetail(null);
    const [{ data: messages }, { data: reports }, { data: notes }] = await Promise.all([
      supabase.from("messages").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: true }),
      supabase.from("coaching_reports").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("progress_notes").select("*, author:author_id(full_name, email)").eq("conversation_id", conv.id).order("created_at", { ascending: false }),
    ]);
    setDetail({ messages: messages || [], report: reports?.[0] || null, notes: notes || [] });
  }

  async function addManagerNote(conv) {
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
      <div className="arena-page-header">
        <div className="arena-page-header-left">
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, flexShrink: 0 }}>
            <ArrowLeft size={15} /> Back to app
          </button>
          <div className="arena-header-hide-mobile" style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)" }} />
          <div className="arena-page-header-title">{scope === "mine" ? "My History" : "Team Dashboard"}</div>
        </div>
        <button onClick={onSignOut} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

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
                  background: selected === c.id ? "#FFFBEF" : "#fff",
                }}
              >
                <button
                  onClick={() => openConversation(c)}
                  style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: NAVY }}>{c.trainee?.full_name || c.trainee?.email || "Unknown trainee"}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    {c.client_name} <GradeBadge grade={c.client_grade} /> · {c.industry}
                    {!c.ended_at && <span style={{ color: GOLD, fontWeight: 700 }}> · Open</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{new Date(c.started_at).toLocaleString()}</div>
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
                {selectedConv.industry} · {selectedConv.aim} · {selectedConv.setting} · <GradeBadge grade={selectedConv.client_grade} />
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
              <ReflectionAnswersView value={detail.report?.reflection} />

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Client feedback</div>
              {detail.report?.client_feedback ? (
                <div style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 10, padding: 16, marginBottom: 24, whiteSpace: "pre-wrap", fontSize: 13.5 }}>
                  {detail.report.client_feedback}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>No client feedback for this session.</div>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Reflection update (after client feedback)</div>
              <ReflectionAnswersView value={detail.report?.reflection_update} />

              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Session facts</div>
              {detail.report?.facts ? (
                <div style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 10, padding: 16, marginBottom: 24, whiteSpace: "pre-wrap", fontSize: 13.5 }}>
                  {detail.report.facts}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>No facts recorded.</div>
              )}

              {detail.report && (detail.report.overall || detail.report.strengths || detail.report.key_recommendation) && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Past coaching notes</div>
                  <div style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 10, padding: 16, marginBottom: 24 }}>
                    {["overall", "strengths", "areas_to_improve", "client_fit", "key_recommendation"].map((f) =>
                      detail.report[f] ? (
                        <div key={f} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase" }}>{f.replace(/_/g, " ")}</div>
                          <div style={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>{detail.report[f]}</div>
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
