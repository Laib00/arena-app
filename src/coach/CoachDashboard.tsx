import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Check, Plus, Users } from "lucide-react";
import { supabase } from "../supabaseClient";
import { appPath } from "../routes";
import { NAVY, GOLD } from "../theme";
import { coachInitials, type CoachProfileRow } from "./coachProfile";
import { resolveAvatarUrl } from "./coachAvatar";

const LIBRARY_CARD_ART = "/images/ecosystem/coaches/coach_library_card.png";

type Props = {
  profileId: string;
  coachProfile: CoachProfileRow;
};

type LibrarySummary = {
  id: string;
  title: string;
  status: string;
  docCount: number;
};

type DashData = {
  libraries: LibrarySummary[];
  activeLibraries: number;
  students: number;
  loading: boolean;
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E2DFD6",
  borderRadius: 14,
  padding: 18,
};

const btnSolid: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 16px",
  borderRadius: 8,
  border: "none",
  background: GOLD,
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnOutline: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 14px",
  borderRadius: 8,
  border: `1.5px solid ${GOLD}`,
  background: "#fff",
  color: GOLD,
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

function statusLabel(status: string): string {
  if (status === "active") return "Active";
  if (status === "archived") return "Archived";
  return "Draft";
}

function ProfileMiniCard({
  coachProfile,
  avatarUrl,
}: {
  coachProfile: CoachProfileRow;
  avatarUrl: string | null;
}) {
  const name = coachProfile.display_name?.trim() || "Coach";
  const needsEnrichment =
    !coachProfile.headline?.trim() &&
    !coachProfile.experience_summary?.trim() &&
    !(coachProfile.qualifications?.length > 0);

  return (
    <div style={card}>
      <div style={{ fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 14 }}>Coach profile</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#FFF4EC",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: NAVY,
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
          ) : (
            coachInitials(name)
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: NAVY }}>{name}</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Coach</div>
        </div>
      </div>
      {needsEnrichment ? (
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280", lineHeight: 1.45 }}>
          Add a headline, experience, and credentials.
        </p>
      ) : coachProfile.headline?.trim() ? (
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280", lineHeight: 1.45 }}>
          {coachProfile.headline.trim()}
        </p>
      ) : (
        <div style={{ height: 8 }} />
      )}
      <Link to={appPath("/coach/profile")} style={btnOutline}>
        Edit profile
      </Link>
    </div>
  );
}

