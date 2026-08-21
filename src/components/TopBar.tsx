import { Menu } from "lucide-react";
import { NAVY } from "../theme";
import { ArenaLogo } from "./PageHeader";
import type { UserProfile } from "../types/domain";

type TopBarProps = {
  profile: UserProfile | null;
  onSignOut: () => void;
  onTeamView: () => void;
  onHistoryView: () => void;
  onProfileView: () => void;
  onHomeView: () => void;
  onMenuToggle: () => void;
  onProgressClick: () => void;
};

export default function TopBar({
  profile,
  onSignOut,
  onTeamView,
  onHistoryView,
  onProfileView,
  onHomeView,
  onMenuToggle,
  onProgressClick,
}: TopBarProps) {
  const initials = (profile?.full_name || profile?.email || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

  return (
    <div className="arena-topbar" style={{ background: "#fff" }}>
      <button
        onClick={onMenuToggle}
        className="arena-menu-toggle"
        style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 4 }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo only on mobile — desktop already has it in the sidebar */}
      <div className="arena-topbar-brand-mobile">
        <ArenaLogo onClick={onHomeView} />
      </div>

      <div className="arena-topbar-actions arena-topbar-desktop-nav">
        <button type="button" onClick={onProgressClick} className="arena-topbar-link">Progress</button>
        <button type="button" onClick={onHistoryView} className="arena-topbar-link">History</button>
        {profile?.role === "manager" && (
          <button type="button" onClick={onTeamView} className="arena-topbar-link">Team</button>
        )}
        <button
          type="button"
          onClick={onProfileView}
          title={profile?.full_name || profile?.email || undefined}
          className="arena-topbar-link"
          style={{ gap: 8 }}
        >
          <span
            style={{
              width: 32, height: 32, borderRadius: "50%", background: NAVY, color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
            }}
          >
            {initials}
          </span>
        </button>
        <button type="button" onClick={onSignOut} className="arena-topbar-link">Sign Out</button>
      </div>
    </div>
  );
}
