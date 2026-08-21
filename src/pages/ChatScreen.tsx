import { useState, type RefObject } from "react";
import { Send, Award, Target } from "lucide-react";
import { NAVY, GOLD, CREAM } from "../theme";
import SessionDebrief from "../SessionDebrief";
import GradeBadge from "../components/GradeBadge";
import MessageBubble from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";
import AutoResizeTextarea from "../components/AutoResizeTextarea";
import NotesPanel from "../components/NotesPanel";
import PageHeader from "../components/PageHeader";
import type {
  AgentProfile,
  Aim,
  Challenge,
  ChatMessage,
  Persona,
  Setting,
  UserProfile,
} from "../types/domain";

type ChatScreenProps = {
  himself: AgentProfile;
  client: Persona;
  aim: Aim;
  setting: Setting;
  challenge?: Challenge | null;
  displayMessages: ChatMessage[];
  loading: boolean;
  error: string | null;
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  onEndSession: () => void;
  resetAll: () => void;
  conversationId: string | null;
  profile: UserProfile | null;
  onMenuToggle?: () => void;
  debriefOpen: boolean;
  setDebriefOpen: (open: boolean) => void;
  callGemini: (systemPrompt: string, messages: ChatMessage[]) => Promise<string>;
  onSaveDebrief: (payload: unknown) => Promise<void> | void;
};

export default function ChatScreen({
  himself,
  client,
  aim,
  setting,
  challenge,
  displayMessages,
  loading,
  error,
  input,
  setInput,
  sendMessage,
  scrollRef,
  onEndSession,
  resetAll,
  conversationId,
  profile,
  onMenuToggle,
  debriefOpen,
  setDebriefOpen,
  callGemini,
  onSaveDebrief,
}: ChatScreenProps) {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PageHeader
        brand="back"
        onHome={resetAll}
        onMenuToggle={onMenuToggle}
        title={client.name}
        subtitle={`DISC ${client.disc} · ${aim.key} · ${setting.key}`}
        actions={
          <>
            <GradeBadge grade={client.grade} />
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="arena-topbar-link"
            >
              Notes
            </button>
            <button
              type="button"
              onClick={onEndSession}
              disabled={displayMessages.length === 0}
              style={{
                background: GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13,
                cursor: displayMessages.length === 0 ? "not-allowed" : "pointer",
                opacity: displayMessages.length === 0 ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
              }}
            >
              <Award size={16} /> End Session
            </button>
          </>
        }
      />

      {challenge?.label && (
        <div className="arena-challenge-banner">
          <Target size={15} strokeWidth={2.2} aria-hidden="true" />
          <span className="arena-challenge-banner-label">Challenge</span>
          <span className="arena-challenge-banner-name">{challenge.label}</span>
        </div>
      )}

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
