import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { DISC, SALES_STYLES, CERTIFICATIONS, NATIONALITIES, EDU_LEVELS } from "../constants";
import { NAVY, GOLD, CREAM, inputStyle } from "../theme";
import { ENABLE_FINANCIAL_PLANNING } from "../data/personas";
import Field from "../components/Field";

export default function ProfileScreen({ profile, himself, himselfLoaded, industry, openChatCount = 0, onSave, onBack, onSignOut }) {
  const [form, setForm] = useState(himself);
  const [initialized, setInitialized] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [openChatNotice, setOpenChatNotice] = useState(null);
  const formRef = useRef(form);
  const dirtyRef = useRef(false);

  formRef.current = form;
  dirtyRef.current = dirty;

  const hasOpenChats = openChatCount > 0;

  // Don't let the form initialize from stale defaults if this screen is
  // opened before the real saved profile has finished loading.
  useEffect(() => {
    if (himselfLoaded && !initialized) {
      setForm(himself);
      setInitialized(true);
      setDirty(false);
    }
  }, [himselfLoaded, initialized, himself]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
    setOpenChatNotice(null);
  }

  async function persist(data) {
    setSaving(true);
    setError(null);
    try {
      await onSave(data);
      setDirty(false);
      setSaved(true);
      if (hasOpenChats) {
        setOpenChatNotice(
          openChatCount === 1
            ? "Saved. You still have 1 open chat — that session keeps using the profile from when it started. Your updated profile will apply to new sessions after you end the open chat."
            : `Saved. You still have ${openChatCount} open chats — those sessions keep using the profile from when they started. Your updated profile will apply to new sessions after you end the open chats.`
        );
      }
      return true;
    } catch (e) {
      setError(e.message);
      setOpenChatNotice(null);
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Auto-save shortly after the user edits a field.
  useEffect(() => {
    if (!initialized || !dirty) return;
    const timeout = setTimeout(() => persist(form), 800);
    return () => clearTimeout(timeout);
  }, [form, initialized, dirty]);

  async function handleSave() {
    await persist(form);
  }

  async function handleBack() {
    if (dirtyRef.current) {
      const ok = await persist(formRef.current);
      if (!ok) return;
    }
    onBack();
  }

  if (!himselfLoaded || !initialized) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, color: NAVY, fontFamily: "-apple-system, sans-serif" }}>
        Loading your profile...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={handleBack} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
            <ArrowLeft size={15} /> Back to app
          </button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)" }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>Your Profile</div>
        </div>
        <button onClick={onSignOut} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 24px 60px" }}>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>{profile?.email}</p>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
          Industry: <span style={{ fontWeight: 700, color: NAVY }}>{!ENABLE_FINANCIAL_PLANNING || industry === "Property" ? "Property" : "Financial Planning"}</span>
          <span style={{ color: "#9CA3AF" }}> — change this from the setup screen</span>
        </p>

        {hasOpenChats && (
          <div
            style={{
              background: "#FFF8E8",
              border: "1px solid #E8D4A8",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 16,
              fontSize: 13,
              lineHeight: 1.5,
              color: NAVY,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {openChatCount === 1 ? "You have 1 open chat" : `You have ${openChatCount} open chats`}
            </div>
            Profile changes are saved to your account, but open chats keep the profile from when that session started. End those chats (End Session) if you want new practice to use your updated profile.
          </div>
        )}

        {openChatNotice && (
          <div
            style={{
              background: "#EAF5EA",
              border: "1px solid #B7D8B7",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 16,
              fontSize: 13,
              lineHeight: 1.5,
              color: "#1F4D2A",
            }}
          >
            {openChatNotice}
          </div>
        )}

        <div className="arena-profile-grid" style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 12, padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Name">
            <input value={form.name} onChange={(e) => update("name", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Age">
            <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Occupation">
            <input value={form.occupation} onChange={(e) => update("occupation", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Nationality">
            <input
              list="profile-nationality-options"
              value={form.nationality}
              onChange={(e) => update("nationality", e.target.value)}
              style={inputStyle}
            />
            <datalist id="profile-nationality-options">
              {NATIONALITIES.map((n) => <option key={n} value={n} />)}
            </datalist>
          </Field>
          <Field label="Experience (months)">
            <input type="number" value={form.experience} onChange={(e) => update("experience", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Educational Level">
            <select value={form.education} onChange={(e) => update("education", e.target.value)} style={inputStyle}>
              {EDU_LEVELS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Personality (DISC)">
            <select value={form.disc} onChange={(e) => update("disc", e.target.value)} style={inputStyle}>
              {Object.keys(DISC).map((d) => <option key={d} value={d}>{d} — {DISC[d].name}</option>)}
            </select>
          </Field>
          <Field label="Sales Style">
            <select value={form.salesStyle} onChange={(e) => update("salesStyle", e.target.value)} style={inputStyle}>
              {SALES_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Professional Certification">
              <select value={form.certification} onChange={(e) => update("certification", e.target.value)} style={inputStyle}>
                {CERTIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {error && <div style={{ background: "#FCE4E4", color: "#7A2E3A", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginTop: 16 }}>{error}</div>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: 20, padding: "12px 24px", borderRadius: 8, border: "none",
            background: GOLD, color: NAVY, fontWeight: 700, fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
