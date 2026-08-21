import React, { useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { DISC, SALES_STYLES, CERTIFICATIONS, NATIONALITIES, EDU_LEVELS } from "./constants";
import { NAVY, ACCENT as GOLD, CREAM } from "./theme";
import type { DiscType } from "./types/domain";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(
    searchParams.get("signup") === "1" || searchParams.get("mode") === "signup"
      ? "signup"
      : "login"
  ); // login | signup
  // signup only: choose method → email credentials → agent profile
  const [signupStep, setSignupStep] = useState("choose"); // choose | email | profile
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [industry] = useState("Property");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("Singaporean");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState<string>(EDU_LEVELS[2]);
  const [disc, setDisc] = useState("I");
  const [salesStyle, setSalesStyle] = useState<string>(SALES_STYLES[0]);
  const [certification, setCertification] = useState<string>(CERTIFICATIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function goLogin() {
    setMode("login");
    setSignupStep("choose");
    setError(null);
    setMessage(null);
  }

  function goSignup() {
    setMode("signup");
    setSignupStep("choose");
    setError(null);
    setMessage(null);
  }

  function continueToProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setSignupStep("profile");
  }

  async function handleEmailLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const agentProfile = {
        name: fullName || email,
        age,
        occupation: industry === "Property" ? "Property Agent" : "Financial Advisor",
        nationality,
        experience,
        education,
        disc,
        salesStyle,
        certification,
      };
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || email, industry, agent_profile: agentProfile } },
      });
      if (err) throw err;
      setMessage("If this is a new account, check your email to confirm it, then log in. If you already have an account with this email (including via Google), just log in directly instead.");
      goLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/app` },
      });
      if (err) throw err;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to continue with Google.");
      setLoading(false);
    }
  }

  const wide = mode === "signup" && signupStep === "profile";
  const subtitle =
    mode === "login"
      ? "Log in to continue"
      : signupStep === "choose"
        ? "How do you want to sign up?"
        : signupStep === "email"
          ? "Sign up with email"
          : "Your agent profile";

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: CREAM, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: wide ? 460 : 380, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/arena-logo-128.png"
            alt=""
            width={48}
            height={48}
            decoding="async"
            style={{ display: "block", margin: "0 auto 12px" }}
          />
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, margin: 0, color: NAVY }}>Arena</h1>
          <p style={{ color: "#6B7280", fontSize: 13, marginTop: 6 }}>{subtitle}</p>
        </div>

        {mode === "login" && (
          <>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              style={secondaryBtnStyle}
            >
              Continue with Google
            </button>
            <OrDivider />
            <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
              {error && <ErrorBox>{error}</ErrorBox>}
              {message && <MessageBox>{message}</MessageBox>}
              <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
                {loading ? "Please wait..." : "Log In"}
              </button>
            </form>
          </>
        )}

        {mode === "signup" && signupStep === "choose" && (
          <>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              style={secondaryBtnStyle}
            >
              Continue with Google
            </button>
            <OrDivider />
            <button
              type="button"
              onClick={() => { setError(null); setSignupStep("email"); }}
              disabled={loading}
              style={primaryBtnStyle(loading)}
            >
              Sign up with email
            </button>
            {error && <div style={{ marginTop: 12 }}><ErrorBox>{error}</ErrorBox></div>}
          </>
        )}

        {mode === "signup" && signupStep === "email" && (
          <form onSubmit={continueToProfile} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            {error && <ErrorBox>{error}</ErrorBox>}
            <button type="submit" style={primaryBtnStyle(false)}>Continue</button>
            <button
              type="button"
              onClick={() => { setError(null); setSignupStep("choose"); }}
              style={linkStyle}
            >
              Back
            </button>
          </form>
        )}

        {mode === "signup" && signupStep === "profile" && (
          <form onSubmit={handleEmailSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={inputStyle}
            />
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Industry</div>
              <div style={{
                padding: "10px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: `2px solid ${NAVY}`, background: NAVY, color: "#fff",
              }}>
                Property
              </div>
            </div>

            <div style={{ borderTop: "1px solid #E2DFD6", paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10 }}>YOUR AGENT PROFILE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <SmallField label="Age">
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} />
                </SmallField>
                <SmallField label="Experience (months)">
                  <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} style={inputStyle} />
                </SmallField>
                <SmallField label="Nationality" full>
                  <input
                    list="nationality-options"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Start typing..."
                    style={inputStyle}
                  />
                  <datalist id="nationality-options">
                    {NATIONALITIES.map((n) => <option key={n} value={n} />)}
                  </datalist>
                </SmallField>
                <SmallField label="Educational Level" full>
                  <select value={education} onChange={(e) => setEducation(e.target.value)} style={inputStyle}>
                    {EDU_LEVELS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </SmallField>
                <SmallField label="Personality (DISC)">
                  <select value={disc} onChange={(e) => setDisc(e.target.value)} style={inputStyle}>
                    {(Object.keys(DISC) as DiscType[]).map((d) => <option key={d} value={d}>{d} — {DISC[d].name}</option>)}
                  </select>
                </SmallField>
                <SmallField label="Sales Style">
                  <select value={salesStyle} onChange={(e) => setSalesStyle(e.target.value)} style={inputStyle}>
                    {SALES_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </SmallField>
                <SmallField label="Professional Certification" full>
                  <select value={certification} onChange={(e) => setCertification(e.target.value)} style={inputStyle}>
                    {CERTIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </SmallField>
              </div>
            </div>

            {error && <ErrorBox>{error}</ErrorBox>}
            <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? "Please wait..." : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => { setError(null); setSignupStep("email"); }}
              style={linkStyle}
            >
              Back
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20 }}>
          {mode === "login" ? (
            <>Don&apos;t have an account?{" "}
              <button type="button" onClick={goSignup} style={linkStyle}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={goLogin} style={linkStyle}>Log in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, marginTop: 0 }}>
      <div style={{ flex: 1, height: 1, background: "#E2DFD6" }} />
      <span style={{ fontSize: 12, color: "#9CA3AF" }}>or</span>
      <div style={{ flex: 1, height: 1, background: "#E2DFD6" }} />
    </div>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return <div style={{ background: "#FCE4E4", color: "#7A2E3A", padding: "9px 12px", borderRadius: 7, fontSize: 13 }}>{children}</div>;
}

function MessageBox({ children }: { children: ReactNode }) {
  return <div style={{ background: "#E2EFDA", color: "#2F5233", padding: "9px 12px", borderRadius: 7, fontSize: 13 }}>{children}</div>;
}

const inputStyle: CSSProperties = {
  padding: "11px 12px", borderRadius: 8, border: "1px solid #E2DFD6", fontSize: 14,
  fontFamily: "inherit", boxSizing: "border-box", width: "100%",
};

function SmallField({ label, full = false, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const linkStyle = {
  background: "none", border: "none", color: "#0A1628", fontWeight: 700, cursor: "pointer",
  textDecoration: "underline", fontSize: 13, padding: 0, fontFamily: "inherit",
};

const secondaryBtnStyle = {
  width: "100%", padding: "11px", borderRadius: 8, border: "1px solid #E2DFD6", background: "#fff",
  color: NAVY, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 16,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};

function primaryBtnStyle(loading: boolean): CSSProperties {
  return {
    width: "100%", padding: "12px", borderRadius: 8, border: "none", background: GOLD, color: NAVY,
    fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
  };
}
