import React, { useState } from "react";
import { Plus } from "lucide-react";

const ITEMS = [
  {
    q: "Why do professionals need deliberate practice?",
    a: "Knowledge explains what to do. Deliberate practice develops the ability to do it under pressure. Athletes, soldiers, pilots, firefighters, doctors, musicians and actors rehearse repeatedly before performance matters. Conversation-based professionals need the same opportunity.",
  },
  {
    q: "Why was The Arena built?",
    a: "The Arena was built to close the missing gap between professional knowledge and real-world capability. Courses can teach principles, but professionals also need a safe, repeatable place to practise difficult conversations, reflect, receive feedback and return sharper.",
  },
  {
    q: "What is The Arena?",
    a: "The Arena is a deliberate-practice platform for conversation-based professionals. It lets people rehearse realistic client conversations, reflect on their choices, receive customer and coach feedback, and repeat until better judgment becomes natural.",
  },
  {
    q: "Who is The Arena for?",
    a: "The Arena is built first for real estate salespersons\u2014especially new agents, agents in their first one to three years, and experienced professionals rebuilding their foundations. It also supports coaches, team leaders and organisations.",
  },
  {
    q: "How does practice in The Arena work?",
    a: "You enter a realistic scenario, respond in your own words and move through a seven-stage loop: practise, reflect, receive customer feedback, re-reflect, notice facts, learn from a human coach and repeat.",
  },
  {
    q: "Does The Arena replace human coaches?",
    a: "No. AI simulates the customer and creates more opportunities to practise. Human coaches teach the method, interpret performance and set the professional standard.",
  },
  {
    q: "What skills can real estate salespersons practise?",
    a: "Salespersons can practise opening conversations, asking better questions, explaining property decisions, handling hesitation and objections, reading client situations and communicating without sounding scripted.",
  },
  {
    q: "Is The Arena another online course?",
    a: "No. Courses primarily deliver information. The Arena is practice infrastructure: a safe place to apply what you know under pressure, examine what happened and try again.",
  },
  {
    q: "Why is reflection included twice in the learning loop?",
    a: "The first reflection captures your intention before feedback influences you. After hearing the simulated customer\u2019s perspective, re-reflection helps you compare intent with impact and update your judgment.",
  },
  {
    q: "How can teams and coaches use The Arena?",
    a: "Coaches can review meaningful moments and apply their methodology at scale. Leaders can see practice patterns and readiness across a team instead of relying only on course attendance or completion.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="lp-section lp-faq-dark" id="faq">
      <div className="lp-wrap">
        <div className="lp-faq-dark-layout lp-reveal">
          <div className="lp-faq-dark-intro">
            <span className="lp-faq-dark-eyebrow">Questions, answered</span>
            <h2 className="lp-faq-dark-h">
              What do you want to know about Arena?
            </h2>
            <p className="lp-faq-dark-sub">
            </p>
          </div>

          <div className="lp-faq-dark-list">
            {ITEMS.map((item, i) => (
              <div
                key={item.q}
                className={`lp-faq-dark-item${open === i ? " is-open" : ""}`}
              >
                <button
                  className="lp-faq-dark-q"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                >
                  <span className="lp-faq-dark-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="lp-faq-dark-label">{item.q}</span>
                  <Plus size={18} strokeWidth={2.2} />
                </button>
                <div className="lp-faq-dark-a">
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
