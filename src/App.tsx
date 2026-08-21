import React, { useState, useRef, useEffect } from "react";
import { Navigate, matchPath, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import { formatReflectionForPrompt } from "./SessionDebrief";
import { CERTIFICATIONS } from "./constants";
import { NAVY, CREAM, GOLD, ResponsiveStyles } from "./theme";
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
import { computePracticeStreak } from "./streak";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import SetupScreen from "./pages/SetupScreen";
import ChatScreen from "./pages/ChatScreen";
import ProfileScreen from "./pages/ProfileScreen";
import SessionHistory from "./pages/SessionHistory";
import type {
  AgentProfile,
  Aim,
  Challenge,
  ChatMessage,
  ConversationSession,
  Industry,
  Persona,
  Setting,
  UserProfile,
} from "./types/domain";

type AppUserProfile = UserProfile & {
  agent_profile?: AgentProfile | null;
  industry?: Industry | "Financial Planning" | string | null;
};

type AppConversation = ConversationSession & {
  aim_snapshot?: Aim | null;
  setting_snapshot?: Setting | null;
};

type RecentSessions = {
  items: ConversationSession[];
  totalEndedCount: number;
  practiceStreak: number;
};

type StartRoleplayOptions = {
  client: Persona | null;
  aim: Aim | null;
  setting: Setting | null;
  challenge?: Challenge | null;
  himself?: AgentProfile;
};

type DebriefSections = {
  overall?: string;
  strengths?: string;
  areas_to_improve?: string;
  client_fit?: string;
  key_recommendation?: string;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading, null = logged out
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [himselfLoaded, setHimselfLoaded] = useState(false);
  const wasOnChatRoute = useRef(false);
  const [step, setStep] = useState<"setup" | "chat">("setup");
  const [industry, setIndustry] = useState<Industry>("Property");
  const [resumeChecked, setResumeChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openConversations, setOpenConversations] = useState<AppConversation[]>([]);
  const [metPersonaIds, setMetPersonaIds] = useState<Set<string>>(new Set());

  const DEFAULT_HIMSELF: AgentProfile = {
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

  const [himself, setHimself] = useState<AgentProfile>(DEFAULT_HIMSELF);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Landing CTAs use ?signup=1 — strip once logged in so home stays /app
  useEffect(() => {
    if (!session) return;
    if (!searchParams.has("signup") && !searchParams.has("mode")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("signup");
    next.delete("mode");
    setSearchParams(next, { replace: true });
  }, [session, searchParams, setSearchParams]);

  const goHome = () => navigate("/app");
  const goHistory = () => navigate("/app/history");
  const goProfile = () => navigate("/app/profile");
  const goTeam = () => navigate("/app/team");
  const goChat = (id: string) => navigate(`/app/chat/${id}`);

  const chatMatch = matchPath({ path: "/app/chat/:conversationId", end: true }, location.pathname);
  const routeConvId = chatMatch?.params?.conversationId || null;
  const isHistory = Boolean(matchPath({ path: "/app/history", end: true }, location.pathname));
  const isProfile = Boolean(matchPath({ path: "/app/profile", end: true }, location.pathname));
  const isTeam = Boolean(matchPath({ path: "/app/team", end: true }, location.pathname));

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setHimselfLoaded(false);
      setResumeChecked(false);
      return;
    }

    let cancelled = false;
    setHimselfLoaded(false);

    (async () => {
      try {
        let { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Failed to load profile:", error.message);
        }

        // Google signup (or profile deleted manually): recreate missing row
        if (!data) {
          const { data: ensured, error: ensureErr } = await supabase.rpc("ensure_own_profile");
          if (ensureErr) {
            console.error("ensure_own_profile failed:", ensureErr.message);
            // Fallback if RPC not deployed yet
            const meta = session.user.user_metadata || {};
            const fullName = meta.full_name || meta.name || session.user.email || "";
            const { data: created, error: insertErr } = await supabase
              .from("profiles")
              .upsert(
                {
                  id: session.user.id,
                  email: session.user.email,
                  full_name: fullName,
                  industry: "Property",
                },
                { onConflict: "id" }
              )
              .select("*")
              .maybeSingle();
            if (insertErr) {
              console.error("Failed to create profile:", insertErr.message);
            } else {
              data = created;
            }
          } else {
            data = Array.isArray(ensured) ? ensured[0] : ensured;
          }
        }

        if (cancelled) return;

        if (!data) {
          setProfile(null);
          setHimselfLoaded(true);
          return;
        }

        const loadedProfile = data as AppUserProfile;
        setProfile(loadedProfile);
        const ind: Industry = (!ENABLE_FINANCIAL_PLANNING || loadedProfile.industry !== "Financial Planning")
          ? "Property"
          : "FP";
        setIndustry(ind);
        if (loadedProfile.agent_profile) {
          setHimself(loadedProfile.agent_profile);
        } else {
          setHimself({
            ...DEFAULT_HIMSELF,
            name: loadedProfile.full_name || "",
            occupation: ind === "Property" ? "Property Agent" : "Financial Advisor",
            certification: ind === "Property" ? CERTIFICATIONS[0] : CERTIFICATIONS[1],
          });
        }
        setHimselfLoaded(true);
      } catch (e) {
        console.error("Profile bootstrap failed:", e);
        if (!cancelled) {
          setProfile(null);
          setHimselfLoaded(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [session?.user?.id]);

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

  async function closeOpenConversation(convId: string) {
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
      goHome();
    }
    refreshOpenConversations();
  }

  async function deleteConversation(convId: string) {
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
      goHome();
    }
    refreshOpenConversations();
  }

  async function persistAgentProfile(agentProfile: AgentProfile): Promise<void> {
    if (!profile) throw new Error("Profile not loaded yet.");
    const row = await saveProfileFields(profile.id, { agent_profile: agentProfile });
    const saved = (row.agent_profile as AgentProfile | null) ?? agentProfile;
    setHimself(saved);
    setProfile((prev) => (prev ? { ...prev, agent_profile: saved } : prev));
  }

  const [clientId, setClientId] = useState<string | null>(null);
  const [randomClient, setRandomClient] = useState<Persona | null>(null);
  const [aimKey, setAimKey] = useState<string | null>(null);
  const [settingKey, setSettingKey] = useState<string>(SETTINGS[0].key);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSessions>({ items: [], totalEndedCount: 0, practiceStreak: 0 });

  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [debriefOpen, setDebriefOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function refreshRecentSessions(limit = 3) {
    if (!profile) return;
    const [{ data: ended }, { count }, { data: endedDates }] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .eq("user_id", profile.id)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(limit),
      supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .not("ended_at", "is", null),
      supabase
        .from("conversations")
        .select("ended_at")
        .eq("user_id", profile.id)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(400),
    ]);
    const practiceStreak = computePracticeStreak((endedDates || []).map((r) => r.ended_at));
    setRecentSessions({
      items: ended || [],
      totalEndedCount: count || 0,
      practiceStreak,
    });
  }

  async function expandReplayList() {
    await refreshRecentSessions(20);
  }

  async function loadConversationIntoState(
    conv: AppConversation,
    { syncUrl = true }: { syncUrl?: boolean } = {}
  ) {
    if (!conv || !conv.client_snapshot) return;

    const { data: pastMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    if (conv.himself_snapshot) setHimself(conv.himself_snapshot);
    setIndustry(conv.client_snapshot.industry === "Property" ? "Property" : "FP");
    setRandomClient(conv.client_snapshot);
    setClientId(null);
    setAimKey(conv.aim_snapshot?.key || null);
    setSettingKey(conv.setting_snapshot?.key || SETTINGS[0].key);
    setChallenge(conv.challenge_snapshot || null);
    setConversationId(conv.id);

    const restored: ChatMessage[] = (pastMessages || []).map((m) => ({
      role: m.role === "agent" ? "user" as const : "assistant" as const,
      content: m.content,
    }));
    setDisplayMessages(restored);
    setApiMessages(restored);
    setDebriefOpen(false);
    setStep("chat");
    if (syncUrl) goChat(conv.id);
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

  function pickFixedClient(id: string | null) {
    setRandomClient(null);
    setClientId(id);
  }

  function generateRandom() {
    const industryKey = industry === "Property" ? "Property" : "FP";
    setClientId(null);
    setRandomClient(generateRandomClient(industryKey));
  }

  function updateHimself(field: keyof AgentProfile | string, value: unknown) {
    setHimself((prev) => ({ ...prev, [field]: value }));
  }

  async function switchIndustry(ind: string) {
    if (!ENABLE_FINANCIAL_PLANNING && ind !== "Property") return;
    const nextIndustry: Industry = ind === "Property" ? "Property" : "FP";
    setIndustry(nextIndustry);
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
          industry: (row.industry as string | null) ?? dbValue,
          agent_profile: (row.agent_profile as AgentProfile | null) ?? updatedHimself,
        } : prev));
        if (row.agent_profile) setHimself(row.agent_profile as AgentProfile);
      } catch (err) {
        console.error("Failed to save industry:", err instanceof Error ? err.message : String(err));
      }
    }
  }

  async function startRoleplayWith({
    client: startClient,
    aim: startAim,
    setting: startSetting,
    challenge: startChallenge = null,
    himself: startHimself = himself,
  }: StartRoleplayOptions) {
    if (!session || !startClient || !startAim || !startSetting) return;
    setError(null);
    setLoading(true);
    setStep("chat");
    setChallenge(startChallenge);
    setRandomClient(startClient);
    setClientId(null);
    setAimKey(startAim.key);
    setSettingKey(startSetting.key);

    let newConversationId: string | null = null;
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
      if (newConversationId) goChat(newConversationId);
      refreshOpenConversations();
      refreshMetPersonas();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("Failed to create conversation record:", message);
      // If challenge_snapshot column is missing, retry without it
      if (startChallenge && message.includes("challenge_snapshot")) {
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
            if (newConversationId) goChat(newConversationId);
            refreshOpenConversations();
            refreshMetPersonas();
          }
        } catch (e2) {
          console.error("Retry without challenge column failed:", e2 instanceof Error ? e2.message : String(e2));
        }
      }
    }

    const systemPrompt = buildSystemPrompt(startHimself, startClient, startAim, startSetting, startChallenge);
    const seed: ChatMessage = { role: "user", content: "(The roleplay is beginning now. Open the conversation yourself, in character, exactly as instructed in your system prompt.)" };
    try {
      const reply = await callGemini(systemPrompt, [seed]);
      setApiMessages([seed, { role: "assistant", content: reply }]);
      setDisplayMessages([{ role: "assistant", content: reply }]);
      if (newConversationId) saveMessage(newConversationId, "client", reply);
    } catch (e) {
      setError("Couldn't start the roleplay. " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function startRoleplay(nextChallenge: Challenge | null) {
    await startRoleplayWith({
      client,
      aim,
      setting,
      challenge: nextChallenge !== undefined ? nextChallenge : challenge,
      himself,
    });
  }

  async function startTargetedChallenge(ch: Challenge) {
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

  async function replaySession(conv: ConversationSession) {
    const replayAim = conv.aim_snapshot as Aim | null | undefined;
    const replaySetting = conv.setting_snapshot as Setting | null | undefined;
    if (!conv.client_snapshot || !replayAim || !replaySetting) {
      alert("This session is missing saved setup details, so it can't be replayed.");
      return;
    }
    const ch = conv.challenge_snapshot || conv.client_snapshot?._challenge || null;
    const clientSnap = { ...conv.client_snapshot };
    delete clientSnap._challenge;
    await startRoleplayWith({
      client: clientSnap,
      aim: replayAim,
      setting: replaySetting,
      challenge: ch,
      himself: conv.himself_snapshot || himself,
    });
  }

  async function saveMessage(convId: string, role: "agent" | "client", content: string) {
    try {
      await supabase.from("messages").insert({ conversation_id: convId, role, content });
    } catch (e) {
      console.error("Failed to save message:", e instanceof Error ? e.message : String(e));
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text };
    const newApiMessages = [...apiMessages, userMsg];
    setApiMessages(newApiMessages);
    setDisplayMessages((prev) => [...prev, userMsg]);
    if (conversationId) saveMessage(conversationId, "agent", text);
    setLoading(true);
    try {
      if (!client || !aim || !setting) throw new Error("Roleplay setup is incomplete.");
      const systemPrompt = buildSystemPrompt(himself, client, aim, setting, challenge);
      const reply = await callGemini(systemPrompt, newApiMessages);
      setApiMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setDisplayMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (conversationId) saveMessage(conversationId, "client", reply);
    } catch (e) {
      setError("Message failed to send. " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function saveDebrief(payload: Record<string, unknown>) {
    const clientFeedback = String(payload.clientFeedback ?? "");
    const reflection = payload.reflection as string | null | undefined;
    const reflectionUpdate = payload.reflectionUpdate as string | null | undefined;
    const facts = String(payload.facts ?? "");
    const suggestions = payload.suggestions as string | null | undefined;
    const suggestionsSections = payload.suggestionsSections as DebriefSections | null | undefined;
    const convId = payload.conversationId as string | null | undefined;
    if (!convId) return;
    const sections: DebriefSections = suggestionsSections || {};
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
    goHome();
  }

  // Keep chat UI in sync with /app/chat/:id (load on refresh, clear when leaving)
  useEffect(() => {
    if (!resumeChecked || !profile) return;

    if (routeConvId) {
      wasOnChatRoute.current = true;
      if (conversationId === routeConvId && step === "chat") return;

      let cancelled = false;
      (async () => {
        let conv = openConversations.find((c) => c.id === routeConvId);
        if (!conv) {
          const { data } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", routeConvId)
            .eq("user_id", profile.id)
            .maybeSingle();
          conv = data;
        }
        if (cancelled) return;
        if (conv?.client_snapshot) {
          await loadConversationIntoState(conv, { syncUrl: false });
        } else {
          navigate("/app", { replace: true });
        }
      })();
      return () => { cancelled = true; };
    }

    if (wasOnChatRoute.current) {
      wasOnChatRoute.current = false;
      if (step === "chat") {
        setStep("setup");
        setDisplayMessages([]);
        setApiMessages([]);
        setConversationId(null);
        setDebriefOpen(false);
        setChallenge(null);
        setError(null);
      }
    }
  }, [routeConvId, resumeChecked, profile?.id]);

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

  if (!himselfLoaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, color: NAVY, fontFamily: "-apple-system, sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: CREAM, color: NAVY, fontFamily: "-apple-system, sans-serif", gap: 12, padding: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Couldn&apos;t load your profile</div>
        <div style={{ fontSize: 13, color: "#6B7280", maxWidth: 360 }}>
          Your Google account signed in, but we couldn&apos;t create or read your Arena profile. Try again, or sign out and use email signup.
        </div>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          style={{
            marginTop: 8, padding: "10px 18px", borderRadius: 8, border: "none",
            background: GOLD, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Google (and any account without saved agent_profile) must complete profile once
  const needsProfileSetup = !profile.agent_profile;
  if (needsProfileSetup) {
    return (
      <>
        <ResponsiveStyles />
        <ProfileScreen
          mode="onboarding"
          profile={profile}
          himself={himself}
          himselfLoaded={himselfLoaded}
          industry={industry}
          openChatCount={0}
          onSave={persistAgentProfile}
          onBack={goHome}
          onComplete={() => navigate("/app", { replace: true })}
          onSignOut={() => supabase.auth.signOut()}
        />
      </>
    );
  }

  if (!resumeChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, color: NAVY, fontFamily: "-apple-system, sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (isTeam) {
    if (profile?.role !== "manager") {
      return <Navigate to="/app" replace />;
    }
    return (
      <>
        <ResponsiveStyles />
        <SessionHistory profile={profile} scope="team" onBack={goHome} onSignOut={() => supabase.auth.signOut()} />
      </>
    );
  }

  if (isHistory) {
    return (
      <>
        <ResponsiveStyles />
        <SessionHistory
          profile={profile}
          scope="mine"
          onBack={goHome}
          onSignOut={() => supabase.auth.signOut()}
          onContinue={async (conv) => {
            await loadConversationIntoState(conv);
          }}
        />
      </>
    );
  }

  if (isProfile) {
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
          onBack={goHome}
          onSignOut={() => supabase.auth.signOut()}
        />
      </>
    );
  }

  // Unknown /app/* paths → home
  if (!chatMatch && location.pathname !== "/app" && location.pathname !== "/app/") {
    return <Navigate to="/app" replace />;
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
          onSelect={(conv) => {
            const fullConversation = openConversations.find((item) => item.id === conv.id);
            if (fullConversation) loadConversationIntoState(fullConversation);
            setSidebarOpen(false);
          }}
          onCloseChat={closeOpenConversation}
          onDelete={deleteConversation}
          onClose={() => setSidebarOpen(false)}
          onHomeView={() => { goHome(); setSidebarOpen(false); }}
          onProfileView={() => { goProfile(); setSidebarOpen(false); }}
          onHistoryView={() => { goHistory(); setSidebarOpen(false); }}
          onTeamView={() => { goTeam(); setSidebarOpen(false); }}
          onSignOut={() => supabase.auth.signOut()}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, background: CREAM, color: NAVY, overflowY: step === "setup" ? "auto" : "hidden", height: "100%" }}>
        {step === "setup" && (
          <TopBar
            profile={profile}
            onSignOut={() => supabase.auth.signOut()}
            onTeamView={goTeam}
            onHistoryView={goHistory}
            onProfileView={goProfile}
            onHomeView={goHome}
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
            onEditProfile={goProfile}
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
            onExpandReplayList={expandReplayList}
            onViewHistory={goHistory}
          />
        ) : (
          <ChatScreen
            himself={himself}
            client={client!}
            aim={aim!}
            setting={setting!}
            challenge={challenge}
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
            onSaveDebrief={(payload) => saveDebrief(payload as Record<string, unknown>)}
          />
        )}
      </div>
    </div>
  );
}
