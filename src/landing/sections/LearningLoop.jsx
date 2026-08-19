import React from "react";

const STEPS = [
  {
    title: "Practice",
    desc: "Respond to a realistic situation.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    ),
  },
  {
    title: "Reflect",
    desc: "What were you trying to do?",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 5.5h16v10H12l-3.5 3.5v-3.5H4z" />
      </svg>
    ),
  },
  {
    title: "Customer feedback",
    desc: "See how your response landed.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 5.5h16v10H12.5L9 19v-3.5H4z" />
        <circle cx="9" cy="10.5" r=".6" fill="currentColor" stroke="none" />
        <circle cx="12" cy="10.5" r=".6" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10.5" r=".6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Re-reflect",
    desc: "Compare intention with impact.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 9h13" strokeLinecap="round" />
        <path d="M15 5.5 18.5 9 15 12.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 15H6" strokeLinecap="round" />
        <path d="M9 11.5 5.5 15 9 18.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Notice facts",
    desc: "See what actually happened.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="M15 15l4.5 4.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Coach",
    desc: "Learn what to try next.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M9 18h6" strokeLinecap="round" />
        <path d="M12 3.5a5.5 5.5 0 0 0-3 10.1c.6.5 1 1.1 1 1.9h4c0-.8.4-1.4 1-1.9A5.5 5.5 0 0 0 12 3.5z" />
      </svg>
    ),
  },
  {
    title: "Repeat",
    desc: "Try it again.",
    final: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M19 12a7 7 0 1 1-2.3-5.2" strokeLinecap="round" />
        <path d="M19 4v4.5h-4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function Node({ icon }) {
  return <div className="al-node">{icon}</div>;
}

function StepCopy({ index, title, desc }) {
  return (
    <>
      <span className="al-k">Step {String(index + 1).padStart(2, "0")}</span>
      <div className="al-t">{title}</div>
      <div className="al-d">{desc}</div>
    </>
  );
}

export default function LearningLoop() {
  return (
    <section className="lp-section arena-loop" id="learning-loop">
      <div className="al-head lp-reveal">
        <h2>
          One conversation. A complete <span>learning loop.</span>
        </h2>
        <p>
          How does The Arena turn practice into capability? It separates{" "}
          <b>intention</b>, <b>impact</b>, <b>evidence</b> and <b>coaching</b> — then gives you another attempt.
        </p>
      </div>

      <div className="al-track-wrap al-track-wrap--desktop lp-reveal">
        <div className="al-track">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`al-step${step.final ? " al-step--final" : ""}`}
            >
              <Node icon={step.icon} />
              <StepCopy index={i} title={step.title} desc={step.desc} />
            </div>
          ))}
        </div>
      </div>

      <div className="al-track-wrap al-track-wrap--mobile lp-reveal">
        <div className="al-vtrack">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`al-vstep${step.final ? " al-step--final" : ""}`}
            >
              <Node icon={step.icon} />
              <div className="al-txt">
                <StepCopy index={i} title={step.title} desc={step.desc} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
