import React from "react";

export const NAVY = "#0A1628";
export const ACCENT = "#FD8841";
export const ACCENT_TINT = "#FFF4EC";
/** Legacy alias — app screens still import GOLD. Prefer ACCENT in new code. */
export const GOLD = ACCENT;
export const CREAM = "#F7F5F2";

export const GRADE_COLOR = {
  Easy: "#4C8F5F",
  Medium: "#C98A2C",
  Hard: "#B5502F",
  Impossible: "#7A2E3A",
};

export const inputStyle = {
  width: "100%", padding: "9px 10px", borderRadius: 7, border: "1px solid #E2DFD6",
  fontSize: 14, fontFamily: "inherit", color: NAVY, background: "#fff", boxSizing: "border-box",
};

export const ARENA_RESPONSIVE_CSS = `
  .arena-backdrop { display: none; }

  .arena-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 14px 24px;
    font-size: 13px;
    color: #6B7280;
    position: sticky;
    top: 0;
    z-index: 20;
    background: #F7F5F2;
    border-bottom: 1px solid rgba(226, 223, 214, 0.9);
    box-shadow: 0 1px 0 rgba(10, 22, 40, 0.04);
  }
  .arena-topbar-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-left: auto;
  }
  .arena-topbar-brand-mobile {
    display: none;
  }
  .arena-topbar-link {
    background: none;
    border: none;
    cursor: pointer;
    color: #55606F;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-family: inherit;
    padding: 0;
    transition: color 0.15s ease;
  }
  .arena-topbar-link:hover {
    color: #0A1628;
  }

  .arena-sidebar-inner {
    width: 260px;
    flex-shrink: 0;
    background: #0A1628;
    color: #fff;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
  .arena-sidebar-chats {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 8px;
  }
  .arena-sidebar-nav {
    display: none;
    flex-shrink: 0;
    border-top: 1px solid rgba(255,255,255,0.12);
    padding: 10px 8px 12px;
    background: #0A1628;
  }
  .arena-sidebar-nav-user {
    font-size: 12px;
    color: rgba(255,255,255,0.55);
    padding: 4px 10px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .arena-sidebar-nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    text-align: left;
    padding: 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
  .arena-sidebar-nav-btn:hover {
    background: rgba(255,255,255,0.08);
  }

  .arena-page-header {
    background: #fff;
    color: #0A1628;
    padding: 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid rgba(226, 223, 214, 0.9);
  }
  .arena-page-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .arena-page-header-title {
    font-weight: 700;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .arena-history-layout {
    display: flex;
    height: calc(100vh - 53px);
  }
  .arena-history-list {
    width: 320px;
    border-right: 1px solid #E2DFD6;
    overflow-y: auto;
    background: #fff;
    flex-shrink: 0;
  }
  .arena-history-detail {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 28px;
  }
  .arena-history-back-mobile { display: none; }
  .arena-history-transcript {
    background: #fff;
    border: 1px solid #E2DFD6;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 24px;
    max-height: 300px;
    overflow-y: auto;
    word-break: break-word;
  }
  .arena-notes-row {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }

  .arena-practice-modal {
    scrollbar-width: thin;
    scrollbar-color: rgba(10, 22, 40, 0.22) transparent;
  }
  .arena-practice-modal::-webkit-scrollbar {
    width: 6px;
  }
  .arena-practice-modal::-webkit-scrollbar-track {
    background: transparent;
    margin: 12px 0;
  }
  .arena-practice-modal::-webkit-scrollbar-thumb {
    background: rgba(10, 22, 40, 0.2);
    border-radius: 999px;
  }
  .arena-practice-modal::-webkit-scrollbar-thumb:hover {
    background: rgba(253, 136, 65, 0.55);
  }

  .arena-open-practice-cta {
    isolation: isolate;
  }
  .arena-open-practice-ripple {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid rgba(253, 136, 65, 0.7);
    box-sizing: border-box;
    pointer-events: none;
    animation: arenaOpenPracticeRipple 2.4s ease-out infinite;
  }
  .arena-open-practice-ripple--delay {
    animation-delay: 1.2s;
  }
  @keyframes arenaOpenPracticeRipple {
    0% {
      transform: scale(1);
      opacity: 0.75;
      border-color: rgba(253, 136, 65, 0.85);
    }
    100% {
      transform: scale(4.2);
      opacity: 0;
      border-color: rgba(253, 136, 65, 0.15);
    }
  }

  @media (max-width: 900px) {
    .arena-home-practice-grid {
      grid-template-columns: 1fr !important;
    }
    .arena-home-bottom-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 768px) {
    .arena-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 40;
      transform: translateX(-100%);
      transition: transform 0.2s ease;
    }
    .arena-sidebar.open { transform: translateX(0); }
    .arena-backdrop.open {
      display: block !important;
      position: fixed;
      inset: 0;
      background: rgba(10,22,40,0.5);
      z-index: 39;
    }
    .arena-menu-toggle { display: flex !important; }
    .arena-sidebar-nav { display: block; }
    .arena-topbar-desktop-nav { display: none !important; }
    .arena-topbar-brand-mobile { display: flex !important; align-items: center; }
    .arena-agent-grid { grid-template-columns: 1fr !important; }
    .arena-setup-wrap { padding: 24px 14px 60px !important; }
    .arena-profile-grid { grid-template-columns: 1fr !important; }
    .arena-agent-summary {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }
    .arena-setup-header h1 { font-size: 26px !important; }

    .arena-topbar {
      padding: 10px 14px;
      gap: 8px;
    }

    .arena-page-header {
      padding: 10px 14px;
      flex-wrap: wrap;
    }
    .arena-page-header .arena-header-hide-mobile { display: none; }
    .arena-page-header-title { font-size: 14px; }

    .arena-history-layout {
      flex-direction: column;
      height: auto;
      min-height: calc(100vh - 53px);
    }
    .arena-history-list {
      width: 100% !important;
      max-height: 42vh;
      border-right: none;
      border-bottom: 1px solid #E2DFD6;
    }
    .arena-history-layout.has-selection .arena-history-list { display: none; }
    .arena-history-layout.has-selection .arena-history-detail {
      min-height: calc(100vh - 53px);
    }
    .arena-history-detail { padding: 16px !important; }
    .arena-history-back-mobile {
      display: inline-flex !important;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: #0A1628;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      padding: 0;
      margin-bottom: 14px;
    }
    .arena-history-transcript { max-height: none; }
    .arena-notes-row { flex-direction: column; }
    .arena-notes-row button { width: 100%; padding: 12px !important; }
  }
`;

export function ResponsiveStyles() {
  return React.createElement("style", null, ARENA_RESPONSIVE_CSS);
}
