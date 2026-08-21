import React from "react";
import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Who Arena is for", href: "#who-arena-is-for" },
      { label: "The Gap", href: "#the-gap" },
      { label: "The clients", href: "#clients" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Who it's for",
    links: [
      { label: "Property agents", href: "#who-its-for" },
      { label: "Team leaders", href: "#who-its-for" },
      { label: "Coaches", href: "#who-its-for" },
      { label: "Financial advisors", href: "#roadmap" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Get early access", href: "/app?signup=1" },
      { label: "FAQ", href: "#faq" },
      { label: "hello@arena.app", href: "mailto:hello@arena.app" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-top">
          <div>
            <a className="lp-logo lp-logo--light" href="#top">
              <img
                className="lp-logo-mark"
                src="/arena-logo-128.png"
                alt=""
                width={30}
                height={30}
                loading="lazy"
                decoding="async"
              />
              Arena
            </a>
            <p className="lp-footer-blurb">Where professionals come to practice.</p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h6>{col.title}</h6>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} Arena. All rights reserved.</span>
          <Link to="/app?signup=1">Log in to Arena</Link>
        </div>
      </div>
    </footer>
  );
}
