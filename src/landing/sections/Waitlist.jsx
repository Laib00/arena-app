import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "../../supabaseClient";

const ROLES = [
  "Property agent",
  "Financial advisor",
  "Team leader / manager",
  "Independent coach",
  "Something else",
];

export default function Waitlist() {
  const [form, setForm] = useState({ name: "", email: "", role: "", company: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [errorMsg, setErrorMsg] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");

    const { error } = await supabase.from("waitlist").upsert(
      {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role || null,
        company: form.company.trim() || null,
        source: "landing",
      },
      { onConflict: "email", ignoreDuplicates: true }
    );

    if (error) {
      setStatus("error");
      // 42P01 = table doesn't exist yet, i.e. add_waitlist.sql hasn't been run.
      setErrorMsg(
        error.code === "42P01"
          ? "The waitlist isn't switched on yet. Email us at hello@arena.app and we'll add you by hand."
          : "Something went wrong on our end. Try again, or email hello@arena.app."
      );
      return;
    }

    setStatus("done");
  }

  return (
    <section className="lp-section lp-cta" id="waitlist">
      <div className="lp-wrap">
        <div className="lp-cta-inner">
          <span className="lp-eyebrow">Founder preview</span>
          <h2>Get in before the price moves.</h2>
          <p className="lp-lede" style={{ margin: "18px auto 0" }}>
            We're opening Arena to a small first group of property agents. Founder pricing is
            locked permanently for everyone in it.
          </p>

          {status === "done" ? (
            <div className="lp-done">
              <div className="lp-done-tick">
                <Check size={26} strokeWidth={2.6} />
              </div>
              <h3>You're on the list.</h3>
              <p>
                We'll be in touch at <strong>{form.email}</strong> when your access opens up.
                Founder pricing is held for you either way.
              </p>
            </div>
          ) : (
            <form className="lp-form" onSubmit={submit}>
              <div className="lp-form-row">
                <input
                  className="lp-input"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                  autoComplete="name"
                />
                <input
                  className="lp-input"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="lp-form-row">
                <select
                  className="lp-select"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    What do you do?
                  </option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input
                  className="lp-input"
                  type="text"
                  placeholder="Agency or team (optional)"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  autoComplete="organization"
                />
              </div>

              {status === "error" && (
                <div className="lp-form-msg lp-form-msg--err">{errorMsg}</div>
              )}

              <button
                className="lp-btn lp-btn--accent lp-btn--lg"
                type="submit"
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  "Adding you..."
                ) : (
                  <>
                    Claim founder access <ArrowRight size={17} />
                  </>
                )}
              </button>

              <p className="lp-form-note">
                No card required. We'll only email you about your access.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
