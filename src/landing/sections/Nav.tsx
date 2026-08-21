import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#who-arena-is-for", label: "Who it's for" },
  { href: "#pricing", label: "Pricing" },
];

function Logo() {
  return (
    <a className="lp-logo" href="#top">
      <img
        className="lp-logo-mark"
        src="/arena-logo-128.png"
        alt=""
        width={30}
        height={30}
        decoding="async"
      />
      Arena
    </a>
  );
}

export default function Nav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`lp-nav${stuck ? " is-stuck" : ""}`}>
      <div className="lp-wrap">
        <nav className="lp-nav-inner">
          <Logo />

          <div className="lp-nav-links">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="lp-nav-actions">
            <Link className="lp-btn lp-btn--accent" to="/dashboard?signup=1">
              Get early access
            </Link>
            <Link className="lp-nav-login" to="/dashboard?signup=1">
              Log In
            </Link>
          </div>

          <button
            className="lp-nav-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        <div className={`lp-nav-mobile${open ? " is-open" : ""}`}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link to="/dashboard?signup=1" onClick={() => setOpen(false)}>
            Log In
          </Link>
          <Link
            className="lp-btn lp-btn--accent"
            to="/dashboard?signup=1"
            onClick={() => setOpen(false)}
          >
            Get early access
          </Link>
        </div>
      </div>
    </header>
  );
}
