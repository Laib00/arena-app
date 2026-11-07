import React, { useEffect, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { ENABLE_EDUCATION_PACK, PRACTICE_PACK_STORAGE_KEY } from "./data/practicePack";
import { NAVY, ACCENT as GOLD, CREAM } from "./theme";
import type { PracticePack } from "./types/domain";
import { appPath } from "./routes";
import { clearCoachGoogleIntent, markCoachGoogleIntent } from "./authCoachIntent";

export type AuthVariant = "trainee" | "coach-signup";

type AuthProps = {
  /** `coach-signup`: dedicated /signup/coach flow — no trainee pack picker; sets account_type in metadata. */
  variant?: AuthVariant;
};

/** Trial / invite links: ?signup=1&email=...&name=...&pack=sales|property|education */
function packFromInviteParam(raw: string | null): PracticePack | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "sales" || v === "property") return "property";
  if (ENABLE_EDUCATION_PACK && (v === "education" || v === "interview")) return "education";
  // pack=education while Education is gated → still Property (trial invite stays valid)
  if (v === "education" || v === "interview") return "property";
  return null;
}

function inviteFromSearchParams(params: URLSearchParams) {
  const email = (params.get("email") || "").trim();
  const name = (params.get("name") || params.get("full_name") || "").trim();
  const pack = packFromInviteParam(params.get("pack"));
  const openSignup =
    params.get("signup") === "1" ||
    params.get("mode") === "signup" ||
    Boolean(email || name || pack);
  return { email, name, pack, openSignup };
}

