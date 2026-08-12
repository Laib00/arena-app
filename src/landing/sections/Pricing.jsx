import React from "react";
import { Check } from "lucide-react";

const FOUNDER = [
  "Unlimited roleplay sessions",
  "All 16 property personas, plus randomly generated clients",
  "The full five-step debrief on every session",
  "Complete session history and transcripts",
  "Manager dashboard for team leads",
  "Voice, coaches and video included as they ship — at no extra cost",
  "Direct line to us on what gets built next",
];

const STANDARD = [
  "Everything in the founder plan",
  "Priced at whatever the product is worth by then",
  "Available once phase 2 ships",
];

export default function Pricing() {
  return (
    <section className="lp-section lp-section--paper" id="pricing">
      <div className="lp-wrap">
        <div className="lp-head lp-head--center lp-reveal">
          <span className="lp-eyebrow">Pricing</span>
          <h2 className="lp-h2">Founder pricing, locked for good.</h2>
          <p className="lp-lede">
            Arena is early, and we're pricing it honestly. Join now and your rate never moves,
            no matter how much the product grows underneath it.
          </p>
        </div>

        <div className="lp-prices">
          <div className="lp-price lp-price--featured lp-reveal">
            <span className="lp-price-flag">Founder plan</span>
            <h3 style={{ color: "#fff" }}>Founding member</h3>
            <p className="lp-price-note">
              For the first cohort of agents who'll shape what this becomes.
            </p>
            <div className="lp-price-amt">
              <b>$9</b>
              <span>/month</span>
              <s>$198</s>
            </div>
            <ul>
              {FOUNDER.map((f) => (
                <li key={f}>
                  <Check size={16} strokeWidth={2.6} />
                  {f}
                </li>
              ))}
            </ul>
            <a className="lp-btn lp-btn--accent" href="#waitlist">
              Claim founder pricing
            </a>
          </div>

          <div className="lp-price lp-reveal">
            <h3>Standard</h3>
            <p className="lp-price-note">
              What Arena will cost once the coaching and voice features land.
            </p>
            <div className="lp-price-amt">
              <b>$198</b>
              <span>/month</span>
            </div>
            <ul>
              {STANDARD.map((f) => (
                <li key={f}>
                  <Check size={16} strokeWidth={2.6} color="#C2410C" />
                  {f}
                </li>
              ))}
            </ul>
            <a className="lp-btn lp-btn--outline" href="#waitlist">
              Skip this — join now instead
            </a>
          </div>
        </div>

        <p className="lp-price-foot lp-reveal">
          That's the actual trade: you tell us where it falls short while it's still early, and
          we never raise your price.
        </p>
      </div>
    </section>
  );
}
