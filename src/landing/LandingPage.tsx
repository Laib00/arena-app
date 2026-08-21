import React, { useEffect, useRef } from "react";
import "./landing.css";
import { useReveal } from "./useReveal";
import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import WhyArena from "./sections/WhyArena";
import MeetThePeople from "./sections/MeetThePeople";
import Loop from "./sections/Loop";
import WhoArenaIsFor from "./sections/WhoArenaIsFor";
import DailyPractice from "./sections/DailyPractice";
import TheGap from "./sections/TheGap";
import LearningLoop from "./sections/LearningLoop";
import Pricing from "./sections/Pricing";
import Faq from "./sections/Faq";
import Footer from "./sections/Footer";

export default function LandingPage() {
  const rootRef = useRef(null);
  useReveal(rootRef);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Arena";
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
        <WhyArena />
        <TheGap />
        <LearningLoop />
        <Loop />
        <WhoArenaIsFor />
        <DailyPractice />
        <Pricing />
        <MeetThePeople />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
