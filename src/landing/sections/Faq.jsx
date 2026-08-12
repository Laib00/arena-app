import React, { useState } from "react";
import { Plus } from "lucide-react";

const ITEMS = [
  {
    q: "Is this trying to replace my coach?",
    a: "The opposite, and it's the whole reason Arena is built the way it is. The AI plays the client and reports observations — how many turns you spoke in, how many questions you asked, where the client felt pushed. It never tells you what to do differently. That judgement belongs to a human who knows your market, your method and you.",
  },
  {
    q: "Who is Arena for right now?",
    a: "Singapore property agents. Every persona, budget, objection and scenario has been written for that market specifically rather than translated from a generic sales course. Financial advisors are the next industry we're opening up, and the personas for it are already written.",
  },
  {
    q: "How is this different from just practising with ChatGPT?",
    a: "You can absolutely ask a chatbot to roleplay a buyer. It will be agreeable, forget its own budget halfway through, and eventually agree with everything you say. Arena's clients hold a fixed persona with a real constraint, and the Impossible ones are built so that you cannot win — only handle it well. Then there's the structured debrief and the record your coach can actually review.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. It runs in the browser on a phone, tablet or laptop with nothing to install. Voice is coming in the next phase, which will make the phone the more natural way to use it.",
  },
  {
    q: "What happens to my transcripts?",
    a: "They're stored against your account so you can review any past session. If you're part of a team, your manager can see your sessions — that's the point of the manager view. If you signed up on your own, nobody else can see them.",
  },
  {
    q: "Can I upload recordings of real client meetings?",
    a: "Not yet, but it's high on the list. The goal is to run a real call through the same debrief as a practice one, so a manager can compare what someone does in the arena with what they do in the field.",
  },
  {
    q: "Why is founder pricing so low?",
    a: "Because it's early and you'd be helping us find what's broken. Founder members are grandfathered permanently — as voice, coaching and video land, your price stays where it started.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="lp-section lp-section--cream" id="faq">
      <div className="lp-wrap">
        <div className="lp-head lp-head--center lp-reveal">
          <span className="lp-eyebrow">FAQ</span>
          <h2 className="lp-h2">Questions worth asking first.</h2>
        </div>

        <div className="lp-faq lp-reveal">
          {ITEMS.map((item, i) => (
            <div key={item.q} className={`lp-faq-item${open === i ? " is-open" : ""}`}>
              <button
                className="lp-faq-q"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                {item.q}
                <Plus size={20} strokeWidth={2} />
              </button>
              <div className="lp-faq-a">
                <div>
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
