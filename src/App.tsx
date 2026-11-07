import React, { useState, useRef, useEffect } from "react";
import { Navigate, matchPath, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import { formatReflectionForPrompt } from "./SessionDebrief";
import { NAVY, CREAM, GOLD, ResponsiveStyles } from "./theme";
import {
  ENABLE_FINANCIAL_PLANNING,
  SETTINGS,
  PROPERTY_AIMS,
  FP_AIMS,
  ALL_PERSONAS,
  generateRandomClient,
} from "./data/personas";
import {
  ENABLE_EDUCATION_PACK,
  PRACTICE_PACK_STORAGE_KEY,
  getPackContent,
  isEducationProfileComplete,
  isPropertyProfileComplete,
  normalizePracticePack,
  resolvePracticePack,
} from "./data/practicePack";
import {
  defaultProfileForIndustry,
  hasUsableAgentProfile,
  industryDbValue,
  normalizeIndustry,
  isWorkspaceBag,
  parseAgentWorkspaces,
  putWorkspaceProfile,
  type SalesIndustry,
  type WorkspaceBag,
} from "./agentWorkspaces";
import { buildSystemPrompt } from "./prompts";
import { callGemini } from "./api";
import { saveProfileFields } from "./profileApi";
import { computePracticeStreak } from "./streak";
import { sessionHasChallenge, xpForSession } from "./xp";
import { APP_BASE, appPath } from "./routes";
import { clearCoachGoogleIntent, hasCoachGoogleIntent } from "./authCoachIntent";
import {
  formatRagContextBlock,
  logConversationRetrievals,
  retrieveRagChunks,
  userMessageForRagQuery,
} from "./rag";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import SetupScreen from "./pages/SetupScreen";
import ChatScreen from "./pages/ChatScreen";
import ProfileScreen from "./pages/ProfileScreen";
import SessionHistory from "./pages/SessionHistory";
import CoachArea from "./coach/CoachArea";
import type {
  AgentProfile,
  Aim,
  Challenge,
  ChatMessage,
  ConversationSession,
  Industry,
  Persona,
  PracticePack,
  Setting,
  UserProfile,
} from "./types/domain";

type AppUserProfile = UserProfile & {
  agent_profile?: AgentProfile | WorkspaceBag | null;
  industry?: Industry | "Financial Planning" | string | null;
  practice_pack?: PracticePack | string | null;
  xp?: number | null;
};

type AppConversation = ConversationSession & {
  aim_snapshot?: Aim | null;
  setting_snapshot?: Setting | null;
};

type RecentSessions = {
  items: ConversationSession[];
  totalEndedCount: number;
  practiceStreak: number;
  xp: number;
};

type StartRoleplayOptions = {
  client: Persona | null;
  aim: Aim | null;
  setting: Setting | null;
  challenge?: Challenge | null;
  himself?: AgentProfile;
  /** When set, conversation and RAG use this library (e.g. replay). */
  ragLibraryId?: string | null;
};

type DebriefSections = {
  overall?: string;
  strengths?: string;
  areas_to_improve?: string;
  client_fit?: string;
  key_recommendation?: string;
};

/** True when Supabase JWT user_metadata says account_type coach (set at coach signup). */
function jwtSaysCoach(session: Session | null | undefined): boolean {
  const raw = session?.user?.user_metadata?.account_type;
  return typeof raw === "string" && raw.trim().toLowerCase() === "coach";
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading, null = logged out
  const [coachIntentBusy, setCoachIntentBusy] = useState(false);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [himselfLoaded, setHimselfLoaded] = useState(false);
  const wasOnChatRoute = useRef(false);
  const [step, setStep] = useState<"setup" | "chat">("setup");
  const [industry, setIndustry] = useState<SalesIndustry>("Property");
  const [practicePack, setPracticePack] = useState<PracticePack>("property");
  const [workspaceBag, setWorkspaceBag] = useState<WorkspaceBag>({ version: 1 });
  const [resumeChecked, setResumeChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openConversations, setOpenConversations] = useState<AppConversation[]>([]);
  const [metPersonaIds, setMetPersonaIds] = useState<Set<string>>(new Set());
  const industryRef = useRef<SalesIndustry>("Property");
  const workspaceBagRef = useRef<WorkspaceBag>({ version: 1 });
  const himselfRef = useRef<AgentProfile>(defaultProfileForIndustry("Property"));

  const DEFAULT_HIMSELF: AgentProfile = defaultProfileForIndustry("Property");

  const DEFAULT_EDUCATION_HIMSELF: AgentProfile = {
    name: "",
    age: "",
    nationality: "Singaporean",
    disc: "I",
    studentGrade: "university",
    fieldOfStudy: "",
    targetPath: "Internship",
  };

  const [himself, setHimself] = useState<AgentProfile>(DEFAULT_HIMSELF);
  industryRef.current = industry;
  workspaceBagRef.current = workspaceBag;
  himselfRef.current = himself;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  /**
   * Google does not store signInWithOAuth `data` in user_metadata, and the return URL
   * can lose `?coach_google_intent=1` when we bounce a still-trainee profile off /dashboard/coach.
   * The signup page sets sessionStorage before the redirect; consume it here.
   */
  useEffect(() => {
    if (!session?.user?.id) return;
    const fromQuery = new URLSearchParams(window.location.search).get("coach_google_intent") === "1";
    const fromStorage = hasCoachGoogleIntent();
    if (!fromQuery && !fromStorage) return;

    let cancelled = false;
    setCoachIntentBusy(true);
    (async () => {
      try {
        const meta = session.user.user_metadata || {};
        const alreadyCoach =
          typeof meta.account_type === "string" && meta.account_type.trim().toLowerCase() === "coach";
        if (!alreadyCoach) {
          const { error: updErr } = await supabase.auth.updateUser({
            data: { account_type: "coach", practice_pack: "property" },
          });
          if (cancelled) return;
          if (updErr) {
            console.error("Coach metadata (Google OAuth) merge failed:", updErr.message);
            return;
          }
        }
        const { data: rpcRow, error: rpcErr } = await supabase.rpc("ensure_own_profile");
        if (cancelled) return;
        if (rpcErr) {
          console.error("ensure_own_profile after coach merge:", rpcErr.message);
          return;
        }
        const row = Array.isArray(rpcRow) ? rpcRow[0] : rpcRow;
        if (row && typeof row === "object" && "id" in row) {
          setProfile(row as AppUserProfile);
        } else {
          const { data: fresh } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          if (fresh) setProfile(fresh as AppUserProfile);
        }
        clearCoachGoogleIntent();
        const url = new URL(window.location.href);
        if (url.searchParams.has("coach_google_intent")) {
          url.searchParams.delete("coach_google_intent");
          window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        }
        // Only move off trainee home — do not stomp /dashboard/coach/libraries etc.
        const pathNorm = window.location.pathname.replace(/\/$/, "") || APP_BASE;
        if (pathNorm === APP_BASE || pathNorm === `${APP_BASE}/`) {
          navigate(appPath("/coach"), { replace: true });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setCoachIntentBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id, navigate]);

  // After Google OAuth, Supabase may land on /dashboard#access_token=... — replace so Back skips the hash URL
  useEffect(() => {
    if (!session) return;
    const { hash, pathname, search } = window.location;
    if (!hash) return;
    if (
      hash.includes("access_token") ||
      hash.includes("refresh_token") ||
      hash.includes("error") ||
      hash.includes("code=")
    ) {
      window.history.replaceState(null, "", `${pathname}${search}` || appPath());
    }
  }, [session]);

  // Landing / trial invite query params — strip once logged in so home stays /dashboard
  useEffect(() => {
    if (!session) return;
    const keys = ["signup", "mode", "email", "name", "full_name", "pack"] as const;
    if (!keys.some((k) => searchParams.has(k))) return;
    const next = new URLSearchParams(searchParams);
    for (const k of keys) next.delete(k);
    setSearchParams(next, { replace: true });
  }, [session, searchParams, setSearchParams]);

  const goHome = () => navigate(appPath());
  const goHistory = () => navigate(appPath("/history"));
  const goProfile = () => navigate(appPath("/profile"));
  const goTeam = () => navigate(appPath("/team"));
  const goChat = (id: string) => navigate(appPath(`/chat/${id}`));

  const chatMatch = matchPath({ path: `${APP_BASE}/chat/:conversationId`, end: true }, location.pathname);
  const routeConvId = chatMatch?.params?.conversationId || null;
  const isCoachRoute = Boolean(matchPath({ path: `${APP_BASE}/coach`, end: false }, location.pathname));
  const isHistory = Boolean(matchPath({ path: `${APP_BASE}/history`, end: true }, location.pathname));
  const isProfile = Boolean(matchPath({ path: `${APP_BASE}/profile`, end: true }, location.pathname));
  const isTeam = Boolean(matchPath({ path: `${APP_BASE}/team`, end: true }, location.pathname));

  const coachFromJwt = jwtSaysCoach(session);
  const coachIntentPending =
    coachIntentBusy ||
    hasCoachGoogleIntent() ||
    searchParams.get("coach_google_intent") === "1";
  const isCoachUser = profile?.role === "coach" || coachFromJwt;

  useEffect(() => {
    if (session === undefined || !session || !profile || !isCoachUser) return;
    const path = location.pathname.replace(/\/$/, "") || APP_BASE;
    if (path === APP_BASE || path === `${APP_BASE}/`) navigate(appPath("/coach"), { replace: true });
  }, [session, profile?.id, isCoachUser, location.pathname, navigate]);

  /** JWT says coach but DB still trainee — re-run ensure_own_profile after Supabase SQL fix. */
  useEffect(() => {
    if (!session?.user?.id || !profile || profile.role === "coach") return;
    if (!jwtSaysCoach(session)) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("ensure_own_profile");
      if (cancelled || error) {
        if (error) console.error("ensure_own_profile (coach sync):", error.message);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row === "object" && "role" in row && (row as AppUserProfile).role === "coach") {
        setProfile(row as AppUserProfile);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id, profile?.id, profile?.role, session?.user?.user_metadata?.account_type]);

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
            const fallbackPack = resolvePracticePack({
              authMetaPack: meta.practice_pack,
              agentProfile: meta.agent_profile as AgentProfile | null | undefined,
            });
            const coachFromMeta =
              typeof meta.account_type === "string" && meta.account_type.trim().toLowerCase() === "coach";
            const { data: created, error: insertErr } = await supabase
              .from("profiles")
              .upsert(
                {
                  id: session.user.id,
                  email: session.user.email,
                  full_name: fullName,
                  industry: "Property",
                  practice_pack: fallbackPack,
                  ...(coachFromMeta ? { role: "coach" as const } : {}),
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

        const meta = session.user.user_metadata || {};

        if (loadedProfile.role === "coach" || jwtSaysCoach(session)) {
          setPracticePack("property");
          setIndustry("Property");
          setWorkspaceBag({ version: 1 });
          setHimself(defaultProfileForIndustry("Property"));
          setHimselfLoaded(true);
          return;
        }

        let sessionPack: string | null = null;
        try {
          sessionPack = sessionStorage.getItem(PRACTICE_PACK_STORAGE_KEY);
        } catch {
          /* ignore */
        }

        let pack = resolvePracticePack({
          dbPack: loadedProfile.practice_pack,
          authMetaPack: meta.practice_pack,
          agentProfile: loadedProfile.agent_profile as AgentProfile | null | undefined,
          sessionStoragePack: sessionPack,
        });

        // Persist pack if we learned it from signup metadata / session (DB may still default to property).
        if (
          ENABLE_EDUCATION_PACK &&
          pack === "education" &&
          normalizePracticePack(loadedProfile.practice_pack) !== "education"
        ) {
          try {
            await saveProfileFields(loadedProfile.id, { practice_pack: pack });
            loadedProfile.practice_pack = pack;
          } catch (e) {
            console.error("Failed to save practice_pack:", e);
          }
        }

        if (sessionPack) {
          try {
            sessionStorage.removeItem(PRACTICE_PACK_STORAGE_KEY);
          } catch {
            /* ignore */
          }
        }

        setPracticePack(pack);

        const ind: SalesIndustry = (!ENABLE_FINANCIAL_PLANNING || loadedProfile.industry !== "Financial Planning")
          ? "Property"
          : "FP";
        setIndustry(ind);
        if (pack === "education") {
          // Education keeps a flat student profile (not Property/FP workspace bag).
          const raw = loadedProfile.agent_profile;
          const flat = raw && typeof raw === "object" && !isWorkspaceBag(raw)
            ? (raw as AgentProfile)
            : null;
          setWorkspaceBag({ version: 1 });
          setHimself(flat?.name
            ? flat
            : { ...DEFAULT_EDUCATION_HIMSELF, name: loadedProfile.full_name || "" });
        } else {
          const parsed = parseAgentWorkspaces(loadedProfile.agent_profile, ind);
          setWorkspaceBag(parsed.bag);
          if (parsed.current) {
            setHimself(parsed.current);
          } else {
            setHimself({
              ...defaultProfileForIndustry(ind),
              name: loadedProfile.full_name || "",
            });
          }
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
  }, [session?.user?.id, session?.user?.user_metadata]);

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
    if (practicePack === "education") {
      const row = await saveProfileFields(profile.id, { agent_profile: agentProfile });
      const saved = (row.agent_profile as AgentProfile | null) ?? agentProfile;
      himselfRef.current = saved;
      setHimself(saved);
      setProfile((prev) => (prev ? { ...prev, agent_profile: saved } : prev));
      return;
    }
    const currentIndustry = industryRef.current;
    const nextBag = putWorkspaceProfile(workspaceBagRef.current, currentIndustry, agentProfile);
    const row = await saveProfileFields(profile.id, {
      agent_profile: nextBag,
      industry: industryDbValue(currentIndustry),
    });
    const savedRaw = row.agent_profile ?? nextBag;
    const parsed = parseAgentWorkspaces(savedRaw, currentIndustry);
    const saved = parsed.current ?? agentProfile;
    workspaceBagRef.current = parsed.bag;
    himselfRef.current = saved;
    setWorkspaceBag(parsed.bag);
    setHimself(saved);
    setProfile((prev) => (prev ? {
      ...prev,
      agent_profile: parsed.bag,
      industry: (row.industry as string | null) ?? industryDbValue(currentIndustry),
    } : prev));
  }

  const [clientId, setClientId] = useState<string | null>(null);
  const [randomClient, setRandomClient] = useState<Persona | null>(null);
  const [aimKey, setAimKey] = useState<string | null>(null);
  const [settingKey, setSettingKey] = useState<string>("Canvassing");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSessions>({
    items: [],
    totalEndedCount: 0,
    practiceStreak: 0,
    xp: 0,
  });

  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [debriefOpen, setDebriefOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [enrolledLibraries, setEnrolledLibraries] = useState<{ id: string; title: string }[]>([]);
  const [selectedRagLibraryId, setSelectedRagLibraryId] = useState<string | null>(null);
  const [sessionRagLibraryId, setSessionRagLibraryId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.role === "coach" || profile.role === "manager") return;
    let cancelled = false;
    (async () => {
      const { data: enrolls, error: e1 } = await supabase
        .from("library_enrollments")
        .select("library_id")
        .eq("profile_id", profile.id);
      if (cancelled || e1) {
        if (e1) console.warn("library_enrollments:", e1.message);
        return;
      }
      const ids = (enrolls || []).map((r) => r.library_id).filter(Boolean);
      if (ids.length === 0) {
        setEnrolledLibraries([]);
        setSelectedRagLibraryId(null);
        return;
      }
      const { data: libs, error: e2 } = await supabase
        .from("knowledge_libraries")
        .select("id, title, status")
        .in("id", ids)
        .eq("status", "active");
      if (cancelled || e2) {
        if (e2) console.warn("knowledge_libraries:", e2.message);
        return;
      }
      const list = (libs || []).map((l) => ({ id: l.id, title: String(l.title || "Library") }));
      setEnrolledLibraries(list);
      setSelectedRagLibraryId((prev) => {
        if (prev && list.some((l) => l.id === prev)) return prev;
        return list.length === 1 ? list[0].id : null;
      });
    })();
    return () => { cancelled = true; };
  }, [profile?.id, profile?.role]);

  async function refreshRecentSessions(limit = 3, forIndustry: SalesIndustry = industry) {
    if (!profile) return;
    const industryKey = forIndustry === "Property" ? "Property" : "FP";
    const [{ data: ended }, { count }, { data: endedDates }] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .eq("user_id", profile.id)
        .eq("industry", industryKey)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(limit),
      supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("industry", industryKey)
        .not("ended_at", "is", null),
      supabase
        .from("conversations")
        .select("ended_at")
        .eq("user_id", profile.id)
        .eq("industry", industryKey)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(400),
    ]);
    const practiceStreak = computePracticeStreak((endedDates || []).map((r) => r.ended_at));
    setRecentSessions({
      items: ended || [],
      totalEndedCount: count || 0,
      practiceStreak,
      xp: Number(profile.xp) || 0,
    });
  }

  /** Mark a finished conversation as XP-awarded and bump profile.xp (idempotent). */
  async function awardXpForConversation(conv: ConversationSession | AppConversation | null | undefined) {
    if (!profile || !conv?.id) return 0;
    if (conv.xp_awarded != null) return 0;

    const amount = xpForSession({
      grade: conv.client_grade,
      hasChallenge: sessionHasChallenge(conv),
    });

    const { data: claimed, error: claimErr } = await supabase
      .from("conversations")
      .update({ xp_awarded: amount })
      .eq("id", conv.id)
      .eq("user_id", profile.id)
      .is("xp_awarded", null)
      .select("id")
      .maybeSingle();

    if (claimErr) {
      console.error("Failed to claim session XP:", claimErr.message);
      return 0;
    }
    if (!claimed) return 0;

    const { data: latest } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", profile.id)
      .maybeSingle();
    const nextXp = (Number(latest?.xp) || 0) + amount;

    try {
      const row = await saveProfileFields(profile.id, { xp: nextXp });
      const savedXp = Number(row.xp ?? nextXp) || nextXp;
      setProfile((prev) => (prev ? { ...prev, xp: savedXp } : prev));
      setRecentSessions((prev) => ({ ...prev, xp: savedXp }));
      return amount;
    } catch (e) {
      console.error("Failed to save profile XP:", e);
      return 0;
    }
  }

  /** One-time catch-up for sessions ended before XP existed. */
  async function backfillMissingSessionXp() {
    if (!profile) return;
    const { data: pending, error } = await supabase
      .from("conversations")
      .select("id, user_id, client_grade, challenge_snapshot, client_snapshot, xp_awarded")
      .eq("user_id", profile.id)
      .not("ended_at", "is", null)
      .is("xp_awarded", null)
      .limit(200);

    if (error) {
      // Column may not exist yet until add_profile_xp.sql is run
      console.error("XP backfill query failed:", error.message);
      return;
    }
    if (!pending?.length) return;

    let gained = 0;
    for (const conv of pending) {
      gained += await awardXpForConversation(conv);
    }
    if (gained > 0) {
      await refreshRecentSessions();
    }
  }

  async function expandReplayList() {
    await refreshRecentSessions(20);
  }

  async function loadConversationIntoState(
    conv: AppConversation,
    { syncUrl = true }: { syncUrl?: boolean } = {}
  ) {
    if (!conv || !conv.client_snapshot) return;

    const rag = (conv as { rag_library_id?: string | null }).rag_library_id ?? null;
    setSessionRagLibraryId(rag);

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
      await refreshRecentSessions();
      if (!cancelled) await backfillMissingSessionXp();

      // Stay on home after refresh/login — open chats remain in the sidebar to resume manually.
      if (!cancelled) setResumeChecked(true);
    })();

    return () => { cancelled = true; };
  }, [session, profile?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [displayMessages, loading]);

  const packContent = getPackContent(practicePack, himself);
  const industryPersonas = practicePack === "education"
    ? packContent.personas
    : ALL_PERSONAS.filter((p) => p.industry === (industry === "Property" ? "Property" : "FP"));
  const aims = practicePack === "education"
    ? packContent.aims
    : (industry === "Property" ? PROPERTY_AIMS : FP_AIMS);
  const packSettings = practicePack === "education" ? packContent.settings : SETTINGS;
  const packChallenges = packContent.challenges;
  const client = randomClient || industryPersonas.find((p) => p.id === clientId) || ALL_PERSONAS.find((p) => p.id === clientId) || null;
  const aim = aims.find((a) => a.key === aimKey) || null;
  const setting = packSettings.find((s) => s.key === settingKey) || null;

  // Keep setting/aim/client valid when education grade (or pack content) changes
  useEffect(() => {
    setAimKey(null);
    setClientId(null);
    setRandomClient(null);
    setChallenge(null);
    const nextSettings = getPackContent(practicePack, himself).settings;
    setSettingKey(nextSettings[0]?.key || "");
  }, [practicePack, himself.studentGrade]);

  function pickFixedClient(id: string | null) {
    setRandomClient(null);
    setClientId(id);
  }

  function generateRandom() {
    if (practicePack === "education") {
      const pool = industryPersonas;
      const pick = pool[Math.floor(Math.random() * pool.length)] || pool[0];
      setClientId(null);
      setRandomClient(pick ? { ...pick, isRandom: true, id: `RAND-${Date.now()}` } : null);
      return;
    }
    const industryKey = industry === "Property" ? "Property" : "FP";
    setClientId(null);
    setRandomClient(generateRandomClient(industryKey));
  }

  function updateHimself(field: keyof AgentProfile | string, value: unknown) {
    setHimself((prev) => ({ ...prev, [field]: value }));
  }

  async function switchIndustry(ind: string, opts?: { navigateHome?: boolean }) {
    if (practicePack === "education") return;
    if (!ENABLE_FINANCIAL_PLANNING && ind !== "Property") return;
    // Onboarding industry cards pass navigateHome: false so we stay on the details form.
    const navigateHome = opts?.navigateHome !== false;
    const currentIndustry = industryRef.current;
    const nextIndustry: SalesIndustry = normalizeIndustry(ind === "Property" ? "Property" : "FP");
    if (nextIndustry === currentIndustry) {
      if (navigateHome) goHome();
      return;
    }

    // Keep each workspace's agent profile separate (WhatsApp-style accounts).
    const currentHimself = himselfRef.current;
    const bagWithCurrent = putWorkspaceProfile(workspaceBagRef.current, currentIndustry, currentHimself);
    const nextHimself =
      bagWithCurrent[nextIndustry] ||
      defaultProfileForIndustry(nextIndustry, currentHimself);
    const nextBag = putWorkspaceProfile(bagWithCurrent, nextIndustry, nextHimself);

    setWorkspaceBag(nextBag);
    setIndustry(nextIndustry);
    setHimself(nextHimself);
    setClientId(null);
    setRandomClient(null);
    setAimKey(null);
    setChallenge(null);
    setStep("setup");
    setDisplayMessages([]);
    setApiMessages([]);
    setConversationId(null);
    setDebriefOpen(false);
    setSidebarOpen(false);
    if (navigateHome) goHome();

    await refreshRecentSessions(3, nextIndustry);

    if (profile) {
      const dbValue = industryDbValue(nextIndustry);
      try {
        // During onboarding, only persist industry — saving agent_profile early would
        // mark the profile "complete" (name from signup) and skip the details step.
        const row = await saveProfileFields(
          profile.id,
          navigateHome
            ? { industry: dbValue, agent_profile: nextBag }
            : { industry: dbValue }
        );
        if (navigateHome) {
          const parsed = parseAgentWorkspaces(row.agent_profile ?? nextBag, nextIndustry);
          setWorkspaceBag(parsed.bag);
          if (parsed.current) setHimself(parsed.current);
          setProfile((prev) => (prev ? {
            ...prev,
            industry: (row.industry as string | null) ?? dbValue,
            agent_profile: parsed.bag,
          } : prev));
        } else {
          setProfile((prev) => (prev ? {
            ...prev,
            industry: (row.industry as string | null) ?? dbValue,
          } : prev));
        }
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
    ragLibraryId: explicitRagId = undefined,
  }: StartRoleplayOptions) {
    if (!session || !startClient || !startAim || !startSetting) return;
    const ragId =
      explicitRagId !== undefined
        ? explicitRagId
        : profile?.role !== "coach" && profile?.role !== "manager"
          ? selectedRagLibraryId
          : null;
    setSessionRagLibraryId(ragId);
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
        ...(ragId ? { rag_library_id: ragId } : {}),
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
              ...(ragId ? { rag_library_id: ragId } : {}),
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

    let systemPrompt = buildSystemPrompt(startHimself, startClient, startAim, startSetting, startChallenge);
    const seedText =
      "(The roleplay is beginning now. Open the conversation yourself, in character, exactly as instructed in your system prompt.)";
    const seedForApi: ChatMessage = {
      role: "user",
      content: ragId
        ? userMessageForRagQuery(seedText)
        : seedText,
    };
    try {
      if (ragId && newConversationId && profile?.role !== "coach") {
        const matches = await retrieveRagChunks(supabase, ragId, seedText, 8);
        if (matches.length) {
          systemPrompt =
            formatRagContextBlock(matches) + systemPrompt;
          await logConversationRetrievals(supabase, newConversationId, seedText, matches);
        }
      }
      const reply = await callGemini(systemPrompt, [seedForApi]);
      setApiMessages([seedForApi, { role: "assistant", content: reply }]);
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
    const startSetting = packSettings[Math.floor(Math.random() * packSettings.length)];
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
    const replayRagId =
      typeof conv.rag_library_id === "string" ? conv.rag_library_id : null;
    await startRoleplayWith({
      client: clientSnap,
      aim: replayAim,
      setting: replaySetting,
      challenge: ch,
      himself: conv.himself_snapshot || himself,
      ragLibraryId: replayRagId,
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
    const userMsgDisplay: ChatMessage = { role: "user", content: text };
    const useRag =
      Boolean(sessionRagLibraryId && conversationId) &&
      profile?.role !== "coach" &&
      profile?.role !== "manager";
    const userMsgForModel: ChatMessage = useRag
      ? { role: "user", content: userMessageForRagQuery(text) }
      : userMsgDisplay;
    const newApiMessages = [...apiMessages, userMsgForModel];
    setApiMessages(newApiMessages);
    setDisplayMessages((prev) => [...prev, userMsgDisplay]);
    if (conversationId) saveMessage(conversationId, "agent", text);
    setLoading(true);
    try {
      if (!client || !aim || !setting) throw new Error("Roleplay setup is incomplete.");
      let systemPrompt = buildSystemPrompt(himself, client, aim, setting, challenge);
      if (useRag && sessionRagLibraryId && conversationId) {
        const matches = await retrieveRagChunks(supabase, sessionRagLibraryId, text, 8);
        if (matches.length) {
          systemPrompt = formatRagContextBlock(matches) + systemPrompt;
          await logConversationRetrievals(supabase, conversationId, text, matches);
        }
      }
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

    const { data: endedConv } = await supabase
      .from("conversations")
      .select("id, user_id, client_grade, challenge_snapshot, client_snapshot, xp_awarded")
      .eq("id", convId)
      .maybeSingle();

    await awardXpForConversation(
      endedConv || {
        id: convId,
        user_id: profile?.id || "",
        client_grade: client?.grade,
        challenge_snapshot: challenge,
        client_snapshot: client,
      }
    );

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
    setSessionRagLibraryId(null);
    refreshRecentSessions();
    goHome();
  }

  // Keep chat UI in sync with /dashboard/chat/:id (load on refresh, clear when leaving)
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
          navigate(appPath(), { replace: true });
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
        setSessionRagLibraryId(null);
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

  // Google (and any incomplete profile) must complete setup once
  const needsProfileSetup =
    !isCoachUser &&
    !coachIntentPending &&
    (practicePack === "education"
      ? !isEducationProfileComplete(himself)
      : !hasUsableAgentProfile(profile.agent_profile));
  if (needsProfileSetup) {
    return (
      <>
        <ResponsiveStyles />
        <ProfileScreen
          mode="onboarding"
          profile={profile}
          himself={himself}
          himselfLoaded={himselfLoaded}
          practicePack={practicePack}
          industry={industry}
          openChatCount={0}
          onSave={persistAgentProfile}
          onIndustryChange={switchIndustry}
          onBack={goHome}
          onComplete={() => navigate(appPath(), { replace: true })}
          onSignOut={() => supabase.auth.signOut()}
        />
      </>
    );
  }

  if (coachIntentPending && !isCoachUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, color: NAVY, fontFamily: "-apple-system, sans-serif" }}>
        Setting up your coach account...
      </div>
    );
  }

  if (isCoachRoute) {
    if (!isCoachUser) {
      return <Navigate to={appPath()} replace />;
    }
    return (
      <CoachArea profileId={profile.id} fullName={profile.full_name} onSignOut={() => supabase.auth.signOut()} />
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
      return <Navigate to={appPath()} replace />;
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
          industry={industry}
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
          himself={himself}
          himselfLoaded={himselfLoaded}
          practicePack={practicePack}
          industry={industry}
          openChatCount={openConversations.filter((c) => normalizeIndustry(c.industry) === industry).length}
          onSave={persistAgentProfile}
          onIndustryChange={switchIndustry}
          onBack={goHome}
          onSignOut={() => supabase.auth.signOut()}
        />
      </>
    );
  }

  // Unknown /dashboard/* paths → home
  if (
    !chatMatch &&
    location.pathname !== APP_BASE &&
    location.pathname !== `${APP_BASE}/` &&
    !isCoachRoute &&
    !location.pathname.startsWith(`${APP_BASE}/coach/`)
  ) {
    return <Navigate to={appPath()} replace />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <ResponsiveStyles />
      <div className={`arena-backdrop${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <div className={`arena-sidebar${sidebarOpen ? " open" : ""}`}>
        <Sidebar
          openConversations={openConversations.filter(
            (c) => normalizeIndustry(c.industry) === industry
          )}
          activeId={conversationId}
          profile={profile}
          industry={industry}
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
            practicePack={practicePack}
            practiceHeadline={packContent.practiceHeadline}
            counterpartyLabel={packContent.counterpartyLabel}
            industry={industry}
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
            settings={packSettings}
            settingKey={settingKey}
            setSettingKey={setSettingKey}
            challenges={packChallenges}
            challenge={challenge}
            setChallenge={setChallenge}
            canStart={canStart}
            startRoleplay={startRoleplay}
            onStartChallenge={startTargetedChallenge}
            recentSessions={recentSessions}
            onReplay={replaySession}
            onExpandReplayList={expandReplayList}
            onViewHistory={goHistory}
            ragLibraries={
              profile?.role !== "coach" && profile?.role !== "manager" ? enrolledLibraries : []
            }
            selectedRagLibraryId={selectedRagLibraryId}
            onRagLibraryChange={setSelectedRagLibraryId}
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
