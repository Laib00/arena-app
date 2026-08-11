import { LogOut, Users, Menu } from "lucide-react";
import { NAVY, GOLD } from "../theme";

export default function TopBar({ profile, onSignOut, onTeamView, onHistoryView, onProfileView, onMenuToggle }) {
  const navButtonStyle = {
    background: "none", border: "none", cursor: "pointer", color: NAVY, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 4,
  };

  return (
    <div className="arena-topbar">
      <button
        onClick={onMenuToggle}
        className="arena-menu-toggle"
        style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 4 }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="arena-topbar-actions arena-topbar-desktop-nav">
        {profile && (
          <span>
            {profile.full_name || profile.email}
            {profile.role === "manager" && <span style={{ color: GOLD, fontWeight: 700 }}> · Manager</span>}
          </span>
        )}
        <button onClick={onProfileView} style={navButtonStyle}>Profile</button>
        <button onClick={onHistoryView} style={navButtonStyle}>My History</button>
        {profile?.role === "manager" && (
          <button onClick={onTeamView} style={navButtonStyle}>
            <Users size={14} /> Team Dashboard
          </button>
        )}
        <button onClick={onSignOut} style={navButtonStyle}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}
