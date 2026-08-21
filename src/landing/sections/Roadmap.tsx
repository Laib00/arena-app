import React from "react";
import { stagger } from "../useReveal";

const PHASES = [
  {
    phase: "Phase 1",
    now: true,
    title: "Text roleplay, built for property agents",
    body: "Graded personas, the full five-step debrief, saved session history and the manager view. This is what you get access to today. Financial advisors are next in line.",
  },
  {
    phase: "Phase 1.5",
    title: "Voice",
    body: "Stop typing and start talking. Speak to your client from a laptop or a phone and get spoken pushback back, at the pace a real conversation actually moves.",
  },
  {
    phase: "Phase 2",
    title: "Coaches and managers",
    body: "Independent coaches bring their own students and upload their own material to build scenarios per class. Managers get proper team analytics — practice volume, time invested, and how it maps to real client meetings.",
  },
  {
    phase: "Phase 3",
    title: "Video",
    body: "You read their face while they read yours. Body language, expression and pace become part of the conversation, and part of the observations afterwards.",
  },
  {
    phase: "Phase 4",
    title: "Marketplace",
    body: "Finish your coach's programme, then find the next one. Negotiation, public speaking, whatever you need — from coaches already running their training inside Arena.",
  },
];

export default function Roadmap() {
  return (
    <section className="lp-section lp-section--cream" id="roadmap">
      <div className="lp-wrap">
        <div className="lp-head lp-reveal">
          <span className="lp-eyebrow">What's next</span>
          <h2 className="lp-h2">Where Arena is going.</h2>
          <p className="lp-lede">
            We'd rather show you the real order of things than pretend it's all shipping
            tomorrow. Founder members help decide what moves up the list.
          </p>
        </div>

        <div className="lp-road">
          {PHASES.map((p, i) => (
            <div
              key={p.phase}
              className={`lp-road-item lp-reveal${p.now ? " lp-road-item--now" : ""}`}
              style={stagger(i, 70)}
            >
              <div className="lp-road-phase">
                {p.phase}
                {p.now && <span className="lp-road-now">Live now</span>}
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
