import React, { useEffect, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import {
  DISC,
  SALES_STYLES,
  CERTIFICATIONS,
  NATIONALITIES,
  EDU_LEVELS,
  certificationsForIndustry,
  occupationForIndustry,
} from "./constants";
import {
  STUDENT_GRADE_OPTIONS,
  TARGET_PATHS,
  isStudentGrade,
} from "./data/educationInterview";
import { ENABLE_EDUCATION_PACK, PRACTICE_PACK_STORAGE_KEY } from "./data/practicePack";
import { NAVY, ACCENT as GOLD, CREAM } from "./theme";
import type { DiscType, PracticePack, StudentGrade } from "./types/domain";

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

type SignupIndustry = "Property" | "Financial Planning";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const invite = inviteFromSearchParams(searchParams);
  // While Education is gated, skip the pack picker — everyone is Property.
  const skipPackStep = !ENABLE_EDUCATION_PACK || Boolean(invite.pack);
  const initialPack: PracticePack =
    ENABLE_EDUCATION_PACK && invite.pack === "education" ? "education" : "property";

  const [mode, setMode] = useState(invite.openSignup ? "signup" : "login");
  // signup: choose pack → choose method → email → industry → profile
  // Invite with pack (or Education gated) skips pack picker; email/name are prefilled.
  const [signupStep, setSignupStep] = useState(skipPackStep ? "choose" : "pack"); // pack | choose | email | industry | profile
  const [practicePack, setPracticePack] = useState<PracticePack>(initialPack);
  const [email, setEmail] = useState(invite.email);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(invite.name);
  const [industry, setIndustry] = useState<SignupIndustry>("Property");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("Singaporean");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState<string>(EDU_LEVELS[2]);
  const [disc, setDisc] = useState("I");
  const [salesStyle, setSalesStyle] = useState<string>(SALES_STYLES[0]);
  const [certification, setCertification] = useState<string>(certificationsForIndustry("Property")[0]);
  const [studentGrade, setStudentGrade] = useState<StudentGrade>("university");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [targetPath, setTargetPath] = useState(TARGET_PATHS.university[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inviteLockedPack = Boolean(invite.pack) || !ENABLE_EDUCATION_PACK;

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

  const industryCerts = certificationsForIndustry(industry);

  function goLogin() {
    setMode("login");
    setSignupStep(skipPackStep ? "choose" : "pack");
    setError(null);
    setMessage(null);
  }

  function goSignup() {
    setMode("signup");
    setSignupStep(skipPackStep ? "choose" : "pack");
    setError(null);
    setMessage(null);
  }

  function continueToIndustry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setSignupStep("industry");
  }

  function selectIndustry(next: SignupIndustry) {
    setIndustry(next);
    const certs = certificationsForIndustry(next);
    setCertification(certs[0] ?? "");
  }

  function continueToProfile() {
    setError(null);
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
    if (practicePack === "education" && !isStudentGrade(studentGrade)) {
      setError("Please select your grade.");
      return;
    }
    setLoading(true);
    try {
      const agentProfile =
        practicePack === "education"
          ? {
              name: fullName || email,
              age,
              nationality,
              disc,
              studentGrade,
              fieldOfStudy,
              targetPath,
              occupation: undefined,
              salesStyle: undefined,
              certification: undefined,
              experience: undefined,
            }
          : {
              name: fullName || email,
              age,
              occupation: occupationForIndustry(industry),
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
        options: {
          data: {
            full_name: fullName || email,
            industry: industry === "Property" ? "Property" : "Financial Planning",
            practice_pack: practicePack,
            agent_profile: agentProfile,
          },
        },
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
    // Only lock pack on signup Google; login must keep the existing profile pack.
    if (mode === "signup") rememberPack(practicePack);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          ...(mode === "signup"
            ? { data: { practice_pack: practicePack } }
            : {}),
        },
      });
      if (err) throw err;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to continue with Google.");
      setLoading(false);
    }
  }

  const wide = mode === "signup" && (signupStep === "profile" || signupStep === "industry");
  const subtitle =
    mode === "login"
      ? "Log in to continue"
      : signupStep === "pack"
        ? "What will you practise?"
        : signupStep === "choose"
          ? "How do you want to sign up?"
          : signupStep === "email"
            ? "Sign up with email"
            : signupStep === "industry"
              ? "What do you practise for?"
              : practicePack === "education"
                ? "Your student profile"
                : "Your agent profile";

  const targetOptions = TARGET_PATHS[studentGrade] || TARGET_PATHS.university;

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

        {mode === "signup" && signupStep === "pack" && ENABLE_EDUCATION_PACK && (
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

        {mode === "signup" && signupStep === "choose" && (
          <>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, textAlign: "center" }}>
              Field: <strong style={{ color: NAVY }}>{practicePack === "education" ? "Education" : "Property"}</strong>
              {!inviteLockedPack && (
                <>
                  {" · "}
                  <button type="button" onClick={() => setSignupStep("pack")} style={linkStyle}>Change</button>
                </>
              )}
            </div>
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

        {mode === "signup" && signupStep === "email" && (
          <form onSubmit={continueToIndustry} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            {error && <ErrorBox>{error}</ErrorBox>}
            <button type="submit" style={primaryBtnStyle(false)}>Continue</button>
            <button type="button" onClick={() => { setError(null); setSignupStep("choose"); }} style={linkStyle}>
              Back
            </button>
          </form>
        )}

        {mode === "signup" && signupStep === "industry" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(
                [
                  {
                    key: "Property" as const,
                    title: "Property",
                    body: "Buyers, sellers, tenants, and listings.",
                  },
                  {
                    key: "Financial Planning" as const,
                    title: "Financial Planning",
                    body: "Protection, investment, and retirement conversations.",
                  },
                ] as const
              ).map((opt) => {
                const selected = industry === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => selectIndustry(opt.key)}
                    style={{
                      textAlign: "left",
                      padding: "16px 14px",
                      borderRadius: 12,
                      border: selected ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
                      background: selected ? NAVY : "#fff",
                      color: selected ? "#fff" : NAVY,
                      cursor: "pointer",
                      boxShadow: selected ? "0 8px 20px rgba(10,22,40,0.18)" : "none",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{opt.title}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.45, opacity: selected ? 0.9 : 0.7 }}>{opt.body}</div>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={continueToProfile} style={primaryBtnStyle(false)}>
              Continue
            </button>
            <button
              type="button"
              onClick={() => { setError(null); setSignupStep("email"); }}
              style={linkStyle}
            >
              Back
            </button>
          </div>
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
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                {practicePack === "education" ? "Field" : "Industry"}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{
                  padding: "10px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `2px solid ${NAVY}`, background: NAVY, color: "#fff", flex: 1,
                }}>
                  {practicePack === "education" ? "Education" : industry}
                </div>
                {practicePack !== "education" && (
                  <button
                    type="button"
                    onClick={() => setSignupStep("industry")}
                    style={{ ...linkStyle, flexShrink: 0 }}
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            {practicePack === "education" ? (
              <div style={{ borderTop: "1px solid #E2DFD6", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10 }}>YOUR STUDENT PROFILE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <SmallField label="Age">
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} />
                  </SmallField>
                  <SmallField label="Nationality">
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
                  <SmallField label="Grade" full>
                    <select
                      value={studentGrade}
                      onChange={(e) => {
                        const next = e.target.value as StudentGrade;
                        setStudentGrade(next);
                        setTargetPath(TARGET_PATHS[next][0]);
                      }}
                      required
                      style={inputStyle}
                    >
                      {STUDENT_GRADE_OPTIONS.map((g) => (
                        <option key={g.id} value={g.id}>{g.label}</option>
                      ))}
                    </select>
                  </SmallField>
                  <SmallField label="Field of study / stream" full>
                    <input
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      placeholder="e.g. Business, Computing, Science"
                      style={inputStyle}
                    />
                  </SmallField>
                  <SmallField label="What are you practising for?" full>
                    <select value={targetPath} onChange={(e) => setTargetPath(e.target.value)} style={inputStyle}>
                      {targetOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </SmallField>
                  <SmallField label="Personality (DISC)" full>
                    <select value={disc} onChange={(e) => setDisc(e.target.value)} style={inputStyle}>
                      {(Object.keys(DISC) as DiscType[]).map((d) => (
                        <option key={d} value={d}>{d} — {DISC[d].name}</option>
                      ))}
                    </select>
                  </SmallField>
                </div>
              </div>
            ) : (
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
                      {industryCerts.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </SmallField>
                </div>
              </div>
            )}

            {error && <ErrorBox>{error}</ErrorBox>}
            <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? "Please wait..." : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSignupStep(practicePack === "education" ? "email" : "industry");
              }}
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
