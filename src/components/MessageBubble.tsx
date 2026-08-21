import { NAVY } from "../theme";
import type { ChatMessage } from "../types/domain";

type MessageBubbleProps = {
  role: ChatMessage["role"];
  content: string;
  clientName: string;
  agentName: string;
};

export default function MessageBubble({ role, content, clientName, agentName }: MessageBubbleProps) {
  const isAgent = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isAgent ? "flex-end" : "flex-start", marginBottom: 14 }}>
      <div style={{ maxWidth: "78%" }}>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, textAlign: isAgent ? "right" : "left" }}>
          {isAgent ? agentName : clientName}
        </div>
        <div
          style={{
            padding: "10px 14px", borderRadius: 14,
            borderBottomRightRadius: isAgent ? 4 : 14,
            borderBottomLeftRadius: isAgent ? 14 : 4,
            background: isAgent ? NAVY : "#fff",
            color: isAgent ? "#fff" : NAVY,
            border: isAgent ? "none" : "1px solid #E2DFD6",
            fontSize: 14.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
