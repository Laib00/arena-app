import { useState } from "react";
import { ArrowRight, Flame, Lock, Phone, RotateCcw, Zap, X } from "lucide-react";
import { NAVY, GOLD, CREAM } from "../theme";
import { SETTINGS, GRADE_ORDER, CHALLENGES } from "../data/personas";
import { formatStreakLabel } from "../streak";
import GradeBadge from "../components/GradeBadge";
import IndustryDisplay from "../components/IndustryDisplay";
import SectionLabel from "../components/SectionLabel";

function relativeTime(iso) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function PracticeSetupModal({
  open,
  onClose,
  industry,
  switchIndustry,
  himself,
  onEditProfile,
  industryPersonas,
  metPersonaIds,
  clientId,
  pickFixedClient,
  randomClient,
  generateRandom,
  aims,
  aimKey,
  setAimKey,
  settingKey,
  setSettingKey,
  challenge,
  setChallenge,
  canStart,
  onStart,
}) {
  if (!open) return null;
  const grouped = GRADE_ORDER.map((g) => ({ grade: g, items: industryPersonas.filter((p) => p.grade === g) }));
  const selectedChallengeId = challenge?.id || null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 16px", zIndex: 50, boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        className="arena-practice-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 860,
          maxHeight: "calc(100vh - 96px)", overflowY: "auto", padding: "28px 28px 32px", position: "relative",
          boxShadow: "0 24px 64px rgba(10,22,40,0.28)",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
          Open practice
        </div>
        <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 28, margin: "0 0 6px", color: NAVY }}>
          Practice your deal
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginTop: 0, marginBottom: 24 }}>
          Choose your client and scenario, then start immediately.
        </p>

        <IndustryDisplay industry={industry} switchIndustry={switchIndustry} />

        <SectionLabel n="1" title="Your Agent Profile" />
        <div className="arena-agent-summary" style={{ background: CREAM, border: "1px solid #E8E4DC", borderRadius: 12, padding: 18, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{himself.name || "(no name set)"}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}>
              {himself.occupation}{himself.age ? ` · ${himself.age}` : ""} · DISC {himself.disc} · {himself.salesStyle}
            </div>
          </div>
          <button
            onClick={onEditProfile}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${GOLD}`, background: "#fff", color: NAVY, fontWeight: 600, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
          >
            Edit Profile
          </button>
        </div>

        <SectionLabel n="2" title="Choose Your Client" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: -6, marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>16 personas: 2 Easy, 6 Medium, 6 Hard, 2 Impossible</p>
          <button
            onClick={generateRandom}
            style={{
              padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
              border: `1px solid ${GOLD}`, background: "#fff", color: NAVY,
            }}
          >
            Generate Random Client
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
                border: `2px solid ${GOLD}`, background: "rgba(253,136,65,0.08)",
                minWidth: 200,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{randomClient.name}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{randomClient.age} · {randomClient.occupation}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>DISC {randomClient.disc} · {randomClient.needLevel.split(" (")[0]}</div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
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
                        background: selected ? "rgba(253,136,65,0.08)" : "#fff",
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

        <SectionLabel n="3" title="Choose Scenario" />
        <div style={{ background: CREAM, border: "1px solid #E8E4DC", borderRadius: 12, padding: 20, marginBottom: 28 }}>
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

        <SectionLabel n="4" title="Challenge (optional)" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, marginTop: -6 }}>
          <button
            type="button"
            onClick={() => setChallenge(null)}
            style={{
              padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 600,
              border: !selectedChallengeId ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
              background: !selectedChallengeId ? NAVY : "#fff",
              color: !selectedChallengeId ? "#fff" : NAVY,
            }}
          >
            None
          </button>
          {CHALLENGES.map((c) => {
            const selected = selectedChallengeId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChallenge(selected ? null : c)}
                style={{
                  padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  border: selected ? `2px solid ${GOLD}` : "1px solid #E2DFD6",
                  background: selected ? "rgba(253,136,65,0.12)" : "#fff",
                  color: selected ? GOLD : NAVY,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onStart}
          disabled={!canStart}
          style={{
            width: "100%", padding: "16px", borderRadius: 10, border: "none", cursor: canStart ? "pointer" : "not-allowed",
            background: canStart ? GOLD : "#E2DFD6", color: canStart ? "#fff" : "#9CA3AF",
            fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          Start Roleplay <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function SetupScreen({
  industry, switchIndustry, himself, onEditProfile, industryPersonas, metPersonaIds,
  clientId, pickFixedClient, randomClient, generateRandom, aims, aimKey, setAimKey, settingKey, setSettingKey,
  challenge, setChallenge,
  canStart, startRoleplay, onStartChallenge, recentSessions, onReplay, onViewHistory,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const rounds = recentSessions?.totalEndedCount ?? 0;
  const practiceStreak = recentSessions?.practiceStreak ?? 0;

  function openPracticeModal() {
    setChallenge(null);
    setModalOpen(true);
  }

  return (
    <div className="arena-setup-wrap" style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 24px 80px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 36, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>
            Welcome to your arena
          </div>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 36, letterSpacing: 0.2, margin: 0, color: NAVY, lineHeight: 1.15 }}>
            What will you practise today?
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "#fff", border: "1px solid #E8E4DC" }}>
          <Flame size={18} color={GOLD} fill={GOLD} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{formatStreakLabel(practiceStreak)}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>Current practice streak</div>
          </div>
        </div>
      </header>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
        Enter a practice
      </div>

      <div className="arena-home-practice-grid" style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr 1fr", gap: 16, marginBottom: 36 }}>
        {/* Open practice */}
        <button
          type="button"
          onClick={openPracticeModal}
          className="arena-open-practice-card"
          style={{
            textAlign: "left", border: "none", cursor: "pointer", borderRadius: 18, padding: 28,
            background: NAVY, color: "#fff", position: "relative", overflow: "hidden", minHeight: 220,
            display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 12 }}>
            Recommended · Open practice
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, lineHeight: 1.2, marginBottom: 10 }}>
            Practice your deal
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.55, margin: 0, maxWidth: 320 }}>
            Meet a realistic prospect with their own needs, fears and objections. Your job is to discover them and move the conversation forward.
          </p>
          <div className="arena-open-practice-cta" style={{
            marginTop: "auto", alignSelf: "flex-end", width: 44, height: 44, borderRadius: "50%",
            background: GOLD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 1,
          }}>
            <span className="arena-open-practice-ripple" aria-hidden="true" />
            <span className="arena-open-practice-ripple arena-open-practice-ripple--delay" aria-hidden="true" />
            <ArrowRight size={20} style={{ position: "relative", zIndex: 1 }} />
          </div>
        </button>

        {/* Targeted */}
        <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 18, padding: 24, minHeight: 220, display: "flex", flexDirection: "column" }}>
          <Zap size={22} color={GOLD} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 8 }}>
            Targeted practice
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: NAVY, marginBottom: 8 }}>
            Take a Challenge
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, margin: "0 0 16px" }}>
            Train one difficult moment instead of running a full open conversation.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto" }}>
            {CHALLENGES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onStartChallenge?.(c)}
                style={{
                  padding: "8px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: "rgba(253,136,65,0.12)", color: GOLD, fontWeight: 600, fontSize: 12,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice — disabled */}
        <div
          style={{
            background: "#fff", border: "1px solid #E8E4DC", borderRadius: 18, padding: 24, minHeight: 220,
            display: "flex", flexDirection: "column", opacity: 0.72, position: "relative",
          }}
          aria-disabled="true"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <Phone size={22} color="#9CA3AF" />
            <Lock size={16} color="#9CA3AF" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 8 }}>
            Voice practice
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: NAVY, marginBottom: 8 }}>
            Make Your First Call
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, margin: "0 0 16px" }}>
            No typing. Talk to a prospect and respond in real time.
          </p>
          <div style={{ marginTop: "auto", fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 0.8 }}>
            COMING SOON
          </div>
        </div>
      </div>

      <div className="arena-home-bottom-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Replay */}
        <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 18, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0, color: NAVY }}>Replay a round</h3>
            <button
              type="button"
              onClick={onViewHistory}
              style={{ background: "none", border: "none", color: GOLD, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              View history →
            </button>
          </div>
          {(recentSessions?.items || []).length === 0 ? (
            <div style={{ fontSize: 14, color: "#9CA3AF", padding: "12px 0" }}>No past sessions yet. Finish a practice to replay it here.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(recentSessions.items || []).slice(0, 3).map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                    borderRadius: 12, border: "1px solid #EFEBE3", background: CREAM,
                  }}
                >
                  <div style={{ fontWeight: 700, color: GOLD, fontSize: 15, width: 28 }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.challenge_snapshot?.label || s.client_name || "Session"}
                      {s.challenge_snapshot?.label ? "" : s.client_grade ? ` · ${s.client_grade}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                      {s.client_name}{s.aim ? ` · ${s.aim}` : ""} · {relativeTime(s.ended_at || s.started_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReplay?.(s)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 12px", borderRadius: 8, border: `1px solid ${GOLD}`,
                      background: "#fff", color: NAVY, fontWeight: 600, fontSize: 12, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    Again <RotateCcw size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {(recentSessions?.items || []).length > 0 && (
            <button
              type="button"
              onClick={onViewHistory}
              style={{
                marginTop: 14, width: "100%", padding: "10px", borderRadius: 10,
                border: "1px solid #E8E4DC", background: "#fff", color: NAVY,
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              More
            </button>
          )}
        </div>

        {/* Progress placeholder */}
        <div id="arena-progress" style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 18, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0, color: NAVY }}>Your progress</h3>
            <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>Level 1 · Rookie</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[
              { label: "ROUNDS", value: String(rounds) },
              { label: "PRACTICE", value: "—" },
              { label: "XP", value: "0" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: CREAM, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 0.8 }}>{stat.label}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: NAVY, marginTop: 4 }}>{stat.value}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "#EFEBE3", overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: "4%", height: "100%", background: GOLD, borderRadius: 999 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280" }}>
            <span>0 XP</span>
            <span>Next level · 1,000 XP</span>
          </div>
        </div>
      </div>

      <PracticeSetupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        industry={industry}
        switchIndustry={switchIndustry}
        himself={himself}
        onEditProfile={onEditProfile}
        industryPersonas={industryPersonas}
        metPersonaIds={metPersonaIds}
        clientId={clientId}
        pickFixedClient={pickFixedClient}
        randomClient={randomClient}
        generateRandom={generateRandom}
        aims={aims}
        aimKey={aimKey}
        setAimKey={setAimKey}
        settingKey={settingKey}
        setSettingKey={setSettingKey}
        challenge={challenge}
        setChallenge={setChallenge}
        canStart={canStart}
        onStart={() => {
          setModalOpen(false);
          startRoleplay();
        }}
      />
    </div>
  );
}
