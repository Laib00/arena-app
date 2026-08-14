import React, { useState } from "react";
import { X, Users, Trash2, LogOut } from "lucide-react";
import { NAVY, GOLD } from "../theme";
import GradeBadge from "./GradeBadge";

export default function Sidebar({
  openConversations, activeId, profile,
  onSelect, onCloseChat, onDelete, onClose,
  onProfileView, onHistoryView, onTeamView, onSignOut,
}) {
  const [pendingRemove, setPendingRemove] = useState(null); // conversation row or null

  function navAction(action) {
    onClose();
    action();
  }

  async function keepInHistory() {
    const conv = pendingRemove;
    setPendingRemove(null);
    if (conv) await onCloseChat(conv.id);
  }

  async function deleteForever() {
    const conv = pendingRemove;
    setPendingRemove(null);
    if (conv) await onDelete(conv.id);
  }

  return (
    <div className="arena-sidebar-inner">
      <div style={{ padding: "18px 16px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/arena-logo-128.png"
              alt=""
              width={22}
              height={22}
              decoding="async"
              style={{ display: "block", flexShrink: 0 }}
            />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 15, letterSpacing: 0.5 }}>Arena</span>
          </div>
          <button
            onClick={onClose}
            className="arena-menu-toggle"
            style={{ display: "none", background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px 8px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.6, flexShrink: 0 }}>
        Open Chats
      </div>
      <div className="arena-sidebar-chats">
        {openConversations.length === 0 ? (
          <div style={{ padding: "10px 8px", fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
            No open chats. Start one to see it here.
          </div>
        ) : (
          openConversations.map((c) => {
            const active = c.id === activeId;
            return (
              <div
                key={c.id}
                className="arena-sidebar-item"
                style={{
                  display: "flex", alignItems: "center", gap: 4, marginBottom: 3, borderRadius: 7,
                  background: active ? "rgba(253,136,65,0.18)" : "transparent",
                }}
              >
                <button
                  onClick={() => onSelect(c)}
                  style={{
                    display: "block", flex: 1, minWidth: 0, textAlign: "left", padding: "9px 10px",
                    borderRadius: 7, border: "none", cursor: "pointer", background: "transparent",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.client_name}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                    <GradeBadge grade={c.client_grade} />
                    <span>{c.industry}</span>
                  </div>
                </button>
                <button
                  onClick={() => setPendingRemove(c)}
                  title="Remove chat"
                  style={{
                    background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)",
                    padding: 6, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#E88787"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="arena-sidebar-nav">
        {profile && (
          <div className="arena-sidebar-nav-user">
            {profile.full_name || profile.email}
            {profile.role === "manager" && <span style={{ color: GOLD, fontWeight: 700 }}> · Manager</span>}
          </div>
        )}
        <button type="button" className="arena-sidebar-nav-btn" onClick={() => navAction(onProfileView)}>
          Profile
        </button>
        <button type="button" className="arena-sidebar-nav-btn" onClick={() => navAction(onHistoryView)}>
          My History
        </button>
        {profile?.role === "manager" && (
          <button type="button" className="arena-sidebar-nav-btn" onClick={() => navAction(onTeamView)}>
            <Users size={14} /> Team Dashboard
          </button>
        )}
        <button type="button" className="arena-sidebar-nav-btn" onClick={() => navAction(onSignOut)}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {pendingRemove && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-chat-title"
          style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 20,
          }}
          onClick={() => setPendingRemove(null)}
        >
          <div
            style={{
              background: "#fff", color: NAVY, borderRadius: 12, padding: "18px 16px", width: "100%", maxWidth: 280,
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div id="remove-chat-title" style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Remove chat with {pendingRemove.client_name}?
            </div>
            <p style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.45, margin: "0 0 14px" }}>
              Choose whether to keep a read-only copy in My History, or delete it forever.
            </p>
            <button
              type="button"
              onClick={keepInHistory}
              style={{
                display: "block", width: "100%", marginBottom: 8, padding: "10px 12px", borderRadius: 8,
                border: "none", background: GOLD, color: NAVY, fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
              }}
            >
              Keep in History
              <div style={{ fontWeight: 500, fontSize: 11, marginTop: 2, opacity: 0.85 }}>
                Close this open chat. You can still view it in My History, but not continue it.
              </div>
            </button>
            <button
              type="button"
              onClick={deleteForever}
              style={{
                display: "block", width: "100%", marginBottom: 8, padding: "10px 12px", borderRadius: 8,
                border: "1px solid #F0C0C0", background: "#FFF5F5", color: "#B5502F", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
              }}
            >
              Delete forever
              <div style={{ fontWeight: 500, fontSize: 11, marginTop: 2, opacity: 0.9 }}>
                Remove from Open Chats and My History. This can&apos;t be undone.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPendingRemove(null)}
              style={{
                display: "block", width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "none", background: "transparent", color: "#6B7280", fontSize: 13, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
