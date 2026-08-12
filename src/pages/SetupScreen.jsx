import { ArrowRight } from "lucide-react";
import { NAVY, GOLD, ACCENT_TINT } from "../theme";
import { SETTINGS, GRADE_ORDER } from "../data/personas";
import GradeBadge from "../components/GradeBadge";
import IndustryDisplay from "../components/IndustryDisplay";
import SectionLabel from "../components/SectionLabel";

export default function SetupScreen({
  industry, switchIndustry, himself, updateHimself, onEditProfile, industryPersonas, metPersonaIds,
  clientId, pickFixedClient, randomClient, generateRandom, aims, aimKey, setAimKey, settingKey, setSettingKey,
  canStart, startRoleplay,
}) {
  const grouped = GRADE_ORDER.map((g) => ({ grade: g, items: industryPersonas.filter((p) => p.grade === g) }));

  return (
    <div className="arena-setup-wrap" style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px 80px" }}>
      <header className="arena-setup-header" style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", border: `2px solid ${GOLD}`, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${GOLD}` }} />
        </div>
        <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 34, letterSpacing: 1, margin: 0 }}>THE ARENA</h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginTop: 6 }}>Practice partner roleplay — set up your session below</p>
      </header>

      {/* Industry (set at signup) */}
      <IndustryDisplay industry={industry} switchIndustry={switchIndustry} />

      {/* Himself */}
      <SectionLabel n="1" title="Your Agent Profile" />
      <div className="arena-agent-summary" style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 12, padding: 20, marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{himself.name || "(no name set)"}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}>
            {himself.occupation}{himself.age ? ` · ${himself.age}` : ""} · DISC {himself.disc} · {himself.salesStyle}
          </div>
        </div>
        <button
          onClick={onEditProfile}
          style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${GOLD}`, background: "#fff", color: NAVY, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          Edit Profile
        </button>
      </div>

      {/* Client */}
      <SectionLabel n="2" title="Choose Your Client" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: -6, marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>16 personas: 2 Easy, 6 Medium, 6 Hard, 2 Impossible</p>
        <button
          onClick={generateRandom}
          style={{
            padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
            border: `1px solid ${GOLD}`, background: "#fff", color: NAVY,
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          🎲 Generate Random Client
        </button>
      </div>

      {randomClient && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Wildcard</span>
            <GradeBadge grade={randomClient.grade} size="md" />
          </div>
          <div
            style={{
              display: "inline-block", textAlign: "left", padding: "12px 14px", borderRadius: 10,
              border: `2px solid ${GOLD}`, background: ACCENT_TINT, boxShadow: "0 2px 8px rgba(253,136,65,0.25)",
              minWidth: 200,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{randomClient.name}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{randomClient.age} · {randomClient.occupation}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>DISC {randomClient.disc} · {randomClient.needLevel.split(" (")[0]}</div>
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>Click "Generate Random Client" again for a different one.</div>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        {grouped.map(({ grade, items }) => (
          <div key={grade} style={{ marginBottom: 18 }}>
            <div style={{ marginBottom: 8 }}><GradeBadge grade={grade} size="md" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {items.map((p) => {
                const selected = !randomClient && clientId === p.id;
                const met = metPersonaIds?.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => pickFixedClient(p.id)}
                    style={{
                      position: "relative", textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                      border: selected ? `2px solid ${GOLD}` : met ? "1px solid #4C8F5F" : "1px solid #E2DFD6",
                      background: selected ? ACCENT_TINT : "#fff",
                      boxShadow: selected ? "0 2px 8px rgba(253,136,65,0.25)" : "none",
                    }}
                  >
                    {met && (
                      <span
                        title="You've spoken with this client before"
                        style={{
                          position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%",
                          background: "#4C8F5F",
                        }}
                      />
                    )}
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{p.age} · {p.occupation}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>DISC {p.disc} · {p.needLevel.split(" (")[0]}</div>
                    {met && <div style={{ fontSize: 10, color: "#4C8F5F", fontWeight: 600, marginTop: 3 }}>Met before</div>}
                  </button>
                );
              })}
            </div>

          </div>
        ))}
      </div>

      {/* Scenario */}
      <SectionLabel n="3" title="Choose Scenario" />
      <div style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 12, padding: 20, marginBottom: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Aim</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {aims.map((a) => (
            <button
              key={a.key}
              onClick={() => setAimKey(a.key)}
              style={{
                padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                border: aimKey === a.key ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
                background: aimKey === a.key ? NAVY : "#fff",
                color: aimKey === a.key ? "#fff" : NAVY, fontWeight: 500,
              }}
            >
              {a.key}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Setting</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SETTINGS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSettingKey(s.key)}
              style={{
                padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                border: settingKey === s.key ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
                background: settingKey === s.key ? NAVY : "#fff",
                color: settingKey === s.key ? "#fff" : NAVY, fontWeight: 500,
              }}
            >
              {s.key}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={startRoleplay}
        disabled={!canStart}
        style={{
          width: "100%", padding: "16px", borderRadius: 10, border: "none", cursor: canStart ? "pointer" : "not-allowed",
          background: canStart ? GOLD : "#E2DFD6", color: canStart ? NAVY : "#9CA3AF",
          fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        Start Roleplay <ArrowRight size={18} />
      </button>
    </div>
  );
}
