import React, { useCallback, useEffect, useState } from "react";
import { BookOpen, FileText } from "lucide-react";
import { supabase } from "../supabaseClient";
import { NAVY, GOLD, CREAM, ResponsiveStyles } from "../theme";
import PageHeader from "../components/PageHeader";
import CoachProfilePreview, { type PreviewModel } from "../coach/CoachProfilePreview";
import {
  COACH_PROFILE_SELECT,
  normalizeCoachProfile,
  type CoachProfileRow,
} from "../coach/coachProfile";
import { resolveAvatarUrl } from "../coach/coachAvatar";
import type { UserProfile } from "../types/domain";

type LibraryMaterial = {
  id: string;
  title: string;
  description: string | null;
  documents: { id: string; title: string }[];
};

type CoachRoom = {
  coachId: string;
  coach: CoachProfileRow | null;
  coachEmail: string | null;
  coachFullName: string | null;
  avatarUrl: string | null;
  libraries: LibraryMaterial[];
};

export default function PracticeRoom({
  profile,
  onBack,
  onSignOut,
  onPractice,
}: {
  profile: UserProfile;
  onBack: () => void;
  onSignOut: () => void;
  onPractice: (libraryId: string) => void;
}) {
  const [rooms, setRooms] = useState<CoachRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCoachId, setActiveCoachId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: enrolls, error: e1 } = await supabase
      .from("library_enrollments")
      .select("library_id, expires_at")
      .eq("profile_id", profile.id);
    if (e1) {
      setError(e1.message);
      setRooms([]);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const libIds = (enrolls || [])
      .filter((e) => {
        if (!e.expires_at) return true;
        const t = new Date(String(e.expires_at)).getTime();
        return Number.isNaN(t) || t > now;
      })
      .map((e) => e.library_id as string)
      .filter(Boolean);

    if (!libIds.length) {
      setRooms([]);
      setActiveCoachId(null);
      setLoading(false);
      return;
    }

    const { data: libs, error: e2 } = await supabase
      .from("knowledge_libraries")
      .select("id, title, description, owner_id, status")
      .in("id", libIds)
      .eq("status", "active");
    if (e2) {
      setError(e2.message);
      setRooms([]);
      setLoading(false);
      return;
    }

    const libraryRows = (libs || []) as {
      id: string;
      title: string;
      description: string | null;
      owner_id: string;
    }[];

    if (!libraryRows.length) {
      setRooms([]);
      setActiveCoachId(null);
      setLoading(false);
      return;
    }

    const activeLibIds = libraryRows.map((l) => l.id);
    const { data: docs, error: e3 } = await supabase
      .from("knowledge_documents")
      .select("id, title, library_id")
      .in("library_id", activeLibIds)
      .eq("processing_status", "ready")
      .order("created_at", { ascending: true });
    if (e3) console.warn("practice room documents:", e3.message);

    const docsByLib = new Map<string, { id: string; title: string }[]>();
    for (const d of docs || []) {
      const lid = d.library_id as string;
      const list = docsByLib.get(lid) || [];
      list.push({ id: d.id as string, title: String(d.title || "Material") });
      docsByLib.set(lid, list);
    }

    const coachIds = [...new Set(libraryRows.map((l) => l.owner_id))];
    const [{ data: coachProfiles }, { data: profiles }] = await Promise.all([
      supabase.from("coach_profiles").select(COACH_PROFILE_SELECT).in("profile_id", coachIds),
      supabase.from("profiles").select("id, email, full_name").in("id", coachIds),
    ]);

    const coachById = new Map<string, CoachProfileRow>();
    for (const raw of coachProfiles || []) {
      const row = normalizeCoachProfile(raw as Record<string, unknown>);
      if (row) coachById.set(row.profile_id, row);
    }
    const profileById = new Map(
      (profiles || []).map((p) => [
        p.id as string,
        {
          email: (p.email as string | null) ?? null,
          full_name: (p.full_name as string | null) ?? null,
        },
      ])
    );

    const avatarEntries = await Promise.all(
      coachIds.map(async (id) => {
        const path = coachById.get(id)?.avatar_path ?? null;
        const url = await resolveAvatarUrl(path);
        return [id, url] as const;
      })
    );
    const avatarById = new Map(avatarEntries);

    const byCoach = new Map<string, LibraryMaterial[]>();
    for (const lib of libraryRows) {
      const list = byCoach.get(lib.owner_id) || [];
      list.push({
        id: lib.id,
        title: String(lib.title || "Library"),
        description: lib.description,
        documents: docsByLib.get(lib.id) || [],
      });
      byCoach.set(lib.owner_id, list);
    }

    const nextRooms: CoachRoom[] = coachIds.map((coachId) => {
      const meta = profileById.get(coachId);
      return {
        coachId,
        coach: coachById.get(coachId) || null,
        coachEmail: meta?.email ?? null,
        coachFullName: meta?.full_name ?? null,
        avatarUrl: avatarById.get(coachId) ?? null,
        libraries: byCoach.get(coachId) || [],
      };
    });
    nextRooms.sort((a, b) => {
      const an =
        a.coach?.display_name || a.coachFullName || a.coachEmail || a.coachId;
      const bn =
        b.coach?.display_name || b.coachFullName || b.coachEmail || b.coachId;
      return an.localeCompare(bn);
    });

    setRooms(nextRooms);
    setActiveCoachId((prev) => {
      if (prev && nextRooms.some((r) => r.coachId === prev)) return prev;
      return nextRooms[0]?.coachId ?? null;
    });
    setLoading(false);
  }, [profile.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = rooms.find((r) => r.coachId === activeCoachId) || rooms[0] || null;

  function previewFromRoom(room: CoachRoom): PreviewModel {
    const c = room.coach;
    const fallbackName =
      c?.display_name?.trim() ||
      room.coachFullName?.trim() ||
      room.coachEmail ||
      "Your coach";
    return {
      displayName: fallbackName,
      headline: c?.headline || "",
      industries: c?.industries || [],
      practiceSkills: c?.practice_skills || [],
      experienceRole: c?.experience_role || "",
      experienceOrg: c?.experience_org || "",
      experienceSummary: c?.experience_summary || "",
      whoICoach: c?.who_i_coach || "",
      howICoach: c?.bio || "",
      qualifications: c?.qualifications || [],
      avatarUrl: room.avatarUrl,
    };
  }

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "-apple-system, sans-serif" }}>
      <ResponsiveStyles />
      <PageHeader
        brand="back"
        onHome={onBack}
        title="My Practice Room"
        actions={
          <>
            <button type="button" onClick={onBack} className="arena-topbar-link">
              Home
            </button>
            <button type="button" onClick={onSignOut} className="arena-topbar-link">
              Sign Out
            </button>
          </>
        }
      />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 48px" }}>
        <p style={{ margin: "0 0 24px", fontSize: 15, color: "#6B7280", lineHeight: 1.5, maxWidth: 560 }}>
          Your coach classroom — see who you&apos;re practicing with, their materials, and start a
          session grounded in that library.
        </p>

        {loading ? (
          <p style={{ color: "#6B7280" }}>Loading your practice room…</p>
        ) : error ? (
          <p style={{ color: "#7A2E3A" }}>{error}</p>
        ) : rooms.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #E2DFD6",
              borderRadius: 14,
              padding: 28,
              maxWidth: 520,
            }}
          >
            <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: NAVY, marginBottom: 8 }}>
              No coach classroom yet
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
              When a coach enrolls you in an active library, their profile and materials will show
              up here.
            </p>
          </div>
        ) : (
          <>
            {rooms.length > 1 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {rooms.map((r) => {
                  const label =
                    r.coach?.display_name || r.coachFullName || r.coachEmail || "Coach";
                  const on = r.coachId === (active?.coachId ?? "");
                  return (
                    <button
                      key={r.coachId}
                      type="button"
                      onClick={() => setActiveCoachId(r.coachId)}
                      style={{
                        border: on ? `1.5px solid ${NAVY}` : "1px solid #E2DFD6",
                        background: on ? "#fff" : "transparent",
                        color: NAVY,
                        borderRadius: 999,
                        padding: "8px 14px",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {active && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(260px, 340px) minmax(0, 1fr)",
                  gap: 24,
                  alignItems: "start",
                }}
                className="arena-practice-room-grid"
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#9CA3AF",
                      marginBottom: 10,
                    }}
                  >
                    Your coach
                  </div>
                  <CoachProfilePreview model={previewFromRoom(active)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#9CA3AF",
                    }}
                  >
                    Classroom materials
                  </div>

                  {active.libraries.map((lib) => (
                    <div
                      key={lib.id}
                      style={{
                        background: "#fff",
                        border: "1px solid #E2DFD6",
                        borderRadius: 14,
                        padding: 20,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "#FFF4EC",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <BookOpen size={18} color={GOLD} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "Georgia, serif",
                              fontSize: 20,
                              fontWeight: 700,
                              color: NAVY,
                            }}
                          >
                            {lib.title}
                          </div>
                          {lib.description ? (
                            <p
                              style={{
                                margin: "6px 0 0",
                                fontSize: 14,
                                color: "#6B7280",
                                lineHeight: 1.5,
                              }}
                            >
                              {lib.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ marginTop: 16 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#6B7280",
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          Materials ({lib.documents.length})
                        </div>
                        {lib.documents.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>
                            No materials ready yet. Check back after your coach uploads content.
                          </p>
                        ) : (
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {lib.documents.map((d) => (
                              <li
                                key={d.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "10px 0",
                                  borderTop: "1px solid #F0EEE7",
                                  fontSize: 14,
                                  color: NAVY,
                                }}
                              >
                                <FileText size={15} color="#9CA3AF" style={{ flexShrink: 0 }} />
                                <span style={{ fontWeight: 600 }}>{d.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onPractice(lib.id)}
                        style={{
                          marginTop: 18,
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: GOLD,
                          color: NAVY,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Practice with this library
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 800px) {
          .arena-practice-room-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
