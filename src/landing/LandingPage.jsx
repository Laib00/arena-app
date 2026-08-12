import React, { useEffect, useRef } from "react";
import "./landing.css";
import { useReveal } from "./useReveal";
import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import MeetThePeople from "./sections/MeetThePeople";
import Loop from "./sections/Loop";
import WhoArenaIsFor from "./sections/WhoArenaIsFor";
import Pricing from "./sections/Pricing";
import Waitlist from "./sections/Waitlist";
import Footer from "./sections/Footer";

export default function LandingPage() {
  const rootRef = useRef(null);
  useReveal(rootRef);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Arena — Practice the sales conversation before it costs you the deal";
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.title = previousTitle;
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="lp" ref={rootRef}>
      <Nav />
      <main>
        <Hero />
        <MeetThePeople />
        <Loop />
        <WhoArenaIsFor />
        <Pricing />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
