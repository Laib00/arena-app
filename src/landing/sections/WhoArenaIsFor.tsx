import { useState } from "react";
import Folder from "../../components/Folder/Folder";

type RoleIconType = "ring" | "bars" | "diamond";

interface ArenaRole {
  id: string;
  label: string;
  title: string;
  tagline: string;
  viewLabel: string;
  viewTitle: string;
  viewBody: string;
  stats: Array<{ label: string; value: string; highlight: boolean }>;
  icon: RoleIconType;
}

const ROLES: ArenaRole[] = [
  {
    id: "professional",
    label: "In the arena",
    title: "Professional",
    tagline: "Get the reps.",
    viewLabel: "Your view",
    viewTitle: "Get the reps.",
    viewBody:
      "Practise difficult conversations without waiting for another person to roleplay the client.",
    stats: [
      { label: "Practice history", value: "18 sessions", highlight: true },
      { label: "Reflection", value: "Ready", highlight: true },
      { label: "Next round", value: "New prospect", highlight: true },
    ],
    icon: "ring",
  },
  {
    id: "manager",
    label: "Ringside",
    title: "Manager",
    tagline: "See the development.",
    viewLabel: "Manager view",
    viewTitle: "See development.",
    viewBody:
      "See the sessions behind performance, where someone is practising and where coaching may be useful.",
    stats: [
      { label: "Sessions this week", value: "6", highlight: false },
      { label: "Focus area", value: "Discovery", highlight: true },
      { label: "Development", value: "Improving", highlight: true },
    ],
    icon: "bars",
  },
  {
    id: "coach",
    label: "The corner",
    title: "Coach",
    tagline: "Shape the practice.",
    viewLabel: "Coach view",
    viewTitle: "Shape the practice.",
    viewBody:
      "Bring your own methodology, assign scenarios to your learners and turn teaching into repeatable practice.",
    stats: [
      { label: "Methodology", value: "Your own", highlight: true },
      { label: "Learners", value: "24 active", highlight: true },
      { label: "Scenario set", value: "Week 3", highlight: true },
    ],
    icon: "diamond",
  },
];

function RoleIcon({ type }: { type: RoleIconType }) {
  if (type === "bars") {
    return (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="3" y="3" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="3" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (type === "diamond") {
    return (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect
          x="9"
          y="2.5"
          width="9"
          height="9"
          rx="1"
          transform="rotate(45 9 2.5)"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function RolePaper({ role, isActive }: { role: ArenaRole; isActive: boolean }) {
  return (
    <div className={`lp-waf-paper${isActive ? " is-active" : ""}`}>
      <span className="lp-waf-paper-top">
        <span className="lp-waf-paper-label">{role.label}</span>
        <span className="lp-waf-paper-icon">
          <RoleIcon type={role.icon} />
        </span>
      </span>
      <span className="lp-waf-paper-title">{role.title}</span>
      <span className="lp-waf-paper-tag">{role.tagline}</span>
    </div>
  );
}

function SessionMockup() {
  return (
    <div className="lp-waf-session">
      <div className="lp-waf-session-head">
        <div className="lp-waf-session-user">
          <span className="lp-waf-session-avatar" aria-hidden />
          <div>
            <strong>Michelle, 37</strong>
            <span>First-time buyer · Cautious</span>
          </div>
        </div>
        <span className="lp-waf-session-badge">In session</span>
      </div>

      <div className="lp-waf-session-chat">
        <div className="lp-waf-bubble lp-waf-bubble--them">
          I&apos;m worried I&apos;m buying at the peak. What if prices fall next year?
        </div>
        <div className="lp-waf-bubble lp-waf-bubble--you">
          That&apos;s understandable. What would need to happen for you to feel comfortable moving
          ahead?
        </div>
      </div>

      <div className="lp-waf-session-foot">08:42 · Discovery conversation</div>
    </div>
  );
}

export default function WhoArenaIsFor() {
  const [active, setActive] = useState<string | null>(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const role = ROLES.find((r) => r.id === active);
  const activeIndex = active ? ROLES.findIndex((r) => r.id === active) : -1;

  const handleFolderOpenChange = (open: boolean) => {
    setFolderOpen(open);
    if (!open) setActive(null);
  };

  return (
    <section className="lp-section lp-section--paper" id="who-arena-is-for">
      <div className="lp-wrap">
        <div className="lp-waf-head lp-reveal">
          <span className="lp-waf-eyebrow">Who Arena is for</span>
          <h2 className="lp-waf-h2">Same Arena. Different seats.</h2>
        </div>

        <div className="lp-waf-experience lp-reveal">
          <div className={`lp-waf-folder-box${folderOpen ? " is-open" : ""}`}>
            <Folder
              className="lp-waf-folder"
              color="#FD8841"
              size={1}
              activeIndex={activeIndex}
              onOpenChange={handleFolderOpenChange}
              onItemClick={(index) => setActive(ROLES[index].id)}
              items={ROLES.map((r) => (
                <RolePaper key={r.id} role={r} isActive={active === r.id} />
              ))}
            />
          </div>

          {role && (
            <div className="lp-waf-preview is-visible" key={role.id}>
              <div className="lp-waf-preview-rings" aria-hidden />
              <div className="lp-waf-preview-copy">
                <span className="lp-waf-preview-label">Live practice</span>
                <h3 className="lp-waf-preview-h">One conversation.</h3>
              </div>

              <div className="lp-waf-stage">
                <SessionMockup />

                <div className="lp-waf-panel">
                  <span className="lp-waf-panel-label">{role.viewLabel}</span>
                  <h4 className="lp-waf-panel-title">{role.viewTitle}</h4>
                  <p className="lp-waf-panel-body">{role.viewBody}</p>
                  <dl className="lp-waf-panel-stats">
                    {role.stats.map((stat) => (
                      <div key={stat.label} className="lp-waf-stat">
                        <dt>{stat.label}</dt>
                        <dd className={stat.highlight ? "is-accent" : undefined}>{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lp-waf-foot lp-reveal">
          <p className="lp-waf-footline">
            One session. <span>Three perspectives.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
