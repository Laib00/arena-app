import React from "react";
import { NAVY, GOLD } from "../theme";
import { coachInitials, type CoachCredential } from "./coachProfile";

export type PreviewModel = {
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
  avatarUrl: string | null;
};

function Chip({ children, tone = "skill" }: { children: React.ReactNode; tone?: "industry" | "skill" }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 9px",
        borderRadius: 999,
        border: tone === "industry" ? `1px solid ${NAVY}` : `1px solid ${GOLD}`,
        background: tone === "industry" ? "#fff" : "#FFF4EC",
        color: NAVY,
      }}
    >
      {children}
    </span>
  );
}

export default function CoachProfilePreview({ model }: { model: PreviewModel }) {
  const name = model.displayName.trim() || "Your name";
  const hasExperience =
    model.experienceRole.trim() ||
    model.experienceOrg.trim() ||
    model.experienceSummary.trim();
  const quals = model.qualifications.filter((q) => q.title.trim());
  const headline = model.headline.trim();

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2DFD6",
        borderRadius: 16,
        // Do not clip the overlapping avatar — only the banner clips its own art
        overflow: "visible",
        boxShadow: "0 8px 24px rgba(10, 22, 40, 0.04)",
      }}
    >
      <div
        style={{
          height: 96,
          background: "linear-gradient(135deg, #FFF4EC 0%, #F7F5F2 55%, #EEF4F8 100%)",
          position: "relative",
          borderRadius: "16px 16px 0 0",
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 96"
          preserveAspectRatio="none"
          aria-hidden
          style={{ position: "absolute", inset: 0, opacity: 0.45 }}
        >
          <path d="M0 60 Q100 20 200 50 T400 40 V96 H0 Z" fill="#FD8841" opacity="0.15" />
          <path d="M0 70 Q120 40 240 65 T400 55 V96 H0 Z" fill="#0A1628" opacity="0.06" />
        </svg>
      </div>

      <div style={{ padding: "0 22px 22px", marginTop: -40, position: "relative", zIndex: 2 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "3px solid #fff",
            background: "#E8E4DC",
            overflow: "hidden",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: NAVY,
            boxShadow: "0 2px 8px rgba(10,22,40,0.08)",
          }}
        >
          {model.avatarUrl ? (
            <img
              src={model.avatarUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                display: "block",
              }}
            />
          ) : (
            coachInitials(name)
          )}
        </div>

        <div style={{ marginTop: 14, fontFamily: "Georgia, serif", fontSize: 22, color: NAVY, fontWeight: 700 }}>
          {name}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#9CA3AF", marginTop: 4 }}>
          Coach
        </div>

        {headline ? (
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.45, color: NAVY }}>{headline}</p>
        ) : null}

        {(model.industries.length > 0 || model.practiceSkills.length > 0) && (
          <div style={{ marginTop: 14 }}>
            {model.industries.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>
                  Industry
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {model.industries.map((s) => (
                    <Chip key={s} tone="industry">
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {model.practiceSkills.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>
                  What we’ll practise
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {model.practiceSkills.map((s) => (
                    <Chip key={s} tone="skill">
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {model.whoICoach.trim() && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>
              Who I coach
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: NAVY }}>{model.whoICoach.trim()}</p>
          </div>
        )}

        {hasExperience && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E2DFD6" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>
              Experience
            </div>
            {(model.experienceRole.trim() || model.experienceOrg.trim()) && (
              <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>
                {[model.experienceRole.trim(), model.experienceOrg.trim()].filter(Boolean).join(" · ")}
              </div>
            )}
            {model.experienceSummary.trim() && (
              <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#4B5563" }}>
                {model.experienceSummary.trim()}
              </p>
            )}
          </div>
        )}

        {quals.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E2DFD6" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>
              Qualifications
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {quals.map((q) => (
                <li key={q.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: NAVY }}>{q.title}</span>
                    {q.verified ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: "#2F5233",
                          background: "#E8F0E9",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        Verified
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6B7280" }}>
                    {[q.institution, q.year].filter(Boolean).join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {model.howICoach.trim() && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E2DFD6" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>
              How I coach
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: NAVY }}>{model.howICoach.trim()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
