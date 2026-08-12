import React from "react";
import { User, Users, GraduationCap, Check } from "lucide-react";
import { stagger } from "../useReveal";

const GROUPS = [
  {
    icon: User,
    status: "live",
    statusLabel: "Live now",
    title: "Agents",
    body: "Practise at 11pm the night before a viewing, without booking anyone's time or talking a colleague into playing the buyer.",
    points: [
      "Run the same difficult client until it stops being difficult",
      "Every session, transcript and reflection saved to your history",
      "Leave a session open and pick it up exactly where you left it",
    ],
  },
  {
    icon: Users,
    status: "live",
    statusLabel: "Live now",
    title: "Team leaders & managers",
    body: "See who is genuinely putting the reps in — and whether what they manage in practice ever shows up in front of a real client.",
    points: [
      "Every trainee's sessions, transcripts and debriefs in one dashboard",
      "Add your own coaching notes against any individual session",
      "Spot the gap between how someone practises and how they actually sell",
    ],
  },
  {
    icon: GraduationCap,
    status: "soon",
    statusLabel: "Phase 2",
    title: "Coaches",
    body: "Bring your own students, your own material and your own philosophy. Arena supplies the practice environment and stays out of the teaching.",
    points: [
      "Scenarios built per class, so week three practises week three",
      "Everything combines into open practice once the programme ends",
      "Your method stays yours — Arena never overrides it with advice",
    ],
  },
];

export default function Audiences() {
  return (
    <section className="lp-section lp-section--navy" id="who-its-for">
      <div className="lp-wrap">
        <div className="lp-head lp-reveal">
          <span className="lp-eyebrow">Who it's for</span>
          <h2 className="lp-h2" style={{ color: "#fff" }}>
            Practice for agents. Evidence for the people who lead them.
          </h2>
          <p className="lp-lede">
            Same sessions, different view. What an agent uses to get better is the same
            material their manager needs to coach them properly.
          </p>
        </div>

        <div className="lp-grid-3">
          {GROUPS.map((g, i) => (
            <div key={g.title} className="lp-aud lp-reveal" style={stagger(i)}>
              <span className={`lp-status lp-status--${g.status}`}>{g.statusLabel}</span>
              <div className="lp-aud-icon">
                <g.icon size={21} strokeWidth={1.8} />
              </div>
              <h3>{g.title}</h3>
              <p>{g.body}</p>
              <ul>
                {g.points.map((p) => (
                  <li key={p}>
                    <Check size={15} strokeWidth={2.6} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
