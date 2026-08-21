import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";
import { useReveal } from "./useReveal";
import { supabase } from "../supabaseClient";
import { appPath } from "../routes";
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
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useReveal(rootRef);

  // Logged-in users who hit Back to "/" should stay in the app
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        navigate(appPath(), { replace: true });
        return;
      }
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess) navigate(appPath(), { replace: true });
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!ready) return;
    const previousTitle = document.title;
    document.title = "Arena";
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.title = previousTitle;
      document.documentElement.style.scrollBehavior = "";
    };
  }, [ready]);

  if (!ready) {
    return null;
  }

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
