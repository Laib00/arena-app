import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Infinity as InfinityIcon,
  Target,
  Diamond,
  UserRound,
  Archive,
  Users,
} from "lucide-react";

const INCLUDED = [
  { icon: InfinityIcon, label: "Unlimited Practice" },
  { icon: Target, label: "AI Facts" },
  { icon: Diamond, label: "Reflection" },
  { icon: UserRound, label: "Coaching" },
  { icon: Archive, label: "Session History" },
  { icon: Users, label: "New Prospects" },
];

export default function Pricing() {
  return (
    <section className="lp-section lp-section--cream lp-pay-section" id="pricing">
      <div className="lp-pay-glow lp-pay-glow--left" aria-hidden="true" />
      <div className="lp-pay-glow lp-pay-glow--right" aria-hidden="true" />

      <div className="lp-wrap lp-pay">
        <div className="lp-pay-copy lp-reveal">
          <h2 className="lp-pay-title">
            Get better before it matters<span>.</span>
          </h2>
          <p className="lp-pay-sub">Practice here. Perform out there.</p>
          <p className="lp-pay-access">
            <strong>$9/month</strong> founding access.
          </p>

          <div className="lp-pay-included">
            <h3>Included with Arena</h3>
            <ul>
              {INCLUDED.map((item) => (
                <li key={item.label}>
                  <item.icon size={28} strokeWidth={1.7} />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <article className="lp-founder lp-reveal">
          <div className="lp-founder-hero">
            <span className="lp-founder-badge">Founder Plan</span>
            <div className="lp-founder-price">
              <span className="lp-founder-dollar">$</span>
              <span className="lp-founder-num">9</span>
              <span className="lp-founder-cycle">/ month</span>
            </div>
            <span className="lp-founder-hero-logo" aria-hidden="true" />
          </div>

          <p className="lp-founder-desc">Early access to Arena at our founding price.</p>

          <Link className="lp-founder-cta" to="/dashboard?signup=1">
            Get Started
            <ArrowRight size={18} strokeWidth={2.4} />
          </Link>

          <div className="lp-founder-foot">
            <p className="lp-founder-tagline">
              Practice. Perform. <span>And then, again.</span>
            </p>
            <img
              className="lp-founder-logo"
              src="/arena-logo-128.png"
              alt="Arena"
              width={36}
              height={36}
              decoding="async"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