export default function Auth({ variant = "trainee" }: AuthProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invite = inviteFromSearchParams(searchParams);
  const isCoachSignup = variant === "coach-signup";
  // While Education is gated, skip the pack picker — everyone is Property.
  const skipPackStep = isCoachSignup || !ENABLE_EDUCATION_PACK || Boolean(invite.pack);
  const initialPack: PracticePack =
    ENABLE_EDUCATION_PACK && invite.pack === "education" ? "education" : "property";

  const [authMode, setAuthMode] = useState<"login" | "signup">(
    isCoachSignup || invite.openSignup ? "signup" : "login"
  );
  // signup: pack (optional) → choose method → email → account created → onboarding in app
  const [signupStep, setSignupStep] = useState<"pack" | "choose" | "email">(
    skipPackStep ? "choose" : "pack"
  );
  const [practicePack, setPracticePack] = useState<PracticePack>(initialPack);
  const [email, setEmail] = useState(invite.email);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(invite.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inviteLockedPack = Boolean(invite.pack) || !ENABLE_EDUCATION_PACK;

  useEffect(() => {
    if (!isCoachSignup) return;
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data.session) return;
      navigate(appPath("/coach"), { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(appPath("/coach"), { replace: true });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [isCoachSignup, navigate]);

  useEffect(() => {
    try {
      sessionStorage.setItem(PRACTICE_PACK_STORAGE_KEY, initialPack);
    } catch {
      /* ignore */
    }
  }, [initialPack]);

  useEffect(() => {
    if (!ENABLE_EDUCATION_PACK && signupStep === "pack") {
      setSignupStep("choose");
      setPracticePack("property");
    }
  }, [signupStep]);

  function rememberPack(pack: PracticePack) {
    const next = !ENABLE_EDUCATION_PACK || pack !== "education" ? "property" : pack;
    setPracticePack(next);
    try {
      sessionStorage.setItem(PRACTICE_PACK_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function goLogin() {
    setAuthMode("login");
    setSignupStep(skipPackStep ? "choose" : "pack");
    setError(null);
    setMessage(null);
  }

  function goSignup() {
    setAuthMode("signup");
    setSignupStep(skipPackStep ? "choose" : "pack");
    setError(null);
    setMessage(null);
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
    if (!email.trim() || !password || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      // Account only — industry + agent details are completed after login.
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim() || email,
            practice_pack: practicePack,
            ...(isCoachSignup ? { account_type: "coach" as const } : {}),
          },
        },
      });
      if (err) throw err;
      setMessage(
        "If this is a new account, check your email to confirm it, then log in. If you already have an account with this email (including via Google), just log in directly instead."
      );
      if (isCoachSignup) {
        setMessage(
          "If this is a new account, check your email to confirm it, then log in here. After login you'll go to the coach dashboard."
        );
      } else {
        goLogin();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setLoading(true);
    // Only lock pack on signup Google; login must keep the existing profile pack.
    if (authMode === "signup" && !isCoachSignup) rememberPack(practicePack);
    const redirectPath = isCoachSignup
      ? `${appPath("/coach")}?coach_google_intent=1`
      : "/dashboard";
    try {
      // Google drops options.data. Remember coach intent across the redirect.
      if (isCoachSignup) markCoachGoogleIntent();
      else clearCoachGoogleIntent();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
          ...(authMode === "signup"
            ? {
                data: isCoachSignup
                  ? { account_type: "coach" as const, practice_pack: "property" as const }
                  : { practice_pack: practicePack },
              }
            : {}),
        },
      });
      if (err) throw err;
    } catch (err: unknown) {
      if (isCoachSignup) clearCoachGoogleIntent();
      setError(err instanceof Error ? err.message : "Unable to continue with Google.");
      setLoading(false);
    }
  }

  const subtitle = isCoachSignup
    ? authMode === "login"
      ? "Log in to coach dashboard"
      : signupStep === "choose"
        ? "Create your coach account"
        : "Create your coach account"
    : authMode === "login"
      ? "Log in to continue"
      : signupStep === "pack"
        ? "What will you practise?"
        : signupStep === "choose"
          ? "How do you want to sign up?"
          : "Create your account";

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: CREAM, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, padding: 32 }}>
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

        {authMode === "login" && (
          <>
            <button type="button" onClick={handleGoogleAuth} disabled={loading} style={secondaryBtnStyle}>
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

        {authMode === "signup" && signupStep === "pack" && ENABLE_EDUCATION_PACK && !isCoachSignup && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
              {([
                { id: "property" as const, title: "Property", desc: "Practise client conversations as a property agent." },
                { id: "education" as const, title: "Education", desc: "Practise interviews as a student or early-career candidate." },
              ]).map((opt) => {
                const selected = practicePack === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => rememberPack(opt.id)}
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: selected ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
                      background: selected ? NAVY : "#fff",
                      color: selected ? "#fff" : NAVY,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{opt.title}</div>
                    <div style={{ fontSize: 12, opacity: selected ? 0.85 : 0.7, lineHeight: 1.4 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => { setError(null); setSignupStep("choose"); }}
              style={{ ...primaryBtnStyle(false), marginTop: 12 }}
            >
              Continue
            </button>
            {error && <div style={{ marginTop: 12 }}><ErrorBox>{error}</ErrorBox></div>}
          </>
        )}

        {authMode === "signup" && signupStep === "choose" && (
          <>
            {ENABLE_EDUCATION_PACK && (
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, textAlign: "center" }}>
                Field: <strong style={{ color: NAVY }}>{practicePack === "education" ? "Education" : "Property"}</strong>
                {!inviteLockedPack && (
                  <>
                    {" · "}
                    <button type="button" onClick={() => setSignupStep("pack")} style={linkStyle}>Change</button>
                  </>
                )}
              </div>
            )}
            {(invite.email || invite.name) && (
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, textAlign: "center", lineHeight: 1.4 }}>
                {invite.name && <>Welcome, <strong style={{ color: NAVY }}>{invite.name}</strong></>}
                {invite.name && invite.email && <br />}
                {invite.email && <>Account email: <strong style={{ color: NAVY }}>{invite.email}</strong></>}
              </div>
            )}
            <button type="button" onClick={handleGoogleAuth} disabled={loading} style={secondaryBtnStyle}>
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

        {authMode === "signup" && signupStep === "email" && (
          <form onSubmit={handleEmailSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={inputStyle}
            />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            {error && <ErrorBox>{error}</ErrorBox>}
            <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? "Please wait..." : "Create account"}
            </button>
            <button type="button" onClick={() => { setError(null); setSignupStep("choose"); }} style={linkStyle}>
              Back
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20 }}>
          {authMode === "login" ? (
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
