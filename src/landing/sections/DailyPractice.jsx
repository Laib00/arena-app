import React from "react";
import { ArrowRight } from "lucide-react";

export default function DailyPractice() {
  return (
    <section className="lp-section lp-daily" id="daily-practice">
      <div className="lp-wrap lp-daily-inner lp-reveal">
        <div className="lp-daily-copy">
          <span className="lp-daily-eyebrow">Daily practice</span>
          <h2 className="lp-daily-h">
            Courses are events.
            <span className="lp-daily-h-accent">Practice is a habit.</span>
          </h2>
        </div>

        <div className="lp-daily-cards">
          <article className="lp-daily-card lp-daily-card--course">
            <span className="lp-daily-card-label">Course</span>
            <strong className="lp-daily-card-word">Once</strong>
            <p className="lp-daily-card-note">Then it&apos;s over.</p>
          </article>

          <span className="lp-daily-arrow" aria-hidden="true">
            <ArrowRight size={22} strokeWidth={2.2} />
          </span>

          <article className="lp-daily-card lp-daily-card--arena">
            <span className="lp-daily-card-label">The Arena</span>
            <strong className="lp-daily-card-word">Again.</strong>
            <p className="lp-daily-card-note">Then you come back tomorrow.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
