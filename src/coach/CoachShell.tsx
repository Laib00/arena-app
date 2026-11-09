import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, LayoutDashboard, LogOut, UserRound, Users } from "lucide-react";
import { appPath } from "../routes";
import { NAVY, CREAM, GOLD } from "../theme";

export type CoachNavKey = "home" | "libraries" | "students" | "profile" | "setup";

type Props = {
  active: CoachNavKey;
  onSignOut: () => void;
  setupOnly?: boolean;
  breadcrumb?: string;
  children: React.ReactNode;
};

const navItems: { key: CoachNavKey; to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "home", to: appPath("/coach"), label: "Dashboard", icon: LayoutDashboard },
  { key: "libraries", to: appPath("/coach/libraries"), label: "Libraries", icon: BookOpen },
  { key: "students", to: appPath("/coach/students"), label: "Students", icon: Users },
  { key: "profile", to: appPath("/coach/profile"), label: "Profile", icon: UserRound },
];

export default function CoachShell({
  active,
  onSignOut,
  setupOnly = false,
  breadcrumb,
  children,
}: Props) {
  const items = setupOnly
    ? [{ key: "setup" as const, to: appPath("/coach"), label: "Profile setup", icon: UserRound }]
    : navItems;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: CREAM,
        color: NAVY,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          background: NAVY,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "22px 16px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 28 }}>
          Arena
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            marginBottom: 12,
            paddingLeft: 10,
          }}
        >
          Coach workspace
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {items.map((item) => {
            const Icon = item.icon;
            const on = active === item.key || (setupOnly && item.key === "setup");
            return (
              <Link
                key={item.key}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: on ? "#fff" : "rgba(255,255,255,0.7)",
                  background: on ? "rgba(253,136,65,0.22)" : "transparent",
                  fontWeight: on ? 700 : 500,
                  fontSize: 14,
                }}
              >
                <Icon size={16} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={onSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.65)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <LogOut size={16} aria-hidden />
          Sign out
        </button>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {breadcrumb ? (
          <div
            style={{
              padding: "14px 28px 0",
              fontSize: 12,
              color: "#9CA3AF",
            }}
          >
            Coach workspace / <span style={{ color: GOLD, fontWeight: 700 }}>{breadcrumb}</span>
          </div>
        ) : null}
        <div style={{ flex: 1, padding: "18px 28px 48px", maxWidth: 1100, width: "100%", boxSizing: "border-box" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
