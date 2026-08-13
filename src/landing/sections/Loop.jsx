import React from "react";

const IMG = "/images/ecosystem";

const CARDS = [
  {
    id: "history",
    src: `${IMG}/session_history.png`,
    alt: "Session history",
    label: null,
  },
  {
    id: "prospect",
    src: `${IMG}/AI_prospect.png`,
    alt: "AI prospect",
    label: "know your prospect",
  },
  {
    id: "facts",
    src: `${IMG}/AI_facts.png`,
    alt: "AI facts",
    label: "see what actually happened",
  },
  {
    id: "coaching",
    src: `${IMG}/coaching.png`,
    alt: "Coaching",
    label: "coached, not just scored",
  },
  {
    id: "video",
    src: `${IMG}/Video_practice.png`,
    alt: "Video practice",
    label: "grounded in your playbook via RAG",
  },
  {
    id: "reflection",
    src: `${IMG}/reflection.png`,
    alt: "Reflection",
    label: "turn practice into progress",
  },
  {
    id: "realistic",
    src: `${IMG}/realistic_practice.png`,
    alt: "Realistic practice",
    label: "pick your scenario",
  },
];

const TAGS = [
  { id: "prospect", text: "know your prospect" },
  { id: "facts", text: "see what actually happened" },
  { id: "coaching", text: "coached, not just scored" },
  { id: "video", text: "grounded in your playbook via RAG" },
  { id: "reflection", text: "turn practice into progress" },
  { id: "realistic", text: "pick your scenario" },
];

function Hub() {
  return (
    <div className="lp-eco-hub">
      <img
        className="lp-eco-hub-logo"
        src={`${IMG}/arena-logo.png`}
        alt=""
        width={64}
        height={64}
        decoding="async"
      />
      <p className="lp-eco-hub-word">Arena</p>
      <p className="lp-eco-hub-tag">Practice · Perform</p>
      <p className="lp-eco-hub-tag2">and then, again.</p>
    </div>
  );
}

export default function Loop() {
  return (
    <section className="lp-eco" id="how-it-works">
      <div className="lp-eco-desktop lp-reveal">
        <svg className="lp-eco-connector" viewBox="0 0 1680 1060" aria-hidden>
          <g stroke="#DCD6C8" strokeWidth="1.4" fill="none">
            <path d="M840,300 L840,220" />
            <path d="M950,470 L1120,470 L1120,300" />
            <path d="M950,590 L1120,590 L1120,700" />
            <path d="M730,470 L470,470 L470,290" />
            <path d="M730,600 L560,600 L560,760" />
            <path d="M790,650 L790,830" />
            <path d="M300,700 L300,830" />
          </g>
        </svg>

        <div className="lp-eco-rings" aria-hidden>
          <svg viewBox="0 0 520 520">
            <circle
              cx="260"
              cy="260"
              r="245"
              fill="none"
              stroke="#FD5901"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
            <circle
              cx="260"
              cy="260"
              r="185"
              fill="none"
              stroke="#FD5901"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <Hub />

        {CARDS.map((card) => (
          <div key={card.id} className={`lp-eco-card lp-eco-card--${card.id}`}>
            <img src={card.src} alt={card.alt} />
          </div>
        ))}

        {TAGS.map((tag) => (
          <div key={tag.id} className={`lp-eco-tag lp-eco-tag--${tag.id}`}>
            <span className="lp-eco-dot" />
            {tag.text}
          </div>
        ))}
      </div>

      <div className="lp-eco-stack lp-reveal">
        <Hub />
        <div className="lp-eco-grid">
          {CARDS.map((card) => (
            <figure key={card.id} className="lp-eco-stack-card">
              <img src={card.src} alt={card.alt} />
              {card.label && (
                <figcaption>
                  <span className="lp-eco-dot" />
                  {card.label}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
