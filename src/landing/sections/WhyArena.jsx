import React from "react";
import MaskedHeading from "../../components/MaskedHeading/MaskedHeading";

const LOGO_BASE = "/Who_is_arena_for_logos";

const ITEMS = [
  { title: "Swimmers", body: "Repeat the movement", logo: `${LOGO_BASE}/swimmers_logo.png` },
  { title: "Footballers", body: "Touch the ball thousands of times", logo: `${LOGO_BASE}/footballer_logo.png` },
  { title: "Soldiers", body: "Drill before deployment", logo: `${LOGO_BASE}/soldier_logo.png` },
  { title: "Pilots", body: "Train in simulators", logo: `${LOGO_BASE}/pilot_logo.png` },
  { title: "Doctors", body: "Practise procedures", logo: `${LOGO_BASE}/doctor_logo.png` },
  { title: "Firefighters", body: "Rehearse emergencies", logo: `${LOGO_BASE}/firefighters_logo.png` },
  { title: "Musicians", body: "Rehearse daily", logo: `${LOGO_BASE}/music_logo.png` },
  { title: "Actors", body: "Rehearse before opening night", logo: `${LOGO_BASE}/actors_logo.png` },
];

function WhyLogo({ src, alt = "" }) {
  return (
    <span className="lp-why-icon">
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </span>
  );
}

export default function WhyArena() {
  return (
    <section className="lp-section lp-section--cream lp-why" id="why-arena">
      <div className="lp-wrap">
        <div className="lp-why-head lp-reveal">
          <div className="lp-why-eyebrow">Why Arena?</div>
          <h2 className="lp-why-h">
            Everyone practises
            <br />
            before it counts.
          </h2>
          <p className="lp-why-lede">
            Yet many professionals are expected to perform after merely learning.
          </p>
        </div>

        <div className="lp-why-grid lp-reveal">
          {ITEMS.map(({ title, body, logo }) => (
            <div className="lp-why-cell" key={title}>
              <WhyLogo src={logo} />
              <div className="lp-why-title">{title}</div>
              <div className="lp-why-body">{body}</div>
            </div>
          ))}
        </div>

        <div className="lp-why-banner lp-reveal">
          <MaskedHeading
            className="lp-why-banner-mask"
            text="Practice makes us capable."
            mediaType="image"
            src="/orange_waves.png"
            fillScale={1.3}
            parallax={34}
            reveal="wipe"
            trigger="view"
          />
        </div>
      </div>
    </section>
  );
}
