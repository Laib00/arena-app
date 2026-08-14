import { ArrowRight, Calendar, MessageCircle, Smile, Target, Zap, Shield, Search } from "lucide-react";
import GradeBadge from "./GradeBadge";
import { DISC_CHIPS } from "../constants";
import { getPersonaImageUrl } from "../data/personaImages";
import { NAVY } from "../theme";

const CHIP_ICONS = {
  green: Smile,
  lavender: MessageCircle,
  amber: Zap,
  rose: Target,
  teal: Shield,
  blue: Search,
};

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function PersonaCard({ persona, selected, met, onSelect }) {
  const imageUrl = getPersonaImageUrl(persona);
  const chips = DISC_CHIPS[persona.disc] || [];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(persona.id)}
      className={`arena-persona-card${selected ? " is-selected" : ""}${met && !selected ? " is-met" : ""}`}
    >
      <div className="arena-persona-top">
        {imageUrl ? (
          <img
            className="arena-persona-photo"
            src={imageUrl}
            alt=""
            draggable={false}
          />
        ) : (
          <div className="arena-persona-photo arena-persona-photo--fallback" aria-hidden="true">
            {initials(persona.name)}
          </div>
        )}

        <div className="arena-persona-body">
          <div className="arena-persona-meta">
            <GradeBadge grade={persona.grade} size="sm" />
            {met && (
              <span
                className="arena-persona-met-dot"
                title="You've spoken with this client before"
              />
            )}
          </div>

          <div className="arena-persona-name" style={{ color: NAVY }}>{persona.name}</div>
          <div className="arena-persona-sub">
            {persona.age} · {persona.occupation}
          </div>

          <div className="arena-persona-chips">
            {chips.map((chip) => {
              const Icon = CHIP_ICONS[chip.tone] || Smile;
              return (
                <span key={chip.label} className={`arena-persona-chip arena-persona-chip--${chip.tone}`}>
                  <Icon size={13} strokeWidth={2.2} />
                  {chip.label}
                </span>
              );
            })}
          </div>

          {met && (
            <div className="arena-persona-met">
              <Calendar size={13} strokeWidth={2.2} />
              Met before
            </div>
          )}
        </div>
      </div>

      <div className="arena-persona-footer">
        <span>Start conversation</span>
        <ArrowRight size={16} strokeWidth={2.2} />
      </div>
    </button>
  );
}
