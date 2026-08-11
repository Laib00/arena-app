import React, { useState } from "react";
import { Send, Award, ArrowLeft, Menu } from "lucide-react";
import { NAVY, GOLD, CREAM } from "../theme";
import SessionDebrief from "../SessionDebrief";
import GradeBadge from "../components/GradeBadge";
import MessageBubble from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";
import AutoResizeTextarea from "../components/AutoResizeTextarea";
import NotesPanel from "../components/NotesPanel";

export default function ChatScreen({
  himself, client, aim, setting, displayMessages, loading, error,
  input, setInput, sendMessage, scrollRef, onEndSession, resetAll,
  conversationId, profile, onMenuToggle,
  debriefOpen, setDebriefOpen, callGemini, onSaveDebrief,
}) {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ background: NAVY, color: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onMenuToggle}
            className="arena-menu-toggle"
            style={{ display: "none", background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}
          >
            <Menu size={20} />
          </button>
          <button onClick={resetAll} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, opacity: 0.85 }}>
            <ArrowLeft size={15} /> New
          </button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{client.name} <GradeBadge grade={client.grade} /></div>
            <div style={{ fontSize: 11.5, opacity: 0.75 }}>DISC {client.disc} · {aim.key} · {setting.key}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setNotesOpen(true)}
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Notes
          </button>
          <button
            onClick={onEndSession}
            disabled={displayMessages.length === 0}
            style={{
              background: GOLD, color: NAVY, border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13,
              cursor: displayMessages.length === 0 ? "not-allowed" : "pointer",
              opacity: displayMessages.length === 0 ? 0.5 : 1,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Award size={16} /> End Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px", background: CREAM }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {displayMessages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} clientName={client.name} agentName={himself.name} />
          ))}
          {loading && <TypingIndicator name={client.name} />}
          {error && (
            <div style={{ background: "#FCE4E4", color: "#7A2E3A", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginTop: 8 }}>{error}</div>
          )}
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid #E2DFD6", background: "#fff", padding: "14px 20px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <AutoResizeTextarea
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            placeholder="Type your response as the agent..."
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: NAVY, color: "#fff", border: "none", borderRadius: 8, width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <SessionDebrief
        open={debriefOpen}
        onClose={() => setDebriefOpen(false)}
        onFinished={() => {}}
        himself={himself}
        client={client}
        aim={aim}
        setting={setting}
        displayMessages={displayMessages}
        conversationId={conversationId}
        callAI={callGemini}
        onSaveDebrief={onSaveDebrief}
      />

      {notesOpen && (
        <NotesPanel
          onClose={() => setNotesOpen(false)}
          conversationId={conversationId}
          profile={profile}
          clientName={client.name}
        />
      )}
    </div>
  );
}
