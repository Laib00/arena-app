import React, { useEffect, useRef, useState } from "react";
import { Camera, Plus, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { NAVY, GOLD, inputStyle } from "../theme";
import {
  COACH_INDUSTRY_OPTIONS,
  COACH_PRACTICE_SKILL_OPTIONS,
  COACH_PROFILE_SELECT,
  isCoachProfileComplete,
  newCredentialId,
  normalizeCoachProfile,
  type CoachCredential,
  type CoachProfileRow,
} from "./coachProfile";
import { removeCoachAvatar, resolveAvatarUrl, uploadCoachAvatar } from "./coachAvatar";
import CoachProfilePreview, { type PreviewModel } from "./CoachProfilePreview";

type ProfileDraft = {
  displayName: string;
  headline: string;
  industries: string[];
  practiceSkills: string[];
  experienceRole: string;
  experienceOrg: string;
  experienceSummary: string;
  whoICoach: string;
  howICoach: string;
  qualifications: CoachCredential[];
  avatarPath: string | null;
  updatedAt: number;
};

function draftStorageKey(profileId: string) {
  return `arena.coachProfileDraft.v1.${profileId}`;
}

function readDraft(profileId: string): ProfileDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(profileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileDraft;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(profileId: string, draft: ProfileDraft) {
  try {
    localStorage.setItem(draftStorageKey(profileId), JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

function clearDraft(profileId: string) {
  try {
    localStorage.removeItem(draftStorageKey(profileId));
  } catch {
    /* ignore */
  }
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: NAVY,
  marginBottom: 6,
};

const hintStyle: React.CSSProperties = {
  fontWeight: 500,
  color: "#9CA3AF",
};

const sectionCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E2DFD6",
  borderRadius: 14,
  padding: 20,
  marginBottom: 16,
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 8,
  border: "none",
  background: GOLD,
  color: NAVY,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnGhost: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #E2DFD6",
  background: "#fff",
  color: NAVY,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};

type Props = {
  profileId: string;
  fullName?: string | null;
  initial?: CoachProfileRow | null;
  mode: "setup" | "edit";
  /** Soft update (e.g. photo) — do not navigate away. */
  onSaved: (row: CoachProfileRow) => void;
  /** Setup only: leave setup after a full Continue save. */
  onContinue?: (row: CoachProfileRow) => void;
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function ChipToggle({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: on ? `1.5px solid ${GOLD}` : "1px solid #E2DFD6",
              background: on ? "#FFF4EC" : "#fff",
              color: NAVY,
              fontSize: 13,
              fontWeight: on ? 700 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {on ? "✓ " : ""}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function CoachProfileForm({
  profileId,
  fullName,
  initial,
  mode,
  onSaved,
  onContinue,
}: Props) {
  const draft = typeof window !== "undefined" ? readDraft(profileId) : null;

  const [displayName, setDisplayName] = useState(
    () => draft?.displayName || initial?.display_name?.trim() || fullName?.trim() || ""
  );
  const [headline, setHeadline] = useState(() => draft?.headline ?? initial?.headline ?? "");
  const [industries, setIndustries] = useState<string[]>(
    () => draft?.industries ?? initial?.industries ?? []
  );
  const [practiceSkills, setPracticeSkills] = useState<string[]>(
    () => draft?.practiceSkills ?? initial?.practice_skills ?? []
  );
  const [experienceRole, setExperienceRole] = useState(
    () => draft?.experienceRole ?? initial?.experience_role ?? ""
  );
  const [experienceOrg, setExperienceOrg] = useState(
    () => draft?.experienceOrg ?? initial?.experience_org ?? ""
  );
  const [experienceSummary, setExperienceSummary] = useState(
    () => draft?.experienceSummary ?? initial?.experience_summary ?? ""
  );
  const [whoICoach, setWhoICoach] = useState(() => draft?.whoICoach ?? initial?.who_i_coach ?? "");
  const [howICoach, setHowICoach] = useState(() => draft?.howICoach ?? initial?.bio ?? "");
  const [qualifications, setQualifications] = useState<CoachCredential[]>(
    () =>
      draft?.qualifications?.length
        ? draft.qualifications
        : initial?.qualifications?.length
          ? initial.qualifications
          : []
  );
  const [avatarPath, setAvatarPath] = useState<string | null>(
    () => draft?.avatarPath ?? initial?.avatar_path ?? null
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState(
    () => (draft ? "Restored your unsaved edits from this browser." : null)
  );
  const skipNextDraftWrite = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await resolveAvatarUrl(avatarPath);
      if (!cancelled) setAvatarUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  // Keep a local draft so leaving the page without Save doesn’t wipe the form.
  useEffect(() => {
    if (skipNextDraftWrite.current) {
      skipNextDraftWrite.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      writeDraft(profileId, {
        displayName,
        headline,
        industries,
        practiceSkills,
        experienceRole,
        experienceOrg,
        experienceSummary,
        whoICoach,
        howICoach,
        qualifications,
        avatarPath,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [
    profileId,
    displayName,
    headline,
    industries,
    practiceSkills,
    experienceRole,
    experienceOrg,
    experienceSummary,
    whoICoach,
    howICoach,
    qualifications,
    avatarPath,
  ]);

  const preview: PreviewModel = {
    displayName,
    headline,
    industries,
    practiceSkills,
    experienceRole,
    experienceOrg,
    experienceSummary,
    whoICoach,
    howICoach,
    qualifications,
    avatarUrl,
  };

  async function persistAvatarPath(path: string) {
    const { data: existing } = await supabase
      .from("coach_profiles")
      .select("profile_id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existing) {
      const { data, error: upErr } = await supabase
        .from("coach_profiles")
        .update({ avatar_path: path, updated_at: new Date().toISOString() })
        .eq("profile_id", profileId)
        .select(COACH_PROFILE_SELECT)
        .maybeSingle();
      if (upErr) throw new Error(upErr.message);
      const row = normalizeCoachProfile(data as Record<string, unknown>);
      if (row) onSaved(row);
      return;
    }

    // Insert photo-only row without display_name so setup gate stays until Continue.
    const { data, error: insErr } = await supabase
      .from("coach_profiles")
      .insert({
        profile_id: profileId,
        display_name: mode === "setup" ? null : displayName.trim() || fullName?.trim() || null,
        avatar_path: path,
      })
      .select(COACH_PROFILE_SELECT)
      .maybeSingle();
    if (insErr) throw new Error(insErr.message);
    const row = normalizeCoachProfile(data as Record<string, unknown>);
    if (row) onSaved(row);
  }

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Profile photo must be under 4MB.");
      return;
    }
    setAvatarBusy(true);
    setError(null);
    try {
      const prev = avatarPath;
      const { path, signedUrl } = await uploadCoachAvatar(profileId, file);
      setAvatarPath(path);
      setAvatarUrl(signedUrl);
      if (prev && prev !== path) void removeCoachAvatar(prev);
      await persistAvatarPath(path);
      setDraftNote("Photo saved. Other fields still need Save / Continue.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  function addCredential() {
    setQualifications((prev) => [
      ...prev,
      { id: newCredentialId(), title: "", institution: "", year: "", link: "" },
    ]);
  }

  function updateCredential(id: string, patch: Partial<CoachCredential>) {
    setQualifications((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeCredential(id: string) {
    setQualifications((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("Add a display name to continue.");
      return;
    }
    setSaving(true);
    setError(null);
    const cleanQuals = qualifications
      .map((q) => ({
        id: q.id,
        title: q.title.trim(),
        institution: q.institution.trim(),
        year: (q.year || "").trim(),
        link: (q.link || "").trim(),
        verified: false,
      }))
      .filter((q) => q.title);

    const payload = {
      profile_id: profileId,
      display_name: name,
      bio: howICoach.trim() || null,
      headline: headline.trim() || null,
      experience_role: experienceRole.trim() || null,
      experience_org: experienceOrg.trim() || null,
      experience_summary: experienceSummary.trim() || null,
      qualifications: cleanQuals,
      who_i_coach: whoICoach.trim() || null,
      industries,
      practice_skills: practiceSkills,
      avatar_path: avatarPath,
      specialties: [...industries, ...practiceSkills],
      updated_at: new Date().toISOString(),
    };

    const { data, error: upsertErr } = await supabase
      .from("coach_profiles")
      .upsert(payload, { onConflict: "profile_id" })
      .select(COACH_PROFILE_SELECT)
      .maybeSingle();

    setSaving(false);
    if (upsertErr) {
      setError(
        upsertErr.message.includes("headline") || upsertErr.message.includes("column")
          ? `${upsertErr.message} — run supabase/add_coach_profile_details.sql in the SQL Editor, then try again.`
          : upsertErr.message
      );
      return;
    }
    const row = normalizeCoachProfile((data || payload) as Record<string, unknown>);
    if (!row || !isCoachProfileComplete(row)) {
      setError("Could not save profile. Try again.");
      return;
    }
    skipNextDraftWrite.current = true;
    clearDraft(profileId);
    setDraftNote(null);
    onSaved(row);
    if (mode === "setup" && onContinue) onContinue(row);
  }

  return (
    <div>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: GOLD,
          margin: "0 0 8px",
        }}
      >
        Coach
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 8px", color: NAVY }}>
        {mode === "setup" ? "Set up your coach profile" : "Edit coach profile"}
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.55, margin: "0 0 12px" }}>
        {mode === "setup"
          ? "Introduce yourself to your trainees. You can add experience and credentials anytime from your dashboard."
          : "This is how trainees will evaluate whether you’re the right coach for them."}
      </p>
      {draftNote ? (
        <p style={{ fontSize: 13, color: GOLD, margin: "0 0 18px", fontWeight: 600 }}>{draftNote}</p>
      ) : (
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 18px" }}>
          Photo saves as soon as you upload. Other fields are kept as a draft in this browser until you click{" "}
          {mode === "setup" ? "Continue" : "Save"}.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
          gap: 24,
          alignItems: "start",
        }}
        className="coach-profile-grid"
      >
        <form onSubmit={handleSubmit}>
          <div style={sectionCard}>
            <div style={{ fontWeight: 700, marginBottom: 14, color: NAVY }}>Profile details</div>

            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#E8E4DC",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: NAVY,
                  fontWeight: 700,
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                  />
                ) : (
                  <Camera size={22} aria-hidden />
                )}
              </div>
              <div>
                <label style={{ ...btnGhost, display: "inline-block", cursor: avatarBusy ? "wait" : "pointer" }}>
                  {avatarBusy ? "Uploading…" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    disabled={avatarBusy}
                    onChange={(e) => void onPickAvatar(e.target.files?.[0] || null)}
                  />
                </label>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>JPG, PNG or WebP · max 4MB</div>
              </div>
            </div>

            <label style={labelStyle}>Display name</label>
            <input
              style={{ ...inputStyle, marginBottom: 14 }}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How trainees should know you"
              required
              autoFocus={mode === "setup"}
            />

            <label style={labelStyle}>
              Professional headline <span style={hintStyle}>(optional)</span>
            </label>
            <input
              style={{ ...inputStyle, marginBottom: 14 }}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Real estate sales coach · Buyer consultations and negotiation"
            />

            <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
              Industry <span style={hintStyle}>(optional)</span>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6B7280" }}>
              Where you coach — keep this separate from practice skills.
            </p>
            <ChipToggle
              options={COACH_INDUSTRY_OPTIONS}
              selected={industries}
              onToggle={(v) => setIndustries((prev) => toggleInList(prev, v))}
            />

            <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: "16px 0 6px" }}>
              What we’ll practise <span style={hintStyle}>(optional)</span>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6B7280" }}>
              Skills trainees can rehearse with you (e.g. price objections in a property deal).
            </p>
            <ChipToggle
              options={COACH_PRACTICE_SKILL_OPTIONS}
              selected={practiceSkills}
              onToggle={(v) => setPracticeSkills((prev) => toggleInList(prev, v))}
            />
          </div>

          {mode === "edit" && (
            <>
              <div style={sectionCard}>
                <div style={{ fontWeight: 700, marginBottom: 14, color: NAVY }}>Relevant experience</div>
                <label style={labelStyle}>
                  Current role <span style={hintStyle}>(optional)</span>
                </label>
                <input
                  style={{ ...inputStyle, marginBottom: 12 }}
                  value={experienceRole}
                  onChange={(e) => setExperienceRole(e.target.value)}
                  placeholder="e.g. Real estate team lead"
                />
                <label style={labelStyle}>
                  Organisation <span style={hintStyle}>(optional)</span>
                </label>
                <input
                  style={{ ...inputStyle, marginBottom: 12 }}
                  value={experienceOrg}
                  onChange={(e) => setExperienceOrg(e.target.value)}
                  placeholder="Company or practice"
                />
                <label style={labelStyle}>
                  Summary <span style={hintStyle}>(optional)</span>
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 88, resize: "vertical" }}
                  value={experienceSummary}
                  onChange={(e) => setExperienceSummary(e.target.value)}
                  placeholder="Short summary of your practitioner or coaching experience"
                />
              </div>

              <div style={sectionCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontWeight: 700, color: NAVY }}>Qualifications & credentials</div>
                  <button type="button" onClick={addCredential} style={btnGhost}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Plus size={14} /> Add
                    </span>
                  </button>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6B7280", lineHeight: 1.45 }}>
                  Degrees, coaching certifications, licences. A Verified badge is reserved for credentials Arena has checked.
                </p>
                {qualifications.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>No credentials added yet.</p>
                ) : (
                  qualifications.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        border: "1px solid #E2DFD6",
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 10,
                      }}
                    >
                      <input
                        style={{ ...inputStyle, marginBottom: 8 }}
                        value={q.title}
                        onChange={(e) => updateCredential(q.id, { title: e.target.value })}
                        placeholder="Title (e.g. MSc, Advanced Certificate…)"
                      />
                      <input
                        style={{ ...inputStyle, marginBottom: 8 }}
                        value={q.institution}
                        onChange={(e) => updateCredential(q.id, { institution: e.target.value })}
                        placeholder="Issuing institution"
                      />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input
                          style={{ ...inputStyle, flex: "1 1 100px" }}
                          value={q.year || ""}
                          onChange={(e) => updateCredential(q.id, { year: e.target.value })}
                          placeholder="Year"
                        />
                        <input
                          style={{ ...inputStyle, flex: "2 1 160px" }}
                          value={q.link || ""}
                          onChange={(e) => updateCredential(q.id, { link: e.target.value })}
                          placeholder="Link (optional)"
                        />
                        <button
                          type="button"
                          onClick={() => removeCredential(q.id)}
                          style={{ ...btnGhost, color: "#7A2E3A" }}
                          aria-label="Remove credential"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={sectionCard}>
                <div style={{ fontWeight: 700, marginBottom: 14, color: NAVY }}>Who I coach</div>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  value={whoICoach}
                  onChange={(e) => setWhoICoach(e.target.value)}
                  placeholder="e.g. New property agents, experienced agents moving into team leadership"
                />
              </div>

              <div style={sectionCard}>
                <div style={{ fontWeight: 700, marginBottom: 14, color: NAVY }}>How I coach</div>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  value={howICoach}
                  onChange={(e) => setHowICoach(e.target.value)}
                  placeholder="e.g. We role-play a buyer consultation, review where you missed a cue, then repeat that part of the conversation."
                />
              </div>
            </>
          )}

          {error && (
            <div style={{ marginBottom: 14, color: "#7A2E3A", fontSize: 13, lineHeight: 1.45 }}>{error}</div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={saving || avatarBusy} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving
                ? "Saving…"
                : mode === "setup"
                  ? "Continue to dashboard →"
                  : "Save profile"}
            </button>
          </div>
        </form>

        <aside>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#9CA3AF",
              marginBottom: 10,
            }}
          >
            Profile preview
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6B7280" }}>As trainees will see it</p>
          <div style={{ position: "sticky", top: 24, overflow: "visible" }}>
            <CoachProfilePreview model={preview} />
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .coach-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
