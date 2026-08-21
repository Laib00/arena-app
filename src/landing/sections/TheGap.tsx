import React from "react";

const POINTS = [
  {
    logo: "/TheGap/knowledge_feels_like_readiness_logo.png",
    title: "Knowledge feels like readiness.",
    body: "Then a real person hesitates, objects, goes quiet—or asks the question you weren't expecting.",
  },
  {
    logo: "/TheGap/the_arena.png",
    title: "The Arena",
    body: "turns understanding into ability through deliberate, repeated practice in situations that feel real.",
  },
];

export default function TheGap() {
  return (
    <section className="lp-section lp-section--paper lp-gap" id="the-gap">
      <div className="lp-wrap lp-gap-inner lp-reveal">
        <div className="lp-gap-copy">
          <span className="lp-gap-eyebrow">The Gap</span>
          <h2 className="lp-gap-h">You don&apos;t need another course.</h2>
          <p className="lp-gap-sub">
            You need somewhere to practise what you already know.
          </p>

          <ul className="lp-gap-points">
            {POINTS.map(({ logo, title, body }) => (
              <li key={title} className="lp-gap-point">
                <span className="lp-gap-point-icon">
                  <img src={logo} alt="" loading="lazy" decoding="async" />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-gap-visual">
          <img
            src="/the_gap.png"
            alt="A man practising a conversation in Arena, then using that practice in a real meeting."
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
