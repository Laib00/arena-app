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

  .arena-wizard-back {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin: 0 0 10px;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: #6B7280;
    font-weight: 600;
    font-size: 13px;
    font-family: inherit;
  }
  .arena-wizard-back:hover {
    color: #0A1628;
  }

  .arena-wizard-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 22px;
  }
  .arena-wizard-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #E2DFD6;
  }
  .arena-wizard-dot.is-on {
    background: #FD8841;
  }
  .arena-wizard-step-label {
    margin-left: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #9CA3AF;
  }

  .arena-wizard-grades {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .arena-wizard-grade {
    text-align: left;
    padding: 18px 16px;
    border-radius: 14px;
    border: 1px solid #E8E4DC;
    background: #fff;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    box-shadow: 0 6px 18px rgba(10, 22, 40, 0.05);
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }
  .arena-wizard-grade:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(10, 22, 40, 0.1);
    border-color: var(--grade-color, #FD8841);
  }
  .arena-wizard-grade p {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6B7280;
  }

  .arena-open-practice-card,
  .arena-challenge-card {
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .arena-open-practice-card:hover,
  .arena-challenge-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(10, 22, 40, 0.08);
    border-color: rgba(253, 136, 65, 0.35);
  }
  .arena-open-practice-card:hover {
    box-shadow: 0 16px 36px rgba(10, 22, 40, 0.28);
  }

  .arena-challenge-list {
    display: flex;
    flex-direction: column;
  }
  .arena-challenge-option {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    text-align: left;
    padding: 14px 10px;
    border: none;
    border-bottom: 1px solid #F0EDE6;
    border-radius: 0;
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    transition: background 0.15s ease;
  }
  .arena-challenge-option:last-child {
    border-bottom: none;
  }
  .arena-challenge-option:hover {
    background: #FFF8F3;
    border-radius: 12px;
  }
  .arena-challenge-option-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #FFF4EC;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .arena-challenge-option-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }
  .arena-challenge-option-title {
    font-size: 15px;
    font-weight: 700;
    color: #0A1628;
    line-height: 1.25;
  }
  .arena-challenge-option-blurb {
    font-size: 13px;
    line-height: 1.45;
    color: #6B7280;
  }
  .arena-challenge-option-chevron {
    flex-shrink: 0;
  }

  .arena-persona-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 14px;
  }

  .arena-persona-card {
    display: flex;
    flex-direction: column;
    width: 100%;
    text-align: left;
    padding: 0;
    border: 1px solid #E8E4DC;
    border-radius: 20px;
    background: #fff;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(10, 22, 40, 0.06);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }
  .arena-persona-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(10, 22, 40, 0.1);
  }
  .arena-persona-card.is-selected {
    border: 2px solid #FD8841;
    background: #FFF4EC;
    box-shadow: 0 12px 28px rgba(253, 136, 65, 0.18);
  }
  .arena-persona-card.is-met {
    border-color: #4C8F5F;
  }

  .arena-persona-top {
    display: flex;
    gap: 14px;
    padding: 14px 14px 12px;
    align-items: stretch;
  }

  .arena-persona-photo {
    width: 118px;
    min-width: 118px;
    height: 132px;
    object-fit: cover;
    border-radius: 14px;
    background: #EFEBE3;
  }
  .arena-persona-photo--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 22px;
    color: #0A1628;
    letter-spacing: 0.04em;
  }

  .arena-persona-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding-top: 2px;
  }

  .arena-persona-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .arena-persona-met-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4C8F5F;
    flex-shrink: 0;
  }

  .arena-persona-name {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .arena-persona-sub {
    font-size: 13px;
    color: #6B7280;
    margin-top: 3px;
  }

  .arena-persona-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .arena-persona-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }
  .arena-persona-chip--green {
    background: #E7F3EA;
    color: #3D7A4C;
  }
  .arena-persona-chip--lavender {
    background: #EEE8F8;
    color: #6B4EA3;
  }
  .arena-persona-chip--amber {
    background: #F8EEDD;
    color: #A36B1A;
  }
  .arena-persona-chip--rose {
    background: #F8E6E1;
    color: #A44732;
  }
  .arena-persona-chip--teal {
    background: #E4F2F0;
    color: #2F7A72;
  }
  .arena-persona-chip--blue {
    background: #E6EEF8;
    color: #3A5F8C;
  }

  .arena-persona-met {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 600;
    color: #4C8F5F;
  }

  .arena-persona-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid #EFEBE3;
    font-size: 13px;
    font-weight: 600;
    color: #0A1628;
  }

  @media (max-width: 640px) {
    .arena-wizard-grades {
      grid-template-columns: 1fr;
    }
    .arena-persona-grid {
      grid-template-columns: 1fr;
    }
    .arena-persona-top {
      flex-direction: column;
    }
    .arena-persona-photo {
      width: 100%;
      min-width: 0;
      height: 180px;
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
