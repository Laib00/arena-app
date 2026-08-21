import type { ReactNode } from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { NAVY } from "../theme";

type ArenaLogoProps = {
  onClick?: () => void;
};

export function ArenaLogo({ onClick }: ArenaLogoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
    >
      <img
        src="/arena-logo-128.png"
        alt=""
        width={30}
        height={30}
        decoding="async"
        style={{ display: "block", flexShrink: 0 }}
      />
      <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 20, color: NAVY, fontWeight: 700 }}>Arena</span>
    </button>
  );
}

type PageHeaderProps = {
  onHome?: () => void;
  onMenuToggle?: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  brand?: "logo" | "back";
};

export default function PageHeader({
  onHome,
  onMenuToggle,
  title,
  subtitle,
  children,
  actions,
  brand = "logo",
}: PageHeaderProps) {
  return (
    <div className="arena-topbar arena-page-header" style={{ background: "#fff" }}>
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="arena-menu-toggle"
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 4 }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}
      {brand === "back" ? (
        <button
          type="button"
          onClick={onHome}
          aria-label="Back to home"
          className="arena-topbar-link"
          style={{ padding: 4, flexShrink: 0 }}
        >
          <ArrowLeft size={20} color={NAVY} />
        </button>
      ) : (
        <ArenaLogo onClick={onHome} />
      )}
      {(title || subtitle || children) && (
        <div className="arena-page-header-left" style={{ minWidth: 0, flex: 1 }}>
          {title && (
            <div>
              <div className="arena-page-header-title" style={{ color: NAVY }}>{title}</div>
              {subtitle && <div style={{ fontSize: 11.5, color: "#55606F", marginTop: 2 }}>{subtitle}</div>}
            </div>
          )}
          {children}
        </div>
      )}
      {actions && (
        <div className="arena-topbar-actions" style={{ marginLeft: "auto" }}>
          {actions}
        </div>
      )}
    </div>
  );
}
