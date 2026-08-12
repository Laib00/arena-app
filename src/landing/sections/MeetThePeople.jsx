import React from "react";
import { Shield, Heart, Star, Target, User, MoreHorizontal } from "lucide-react";
import DriftWall from "../../components/DriftWall/DriftWall";

const TAGS = [
  { icon: Shield, label: "Fears" },
  { icon: Heart, label: "Beliefs" },
  { icon: Star, label: "Experiences" },
  { icon: Target, label: "Motivations" },
  { icon: User, label: "Personalities" },
  { icon: MoreHorizontal, label: "And more" },
];

const ITEMS = [
  { image: "/MPBYMP/Card1.png", title: "Michelle" },
  { image: "/MPBYMP/Card2.png", title: "Persona 2" },
  { image: "/MPBYMP/Card3.png", title: "Persona 3" },
  { image: "/MPBYMP/Card4.png", title: "Persona 4" },
  { image: "/MPBYMP/Card5.png", title: "Persona 5" },
  { image: "/MPBYMP/Card6.png", title: "Persona 6" },
  { image: "/MPBYMP/Card7.png", title: "Persona 7" },
  { image: "/MPBYMP/Card8.png", title: "Persona 8" },
];

export default function MeetThePeople() {
  return (
    <section className="lp-section lp-section--paper" id="meet-the-people">
      <div className="lp-wrap">
        <div className="lp-mtp">
          <div className="lp-mtp-copy lp-reveal">
            <h2 className="lp-mtp-h">
              Meet People Before You
              <span>Meet People</span>
            </h2>

            <p className="lp-mtp-p">
              Practice conversations with a constantly growing cast of AI-powered characters,
              each with their own personality, background, fears, beliefs, experiences and
              motivations.
            </p>

            <div className="lp-mtp-tags">
              {TAGS.map((tag) => (
                <span key={tag.label} className="lp-mtp-tag">
                  <tag.icon size={16} strokeWidth={2} />
                  {tag.label}
                </span>
              ))}
            </div>

            <p className="lp-mtp-p">
              Choose someone from the Arena and start a conversation through text, voice or
              video. Each person responds differently based on who they are, what they believe
              and how the conversation develops.
            </p>

            <p className="lp-mtp-p lp-mtp-p--last">
              The goal isn’t to memorize the perfect script. It’s to build the ability to
              listen, understand and adapt before those conversations happen in the real world.
            </p>
          </div>

          <div className="lp-mtp-wall">
            <DriftWall
              items={ITEMS}
              columns={2}
              tileWidth={216}
              tileHeight={132}
              gap={18}
              tilt={16}
              turn={-14}
              perspective={1200}
              depth={120}
              speed={42}
              direction="up"
              variance={0.45}
              parallax={0.6}
              lift={64}
              fade={0.22}
              dim={0.55}
              overlayColor="#000000"
              radius={12}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
