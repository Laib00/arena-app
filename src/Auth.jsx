import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const NAVY = "#0A1628";
const GOLD = "#D4AF37";
const CREAM = "#F7F4EE";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [industry, setIndustry] = useState("Property");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleEmailAuth(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || email, industry } },
        });
        if (err) throw err;
        setMessage("Check your email to confirm your account, then log in.");
        setMode("login");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message);
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
        options: { redirectTo: window.location.origin },
      });
      if (err) throw err;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: CREAM, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", border: `2px solid ${GOLD}`, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${GOLD}` }} />
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, margin: 0, color: NAVY }}>THE ARENA</h1>
          <p style={{ color: "#6B7280", fontSize: 13, marginTop: 6 }}>
            {mode === "login" ? "Log in to continue" : "Create your account"}
          </p>
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{
            width: "100%", padding: "11px", borderRadius: 8, border: "1px solid #E2DFD6", background: "#fff",
            color: NAVY, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "#E2DFD6" }} />
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#E2DFD6" }} />
        </div>

        <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <>
              <input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
              />
              <div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Industry</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Property", "Financial Planning"].map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                        border: industry === ind ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
                        background: industry === ind ? NAVY : "#fff",
                        color: industry === ind ? "#fff" : NAVY,
                      }}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {error && <div style={{ background: "#FCE4E4", color: "#7A2E3A", padding: "9px 12px", borderRadius: 7, fontSize: 13 }}>{error}</div>}
          {message && <div style={{ background: "#E2EFDA", color: "#2F5233", padding: "9px 12px", borderRadius: 7, fontSize: 13 }}>{message}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px", borderRadius: 8, border: "none", background: GOLD, color: NAVY,
              fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20 }}>
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => { setMode("signup"); setError(null); setMessage(null); }} style={linkStyle}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(null); setMessage(null); }} style={linkStyle}>Log in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "11px 12px", borderRadius: 8, border: "1px solid #E2DFD6", fontSize: 14,
  fontFamily: "inherit", boxSizing: "border-box", width: "100%",
};

const linkStyle = {
  background: "none", border: "none", color: "#0A1628", fontWeight: 700, cursor: "pointer",
  textDecoration: "underline", fontSize: 13, padding: 0, fontFamily: "inherit",
};
