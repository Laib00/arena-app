import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { NAVY, GOLD, inputStyle } from "../theme";

export default function NotesPanel({ onClose, conversationId, profile, clientName }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    loadNotes();
  }, [conversationId]);

  async function loadNotes() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("progress_notes")
      .select("*, author:author_id(full_name, email)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setNotes(data || []);
    setLoading(false);
  }

  async function addNote() {
    const text = newNote.trim();
    if (!text || !profile) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("progress_notes").insert({
        user_id: profile.id,
        author_id: profile.id,
        conversation_id: conversationId,
        note: text,
      });
      if (err) throw err;
      setNewNote("");
      await loadNotes();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: 28, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
          <X size={20} />
        </button>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: 0 }}>Progress Notes</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4, marginBottom: 20 }}>Session with {clientName}</p>

        {!conversationId && (
          <div style={{ fontSize: 13, color: "#9CA3AF" }}>Notes will be available once this session has started saving.</div>
        )}

        {conversationId && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this session..."
                rows={3}
                style={{ ...inputStyle, flex: 1, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
            <button
              onClick={addNote}
              disabled={saving || !newNote.trim()}
              style={{
                padding: "9px 16px", borderRadius: 8, border: "none", background: GOLD, color: NAVY,
                fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", marginBottom: 22,
              }}
            >
              {saving ? "Saving..." : "Add Note"}
            </button>

            {error && <div style={{ background: "#FCE4E4", color: "#7A2E3A", padding: "9px 12px", borderRadius: 7, fontSize: 13, marginBottom: 14 }}>{error}</div>}

            {loading ? (
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>Loading notes...</div>
            ) : notes.length === 0 ? (
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>No notes yet for this session.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notes.map((n) => (
                  <div key={n.id} style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{n.author?.full_name || n.author?.email || "Unknown"}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                    <div style={{ fontSize: 14, color: NAVY, whiteSpace: "pre-wrap" }}>{n.note}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
