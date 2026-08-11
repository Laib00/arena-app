import React from "react";

export const NAVY = "#0A1628";
export const GOLD = "#D4AF37";
export const CREAM = "#F7F4EE";

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
  }
  .arena-topbar-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-left: auto;
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
    background: #0A1628;
    color: #fff;
    padding: 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
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
