import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import { formatReflectionForPrompt } from "./SessionDebrief";
import { CERTIFICATIONS } from "./constants";
import { NAVY, CREAM, ResponsiveStyles } from "./theme";
import {
  ENABLE_FINANCIAL_PLANNING,
  SETTINGS,
  PROPERTY_AIMS,
  FP_AIMS,
  ALL_PERSONAS,
  generateRandomClient,
} from "./data/personas";
import { buildSystemPrompt } from "./prompts";
import { callGemini } from "./api";
import { saveProfileFields } from "./profileApi";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import SetupScreen from "./pages/SetupScreen";
import ChatScreen from "./pages/ChatScreen";
import ProfileScreen from "./pages/ProfileScreen";
import SessionHistory from "./pages/SessionHistory";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("app"); // app | team (manager dashboard)
  const [himselfLoaded, setHimselfLoaded] = useState(false);
  const [step, setStep] = useState("setup"); // setup | chat
  const [industry, setIndustry] = useState("Property");
  const [resumeChecked, setResumeChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openConversations, setOpenConversations] = useState([]);
  const [metPersonaIds, setMetPersonaIds] = useState(new Set());

  const DEFAULT_HIMSELF = {
    name: "",
    age: "",
    occupation: "Property Agent",
    nationality: "Singaporean",
    experience: "",
    education: "Bachelor's Degree",
    disc: "I",
    salesStyle: "Consultative",
    certification: CERTIFICATIONS[0],
  };

  const [himself, setHimself] = useState(DEFAULT_HIMSELF);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load profile:", error.message);
          setHimselfLoaded(true);
          return;
        }
        setProfile(data);
        const ind = (!ENABLE_FINANCIAL_PLANNING || data?.industry !== "Financial Planning")
          ? "Property"
          : "FP";
        setIndustry(ind);
        if (data?.agent_profile) {
          setHimself(data.agent_profile);
        } else {
          setHimself({
            ...DEFAULT_HIMSELF,
            name: data?.full_name || "",
            occupation: ind === "Property" ? "Property Agent" : "Financial Advisor",
            certification: ind === "Property" ? CERTIFICATIONS[0] : CERTIFICATIONS[1],
          });
        }
        setHimselfLoaded(true);
      });
  }, [session]);

  async function refreshOpenConversations() {
    if (!profile) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", profile.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false });
    setOpenConversations(data || []);
  }

  async function refreshMetPersonas() {
    if (!profile) return;
    const { data } = await supabase
      .from("conversations")
      .select("client_persona_id")
      .eq("user_id", profile.id);
    setMetPersonaIds(new Set((data || []).map((r) => r.client_persona_id).filter(Boolean)));
  }

  async function closeOpenConversation(convId) {
    const { error } = await supabase
      .from("conversations")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", convId);
    if (error) {
      alert("Couldn't close this chat: " + error.message);
      return;
    }
    if (convId === conversationId) {
      setStep("setup");
      setDisplayMessages([]);
      setApiMessages([]);
      setConversationId(null);
      setDebriefOpen(false);
    }
    refreshOpenConversations();
  }

  async function deleteConversation(convId) {
    const { error: delErr } = await supabase.from("conversations").delete().eq("id", convId);
    if (delErr) {
      alert("Couldn't delete this chat: " + delErr.message);
      return;
    }
    if (convId === conversationId) {
      setStep("setup");
      setDisplayMessages([]);
      setApiMessages([]);
      setConversationId(null);
      setDebriefOpen(false);
    }
    refreshOpenConversations();
  }

  async function persistAgentProfile(agentProfile) {
    if (!profile) throw new Error("Profile not loaded yet.");
    const row = await saveProfileFields(profile.id, { agent_profile: agentProfile });
    const saved = row.agent_profile ?? agentProfile;
    setHimself(saved);
    setProfile((prev) => (prev ? { ...prev, agent_profile: saved } : prev));
    return saved;
  }

  const [clientId, setClientId] = useState(null);
  const [randomClient, setRandomClient] = useState(null);
  const [aimKey, setAimKey] = useState(null);
  const [settingKey, setSettingKey] = useState(SETTINGS[0].key);
  const [challenge, setChallenge] = useState(null);
  const [recentSessions, setRecentSessions] = useState({ items: [], totalEndedCount: 0 });

  const [displayMessages, setDisplayMessages] = useState([]);
  const [apiMessages, setApiMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const [debriefOpen, setDebriefOpen] = useState(false);

  const scrollRef = useRef(null);

  async function refreshRecentSessions() {
    if (!profile) return;
    const { data: ended } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", profile.id)
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(3);
    const { count } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .not("ended_at", "is", null);
    setRecentSessions({ items: ended || [], totalEndedCount: count || 0 });
  }

  async function loadConversationIntoState(conv) {
    if (!conv || !conv.client_snapshot) return;

    const { data: pastMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    setHimself(conv.himself_snapshot);
    setIndustry(conv.client_snapshot.industry === "Property" ? "Property" : "FP");
    setRandomClient(conv.client_snapshot);
    setClientId(null);
    setAimKey(conv.aim_snapshot?.key || null);
    setSettingKey(conv.setting_snapshot?.key || SETTINGS[0].key);
    setChallenge(conv.challenge_snapshot || null);
    setConversationId(conv.id);

    const restored = (pastMessages || []).map((m) => ({
      role: m.role === "agent" ? "user" : "assistant",
      content: m.content,
    }));
    setDisplayMessages(restored);
    setApiMessages(restored);
    setDebriefOpen(false);
    setStep("chat");
  }

  // On login, load open (not-yet-ended) conversations into the sidebar.
  // Do not auto-enter chat — land on home; user resumes from the sidebar.
  useEffect(() => {
    if (!session || !profile) return;
    let cancelled = false;

    (async () => {
      const { data: openConvs } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", profile.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false });

      if (cancelled) return;
      setOpenConversations(openConvs || []);
      refreshMetPersonas();
      refreshRecentSessions();

      // Stay on home after refresh/login — open chats remain in the sidebar to resume manually.
      setResumeChecked(true);
    })();

    return () => { cancelled = true; };
  }, [session, profile?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [displayMessages, loading]);

  const industryPersonas = ALL_PERSONAS.filter((p) => p.industry === (industry === "Property" ? "Property" : "FP"));
  const aims = industry === "Property" ? PROPERTY_AIMS : FP_AIMS;
  const client = randomClient || ALL_PERSONAS.find((p) => p.id === clientId) || null;
  const aim = aims.find((a) => a.key === aimKey) || null;
  const setting = SETTINGS.find((s) => s.key === settingKey) || null;

  function pickFixedClient(id) {
    setRandomClient(null);
    setClientId(id);
  }

  function generateRandom() {
    const industryKey = industry === "Property" ? "Property" : "FP";
    setClientId(null);
    setRandomClient(generateRandomClient(industryKey));
  }

  function updateHimself(field, value) {
    setHimself((prev) => ({ ...prev, [field]: value }));
  }

  async function switchIndustry(ind) {
    if (!ENABLE_FINANCIAL_PLANNING && ind !== "Property") return;
    setIndustry(ind);
    setClientId(null);
    setRandomClient(null);
    setAimKey(null);
    setChallenge(null);
    const updatedHimself = {
      ...himself,
      occupation: ind === "Property" ? "Property Agent" : "Financial Advisor",
      certification: ind === "Property" ? CERTIFICATIONS[0] : CERTIFICATIONS[1],
    };
    setHimself(updatedHimself);
    if (profile) {
      const dbValue = ind === "Property" ? "Property" : "Financial Planning";
      try {
        const row = await saveProfileFields(profile.id, {
          industry: dbValue,
          agent_profile: updatedHimself,
        });
        setProfile((prev) => (prev ? {
          ...prev,
          industry: row.industry ?? dbValue,
          agent_profile: row.agent_profile ?? updatedHimself,
        } : prev));
        if (row.agent_profile) setHimself(row.agent_profile);
      } catch (err) {
        console.error("Failed to save industry:", err.message);
      }
    }
  }

  async function startRoleplayWith({
    client: startClient,
    aim: startAim,
    setting: startSetting,
    challenge: startChallenge = null,
    himself: startHimself = himself,
  }) {
    if (!startClient || !startAim || !startSetting) return;
    setError(null);
    setLoading(true);
    setStep("chat");
    setChallenge(startChallenge);
    setRandomClient(startClient);
    setClientId(null);
    setAimKey(startAim.key);
    setSettingKey(startSetting.key);

    let newConversationId = null;
    try {
      const insertRow = {
        user_id: session.user.id,
        industry: startClient.industry,
        client_persona_id: startClient.id,
        client_name: startClient.name,
        client_grade: startClient.grade,
        aim: startAim.key,
        setting: startSetting.key,
        himself_snapshot: startHimself,
        client_snapshot: startClient,
        aim_snapshot: startAim,
        setting_snapshot: startSetting,
        challenge_snapshot: startChallenge,
      };
      const { data, error: dbErr } = await supabase
        .from("conversations")
        .insert(insertRow)
        .select()
        .single();
      if (dbErr) throw dbErr;
      newConversationId = data.id;
      setConversationId(newConversationId);
      refreshOpenConversations();
      refreshMetPersonas();
    } catch (e) {
      console.error("Failed to create conversation record:", e.message);
      // If challenge_snapshot column is missing, retry without it
      if (startChallenge && String(e.message || "").includes("challenge_snapshot")) {
        try {
          const { data, error: dbErr2 } = await supabase
            .from("conversations")
            .insert({
              user_id: session.user.id,
              industry: startClient.industry,
              client_persona_id: startClient.id,
              client_name: startClient.name,
              client_grade: startClient.grade,
              aim: startAim.key,
              setting: startSetting.key,
              himself_snapshot: startHimself,
              client_snapshot: { ...startClient, _challenge: startChallenge },
              aim_snapshot: startAim,
              setting_snapshot: startSetting,
            })
            .select()
            .single();
          if (!dbErr2) {
            newConversationId = data.id;
            setConversationId(newConversationId);
            refreshOpenConversations();
            refreshMetPersonas();
          }
        } catch (e2) {
          console.error("Retry without challenge column failed:", e2.message);
        }
      }
    }

    const systemPrompt = buildSystemPrompt(startHimself, startClient, startAim, startSetting, startChallenge);
    const seed = { role: "user", content: "(The roleplay is beginning now. Open the conversation yourself, in character, exactly as instructed in your system prompt.)" };
    try {
      const reply = await callGemini(systemPrompt, [seed]);
      setApiMessages([seed, { role: "assistant", content: reply }]);
      setDisplayMessages([{ role: "assistant", content: reply }]);
      if (newConversationId) saveMessage(newConversationId, "client", reply);
    } catch (e) {
      setError("Couldn't start the roleplay. " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function startRoleplay() {
    await startRoleplayWith({ client, aim, setting, challenge, himself });
  }

  async function startTargetedChallenge(ch) {
    const pool = industryPersonas.filter((p) => p.grade === "Medium" || p.grade === "Hard");
    const pick = pool[Math.floor(Math.random() * pool.length)] || industryPersonas[0];
    const startAim = aims[Math.floor(Math.random() * aims.length)];
    const startSetting = SETTINGS[Math.floor(Math.random() * SETTINGS.length)];
    if (!pick || !startAim || !startSetting) return;
    await startRoleplayWith({
      client: pick,
      aim: startAim,
      setting: startSetting,
      challenge: ch,
      himself,
    });
  }

  async function replaySession(conv) {
    if (!conv?.client_snapshot || !conv?.aim_snapshot || !conv?.setting_snapshot) {
      alert("This session is missing saved setup details, so it can't be replayed.");
      return;
    }
    const ch = conv.challenge_snapshot || conv.client_snapshot?._challenge || null;
    const clientSnap = { ...conv.client_snapshot };
    delete clientSnap._challenge;
    await startRoleplayWith({
      client: clientSnap,
      aim: conv.aim_snapshot,
      setting: conv.setting_snapshot,
      challenge: ch,
      himself: conv.himself_snapshot || himself,
    });
  }

  async function saveMessage(convId, role, content) {
    try {
      await supabase.from("messages").insert({ conversation_id: convId, role, content });
    } catch (e) {
      console.error("Failed to save message:", e.message);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const userMsg = { role: "user", content: text };
    const newApiMessages = [...apiMessages, userMsg];
    setApiMessages(newApiMessages);
    setDisplayMessages((prev) => [...prev, userMsg]);
    if (conversationId) saveMessage(conversationId, "agent", text);
    setLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(himself, client, aim, setting, challenge);
      const reply = await callGemini(systemPrompt, newApiMessages);
      setApiMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setDisplayMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (conversationId) saveMessage(conversationId, "client", reply);
    } catch (e) {
      setError("Message failed to send. " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveDebrief({ clientFeedback, reflection, reflectionUpdate, facts, suggestions, suggestionsSections, conversationId: convId }) {
    if (!convId) return;
    const sections = suggestionsSections || {};
    const rawParts = [
      "REFLECTION (before client feedback)",
      formatReflectionForPrompt(reflection),
      "CLIENT FEEDBACK",
      clientFeedback,
      "REFLECTION UPDATE (after client feedback)",
      formatReflectionForPrompt(reflectionUpdate),
      "FACTS",
      facts,
    ];
    if (suggestions) {
      rawParts.push("AI SUGGESTIONS", suggestions);
    }
    await supabase.from("coaching_reports").insert({
      conversation_id: convId,
      client_feedback: clientFeedback,
      reflection: reflection || null,
      reflection_update: reflectionUpdate || null,
      facts,
      overall: sections.overall || null,
      strengths: sections.strengths || null,
      areas_to_improve: sections.areas_to_improve || null,
      client_fit: sections.client_fit || null,
      key_recommendation: sections.key_recommendation || null,
      raw_text: rawParts.join("\n\n"),
    });
    await supabase.from("conversations").update({ ended_at: new Date().toISOString() }).eq("id", convId);
    refreshOpenConversations();
    refreshRecentSessions();
  }

  function resetAll() {
    setStep("setup");
    setDisplayMessages([]);
    setApiMessages([]);
    setDebriefOpen(false);
    setError(null);
    setConversationId(null);
    setChallenge(null);
    refreshRecentSessions();
  }

  const canStart = Boolean(client && aim && setting);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, color: NAVY, fontFamily: "-apple-system, sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (session && profile && !resumeChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, color: NAVY, fontFamily: "-apple-system, sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (view === "team" && profile?.role === "manager") {
    return (
      <>
        <ResponsiveStyles />
        <SessionHistory profile={profile} scope="team" onBack={() => setView("app")} onSignOut={() => supabase.auth.signOut()} />
      </>
    );
  }

  if (view === "history") {
    return (
      <>
        <ResponsiveStyles />
        <SessionHistory
          profile={profile}
          scope="mine"
          onBack={() => setView("app")}
          onSignOut={() => supabase.auth.signOut()}
          onContinue={async (conv) => {
            await loadConversationIntoState(conv);
            setView("app");
          }}
        />
      </>
    );
  }

  if (view === "profile") {
    return (
      <>
        <ResponsiveStyles />
        <ProfileScreen
          profile={profile}
          himself={profile?.agent_profile || himself}
          himselfLoaded={himselfLoaded}
          industry={industry}
          openChatCount={openConversations.length}
          onSave={persistAgentProfile}
          onBack={() => setView("app")}
          onSignOut={() => supabase.auth.signOut()}
        />
      </>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <ResponsiveStyles />
      <div className={`arena-backdrop${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <div className={`arena-sidebar${sidebarOpen ? " open" : ""}`}>
        <Sidebar
          openConversations={openConversations}
          activeId={conversationId}
          profile={profile}
          onSelect={(conv) => { loadConversationIntoState(conv); setSidebarOpen(false); }}
          onCloseChat={closeOpenConversation}
          onDelete={deleteConversation}
          onClose={() => setSidebarOpen(false)}
          onProfileView={() => { setView("profile"); setSidebarOpen(false); }}
          onHistoryView={() => { setView("history"); setSidebarOpen(false); }}
          onTeamView={() => { setView("team"); setSidebarOpen(false); }}
          onSignOut={() => supabase.auth.signOut()}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, background: CREAM, color: NAVY, overflowY: step === "setup" ? "auto" : "hidden", height: "100%" }}>
        {step === "setup" && (
          <TopBar
            profile={profile}
            onSignOut={() => supabase.auth.signOut()}
            onTeamView={() => setView("team")}
            onHistoryView={() => setView("history")}
            onProfileView={() => setView("profile")}
            onHomeView={() => setView("app")}
            onProgressClick={() => {
              document.getElementById("arena-progress")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            onMenuToggle={() => setSidebarOpen(true)}
          />
        )}
        {step === "setup" ? (
          <SetupScreen
            industry={industry}
            switchIndustry={switchIndustry}
            himself={himself}
            onEditProfile={() => setView("profile")}
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
            startRoleplay={startRoleplay}
            onStartChallenge={startTargetedChallenge}
            recentSessions={recentSessions}
            onReplay={replaySession}
            onViewHistory={() => setView("history")}
          />
        ) : (
          <ChatScreen
            himself={himself}
            client={client}
            aim={aim}
            setting={setting}
            displayMessages={displayMessages}
            loading={loading}
            error={error}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            scrollRef={scrollRef}
            onEndSession={() => setDebriefOpen(true)}
            resetAll={resetAll}
            conversationId={conversationId}
            profile={profile}
            onMenuToggle={() => setSidebarOpen(true)}
            debriefOpen={debriefOpen}
            setDebriefOpen={setDebriefOpen}
            callGemini={callGemini}
            onSaveDebrief={saveDebrief}
          />
        )}
      </div>
    </div>
  );
}
