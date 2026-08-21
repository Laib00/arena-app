import type { CSSProperties } from "react";
import { stagger } from "../useReveal";

type GradeStyle = CSSProperties & { "--g": string };

const GRADES = [
  {
    name: "Easy",
    color: "#4C8F5F",
    desc: "Warm, ready to move, no history with a bad agent. Good for finding your rhythm.",
  },
  {
    name: "Medium",
    color: "#C98A2C",
    desc: "A real complication — a tight budget, an emotional attachment, or no patience for your preamble.",
  },
  {
    name: "Hard",
    color: "#B5502F",
    desc: "They've been burned before and they will test you early. Trust has to be earned in the conversation.",
  },
  {
    name: "Impossible",
    color: "#7A2E3A",
    desc: "They want something no honest agent can deliver, and they won't accept no. You can't win. You can only handle it well.",
  },
];

const PEOPLE = [
  {
    grade: "Easy",
    cls: "easy",
    name: "Grace Teo",
    meta: "34 · Marketing Executive · $1.2M",
    quote:
      "We've cleared MOP and the kids need the space. Honestly, we're ready — we just don't know where to start.",
    tags: ["Upgrading", "Actively searching", "Influencer (DISC)"],
  },
  {
    grade: "Hard",
    cls: "hard",
    name: "Michelle Goh",
    meta: "50 · Finance Manager · $1.9M",
    quote:
      "I've read the transaction data for this district myself. So let's not pretend that number is the market rate.",
    tags: ["Burned before", "Hard negotiator", "Dominant (DISC)"],
  },
  {
    grade: "Impossible",
    cls: "impossible",
    name: "Boon Keng",
    meta: "60 · Entrepreneur · $700K",
    quote:
      "I want landed. I know what my budget is. Finding a way to make that work is supposed to be your job, isn't it?",
    tags: ["Fired 3 agents", "Hard deadline", "Won't accept no"],
  },
];

const AIMS = ["Upgrade", "Downgrade", "Buy first", "Sell", "Rent"];
const SETTINGS = [
  "Canvassing (cold)",
  "First appointment, online-preceded",
  "First appointment, self-presentation",
];

export default function Personas() {
  return (
    <section className="lp-section lp-section--paper" id="clients">
      <div className="lp-wrap">
        <div className="lp-head lp-reveal">
          <span className="lp-eyebrow">The clients</span>
          <h2 className="lp-h2">Easy is where you start. Impossible is where you learn.</h2>
          <p className="lp-lede">
            Sixteen property personas, each written with a life stage, a budget, a personality
            profile and — more often than not — a specific reason to distrust you. Or generate
            a client you've never seen before and go in cold.
          </p>
        </div>

        <div className="lp-grades">
          {GRADES.map((g, i) => (
            <div
              key={g.name}
              className="lp-grade-card lp-reveal"
              style={{ "--g": g.color, ...stagger(i, 70) } as GradeStyle}
            >
              <h4>{g.name}</h4>
              <p>{g.desc}</p>
            </div>
          ))}
        </div>

        <div className="lp-persona-row">
          {PEOPLE.map((p, i) => (
            <div key={p.name} className="lp-persona lp-reveal" style={stagger(i)}>
              <div className="lp-persona-top">
                <div>
                  <div className="lp-persona-name">{p.name}</div>
                  <div className="lp-persona-meta">{p.meta}</div>
                </div>
                <span className={`lp-grade lp-grade--${p.cls}`}>{p.grade}</span>
              </div>
              <div className="lp-persona-quote">{p.quote}</div>
              <div className="lp-tags">
                {p.tags.map((t) => (
                  <span key={t} className="lp-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="lp-chips lp-reveal">
          <div className="lp-chip-group">
            <h5>Pick what they want</h5>
            <div className="lp-chip-list">
              {AIMS.map((a) => (
                <span key={a} className="lp-chip">
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div className="lp-chip-group">
            <h5>Pick where you meet them</h5>
            <div className="lp-chip-list">
              {SETTINGS.map((s) => (
                <span key={s} className="lp-chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
