import React from "react";

export default function Loop() {
  return (
    <section className="lp-section lp-section--paper" id="how-it-works">
      <div className="lp-wrap lp-bap-wrap">
        <div className="lp-head lp-head--center lp-reveal">
          <h2 className="lp-h2">Build Around Practice</h2>
        </div>

        <figure className="lp-bap-figure lp-reveal">
          <img
            src="/Build_around_practice.png"
            alt="Arena connects coaches, AI prospects, knowledge, voice and video practice, and the manager dashboard around a single practice loop."
            width={1536}
            height={1024}
          />
        </figure>
      </div>
    </section>
  );
}