function EmptyDashboard({
  name,
  coachProfile,
  avatarUrl,
  onCreateLibrary,
  creating,
}: {
  name: string;
  coachProfile: CoachProfileRow;
  avatarUrl: string | null;
  onCreateLibrary: () => void;
  creating: boolean;
}) {
  return (
    <div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, margin: "0 0 6px", color: NAVY }}>
        Welcome, {name}
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 8px" }}>Set up your coaching workspace.</p>
      <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 24px" }}>
        0 libraries · 0 active libraries · 0 enrolled students
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(240px, 0.75fr)",
          gap: 16,
          alignItems: "start",
        }}
        className="coach-dash-grid"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #F0E4DC",
              minHeight: 200,
              background: "#FFF1ED",
            }}
          >
            <img
              src={LIBRARY_CARD_ART}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "right bottom",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                padding: "28px 24px",
                maxWidth: "58%",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: GOLD,
                  marginBottom: 10,
                }}
              >
                Get started
              </span>
              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 26,
                  margin: "0 0 8px",
                  color: NAVY,
                  lineHeight: 1.2,
                }}
              >
                Create your first library
              </h2>
              <p style={{ margin: "0 0 18px", fontSize: 14, color: "#6B7280", lineHeight: 1.45 }}>
                Add your coaching material and activate it for students.
              </p>
              <button
                type="button"
                onClick={onCreateLibrary}
                disabled={creating}
                style={{ ...btnSolid, opacity: creating ? 0.7 : 1 }}
              >
                <Plus size={16} aria-hidden />
                {creating ? "Creating…" : "Create library"}
              </button>
            </div>
          </div>

          <div
            style={{
              ...card,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#F7F5F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={18} color={NAVY} aria-hidden />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: NAVY }}>Students</div>
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>No students enrolled yet.</div>
              </div>
            </div>
            <Link
              to={appPath("/coach/students")}
              style={{ fontSize: 13, fontWeight: 700, color: GOLD, textDecoration: "none" }}
            >
              View students →
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ProfileMiniCard coachProfile={coachProfile} avatarUrl={avatarUrl} />
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 14 }}>
              How libraries work
            </div>
            {[
              "Create a library",
              "Upload your materials",
              "Activate for students",
            ].map((step, i) => (
              <div
                key={step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: i < 2 ? 12 : 0,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#FFF4EC",
                    color: GOLD,
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 14, color: NAVY }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PopulatedDashboard({
  name,
  coachProfile,
  avatarUrl,
  data,
  onCreateLibrary,
  creating,
}: {
  name: string;
  coachProfile: CoachProfileRow;
  avatarUrl: string | null;
  data: DashData;
  onCreateLibrary: () => void;
  creating: boolean;
}) {
  const featured = data.libraries[0];
  const hasMaterials = (featured?.docCount ?? 0) > 0;
  const isActive = featured?.status === "active";
  const stepDone = {
    created: data.libraries.length > 0,
    materials: data.libraries.some((l) => l.docCount > 0),
    active: data.activeLibraries > 0,
  };
  const nextStepIndex = !stepDone.created ? 0 : !stepDone.materials ? 1 : !stepDone.active ? 2 : -1;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, margin: "0 0 6px", color: NAVY }}>
            Welcome, {name}
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 8px" }}>
            Manage your libraries and students.
          </p>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
            {data.libraries.length} {data.libraries.length === 1 ? "library" : "libraries"} ·{" "}
            {data.activeLibraries} active {data.activeLibraries === 1 ? "library" : "libraries"} ·{" "}
            {data.students} enrolled {data.students === 1 ? "student" : "students"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateLibrary}
          disabled={creating}
          style={{ ...btnOutline, opacity: creating ? 0.7 : 1 }}
        >
          <Plus size={15} aria-hidden />
          {creating ? "Creating…" : "New library"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, 0.8fr)",
          gap: 16,
          alignItems: "start",
        }}
        className="coach-dash-grid"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>Your libraries</div>
              <Link
                to={appPath("/coach/libraries")}
                style={{ fontSize: 13, fontWeight: 700, color: GOLD, textDecoration: "none" }}
              >
                View all →
              </Link>
            </div>

            {featured ? (
              <div
                style={{
                  border: "1px solid #E2DFD6",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  background: "#FFFCFA",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
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
                    <BookOpen size={18} color={GOLD} aria-hidden />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: NAVY }}>{featured.title}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#6B7280",
                          background: "#F3F0EA",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {statusLabel(featured.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                      {featured.docCount === 0
                        ? "No materials uploaded yet"
                        : `${featured.docCount} document${featured.docCount === 1 ? "" : "s"}`}
                    </div>
                  </div>
                </div>
                <Link
                  to={appPath(`/coach/libraries/${featured.id}`)}
                  style={{ ...btnSolid, fontSize: 13, padding: "9px 14px" }}
                >
                  {hasMaterials ? (isActive ? "Open library →" : "Activate / manage →") : "Add materials →"}
                </Link>
              </div>
            ) : null}

            {/* Soft art strip when they have libraries — reuse asset as a quiet banner */}
            <div
              style={{
                marginTop: 14,
                borderRadius: 12,
                overflow: "hidden",
                height: 72,
                border: "1px solid #F0E4DC",
              }}
            >
              <img
                src={LIBRARY_CARD_ART}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "right center" }}
              />
            </div>
          </div>

          <div style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>Students</div>
              <Link
                to={appPath("/coach/students")}
                style={{ fontSize: 13, fontWeight: 700, color: GOLD, textDecoration: "none" }}
              >
                View students →
              </Link>
            </div>
            {data.students === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#9CA3AF" }}>
                <Users size={22} aria-hidden />
                <span style={{ fontSize: 14 }}>No students enrolled yet.</span>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: NAVY }}>
                {data.students} student{data.students === 1 ? "" : "s"} enrolled across your libraries.
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, background: "#FFFCFA" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: 8,
              }}
            >
              Next step
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: NAVY, marginBottom: 16 }}>
              {nextStepIndex < 0 ? "You're set up" : "Get your library ready"}
            </div>
            {[
              { label: "Create a library", done: stepDone.created },
              { label: "Upload coaching materials", done: stepDone.materials },
              { label: "Activate for students", done: stepDone.active },
            ].map((step, i) => {
              const current = i === nextStepIndex;
              return (
                <div
                  key={step.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: i < 2 ? 12 : 0,
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: step.done ? "#2F5233" : current ? GOLD : "#E8E4DC",
                      color: step.done || current ? "#fff" : "#6B7280",
                      fontWeight: 700,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {step.done ? <Check size={14} aria-hidden /> : i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: NAVY,
                      fontWeight: current ? 700 : 500,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <ProfileMiniCard coachProfile={coachProfile} avatarUrl={avatarUrl} />
        </div>
      </div>
    </div>
  );
}

export default function CoachDashboard({ profileId, coachProfile }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<DashData>({
    libraries: [],
    activeLibraries: 0,
    students: 0,
    loading: true,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await resolveAvatarUrl(coachProfile.avatar_path);
      if (!cancelled) setAvatarUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [coachProfile.avatar_path]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: libs } = await supabase
        .from("knowledge_libraries")
        .select("id, title, status")
        .eq("owner_id", profileId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const libraryRows = (libs || []) as { id: string; title: string; status: string }[];
      const withCounts: LibrarySummary[] = [];
      for (const lib of libraryRows) {
        const { count } = await supabase
          .from("knowledge_documents")
          .select("id", { count: "exact", head: true })
          .eq("library_id", lib.id);
        if (cancelled) return;
        withCounts.push({
          id: lib.id,
          title: lib.title,
          status: lib.status,
          docCount: count ?? 0,
        });
      }
      const libraryIds = withCounts.map((l) => l.id);
      let students = 0;
      if (libraryIds.length) {
        const { data: enrolls } = await supabase
          .from("library_enrollments")
          .select("profile_id")
          .in("library_id", libraryIds);
        if (!cancelled && enrolls) {
          students = new Set(enrolls.map((e) => e.profile_id)).size;
        }
      }
      if (!cancelled) {
        setData({
          libraries: withCounts,
          activeLibraries: withCounts.filter((l) => l.status === "active").length,
          students,
          loading: false,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  async function createLibrary() {
    setCreating(true);
    const { data: row, error } = await supabase
      .from("knowledge_libraries")
      .insert({
        owner_id: profileId,
        title: "Untitled library",
        description: null,
        status: "draft",
      })
      .select("id")
      .maybeSingle();
    setCreating(false);
    if (error || !row?.id) {
      navigate(appPath("/coach/libraries"));
      return;
    }
    navigate(appPath(`/coach/libraries/${row.id}`));
  }

  const name = coachProfile.display_name?.trim() || "Coach";

  if (data.loading) {
    return <div style={{ color: "#6B7280", fontSize: 14 }}>Loading dashboard…</div>;
  }

  return (
    <>
      {data.libraries.length === 0 ? (
        <EmptyDashboard
          name={name}
          coachProfile={coachProfile}
          avatarUrl={avatarUrl}
          onCreateLibrary={() => void createLibrary()}
          creating={creating}
        />
      ) : (
        <PopulatedDashboard
          name={name}
          coachProfile={coachProfile}
          avatarUrl={avatarUrl}
          data={data}
          onCreateLibrary={() => void createLibrary()}
          creating={creating}
        />
      )}
      <style>{`
        @media (max-width: 900px) {
          .coach-dash-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
