import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, matchPath, useLocation, useNavigate } from "react-router-dom";
import { MoreHorizontal, Upload } from "lucide-react";
import { supabase } from "../supabaseClient";
import { APP_BASE, appPath } from "../routes";
import { NAVY, GOLD, CREAM, inputStyle } from "../theme";
import { chunkPastedText } from "./chunkPaste";
import { fetchEmbedding } from "../rag";
import CoachDashboard from "./CoachDashboard";
import CoachProfileForm from "./CoachProfileForm";
import CoachShell, { type CoachNavKey } from "./CoachShell";
import CoachStudents from "./CoachStudents";
import {
  COACH_PROFILE_SELECT,
  isCoachProfileComplete,
  normalizeCoachProfile,
  type CoachProfileRow,
} from "./coachProfile";

type KnowledgeLibraryRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

type KnowledgeDocumentRow = {
  id: string;
  title: string;
  source_type: string;
  storage_path: string | null;
  mime_type: string | null;
  processing_status: string;
  error_message: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type KnowledgeChunkRow = {
  id: string;
  chunk_index: number;
  content: string;
  embedding: string | number[] | null;
};

type Props = {
  profileId: string;
  fullName?: string | null;
  onSignOut: () => void;
};

const container: React.CSSProperties = {
  maxWidth: 720,
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #E2DFD6",
  background: "#fff",
  color: NAVY,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: GOLD,
  color: NAVY,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const LIBRARY_CARD_ART = "/images/ecosystem/coaches/coach_library_card.png";

function LibrariesList({ profileId }: { profileId: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<KnowledgeLibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("knowledge_libraries")
      .select("id, owner_id, title, description, status, created_at")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows((data || []) as KnowledgeLibraryRow[]);
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createLibrary() {
    setSaving(true);
    setError(null);
    const { data, error: insErr } = await supabase
      .from("knowledge_libraries")
      .insert({
        owner_id: profileId,
        title: "Untitled library",
        description: null,
        status: "draft",
      })
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    if (data?.id) navigate(appPath(`/coach/libraries/${data.id}`));
    else void load();
  }

  const statusPill = (status: string) => {
    const label = status === "active" ? "Active" : status === "archived" ? "Archived" : "Draft";
    return (
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
        {label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 6px", color: NAVY }}>
        Knowledge libraries
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 22px", lineHeight: 1.5 }}>
        Manage the playbooks your students practise with.
      </p>

      {error && (
        <div style={{ marginBottom: 14, color: "#7A2E3A", fontSize: 13 }}>{error}</div>
      )}

      {loading ? (
        <p style={{ color: "#6B7280" }}>Loading…</p>
      ) : rows.length === 0 ? (
        <>
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #F0E4DC",
              minHeight: 210,
              background: "#FFF1ED",
              marginBottom: 16,
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
                Add scripts, frameworks, and examples for your students to practise with.
              </p>
              <button
                type="button"
                onClick={() => void createLibrary()}
                disabled={saving}
                style={{
                  ...btnPrimary,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#fff",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Creating…" : "+ New library"}
              </button>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #E2DFD6",
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 14 }}>
              How it works
            </div>
            {[
              "Add materials",
              "Prepare for practice",
              "Activate and enroll students",
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
        </>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              onClick={() => void createLibrary()}
              disabled={saving}
              style={{
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
                cursor: saving ? "wait" : "pointer",
                fontFamily: "inherit",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Creating…" : "+ New library"}
            </button>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rows.map((r) => (
              <li
                key={r.id}
                style={{
                  background: "#fff",
                  border: "1px solid #E2DFD6",
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <Link
                  to={appPath(`/coach/libraries/${r.id}`)}
                  style={{
                    display: "block",
                    padding: "16px 18px",
                    color: NAVY,
                    textDecoration: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</span>
                    {statusPill(r.status)}
                  </div>
                  {r.description ? (
                    <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{r.description}</div>
                  ) : null}
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
                    Created {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function LibraryDetail({ profileId, libraryId }: { profileId: string; libraryId: string }) {
  const navigate = useNavigate();
  const [lib, setLib] = useState<KnowledgeLibraryRow | null>(null);
  const [docCount, setDocCount] = useState<number | null>(null);
  const [chunkCount, setChunkCount] = useState<number | null>(null);
  const [embeddedCount, setEmbeddedCount] = useState<number | null>(null);
  const [pasteTitle, setPasteTitle] = useState("Pasted notes");
  const [pasteBody, setPasteBody] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  /** Page-level load / access errors only (shown when library missing). */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [embedOk, setEmbedOk] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollOk, setEnrollOk] = useState<string | null>(null);
  const [enrolledRows, setEnrolledRows] = useState<{ profile_id: string; email: string | null; full_name: string | null }[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteOk, setPasteOk] = useState<string | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activateOk, setActivateOk] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState(false);
  const [activating, setActivating] = useState(false);
  const [traineeEmail, setTraineeEmail] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [documents, setDocuments] = useState<KnowledgeDocumentRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [docChunks, setDocChunks] = useState<Record<string, KnowledgeChunkRow[]>>({});
  const [chunksLoadingDocId, setChunksLoadingDocId] = useState<string | null>(null);
  const [chunkBusyId, setChunkBusyId] = useState<string | null>(null);
  const [docBusyId, setDocBusyId] = useState<string | null>(null);
  const [docsActionError, setDocsActionError] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"materials" | "students">("materials");
  const [addMode, setAddMode] = useState<"upload" | "paste">("upload");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocuments = useCallback(async () => {
    setDocsLoading(true);
    const { data, error: dErr } = await supabase
      .from("knowledge_documents")
      .select("id, title, source_type, storage_path, mime_type, processing_status, error_message, created_at, metadata")
      .eq("library_id", libraryId)
      .order("created_at", { ascending: false });
    if (dErr) {
      console.warn("knowledge_documents list:", dErr.message);
      setDocuments([]);
    } else {
      setDocuments((data || []) as KnowledgeDocumentRow[]);
    }
    setDocsLoading(false);
  }, [libraryId]);

  async function ensureDocChunks(documentId: string) {
    if (docChunks[documentId]) return;
    setChunksLoadingDocId(documentId);
    const { data, error: qErr } = await supabase
      .from("knowledge_chunks")
      .select("id, chunk_index, content, embedding")
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true });
    setChunksLoadingDocId(null);
    if (qErr) {
      console.warn("knowledge_chunks:", qErr.message);
      return;
    }
    setDocChunks((prev) => ({
      ...prev,
      [documentId]: (data || []) as KnowledgeChunkRow[],
    }));
  }

  function toggleDocExpand(docId: string) {
    setDocsActionError(null);
    if (expandedDocId === docId) {
      setExpandedDocId(null);
      return;
    }
    setExpandedDocId(docId);
    void ensureDocChunks(docId);
  }

  function downloadTextAsFile(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadOriginalFile(doc: KnowledgeDocumentRow) {
    if (!doc.storage_path) return;
    setDocsActionError(null);
    const { data, error: urlErr } = await supabase.storage
      .from("coach-documents")
      .createSignedUrl(doc.storage_path, 3600);
    if (urlErr || !data?.signedUrl) {
      setDocsActionError(urlErr?.message || "Could not create download link.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDownloadChunksAsText(doc: KnowledgeDocumentRow) {
    setDocsActionError(null);
    let rows = docChunks[doc.id];
    if (!rows) {
      const { data, error: qErr } = await supabase
        .from("knowledge_chunks")
        .select("id, chunk_index, content, embedding")
        .eq("document_id", doc.id)
        .order("chunk_index", { ascending: true });
      if (qErr) {
        setDocsActionError(qErr.message);
        return;
      }
      rows = (data || []) as KnowledgeChunkRow[];
    }
    if (!rows.length) {
      setDocsActionError("No chunks to export for this document.");
      return;
    }
    const sorted = [...rows].sort((a, b) => a.chunk_index - b.chunk_index);
    const text = sorted.map((c, i) => `--- Chunk ${i + 1} (index ${c.chunk_index}) ---\n\n${c.content}`).join("\n\n");
    const base = doc.title.replace(/[/\\?*:|"<>]/g, "-").slice(0, 100) || "document";
    downloadTextAsFile(`${base}-chunks.txt`, text);
  }

  async function handleDeleteChunk(chunkId: string, documentId: string) {
    if (!window.confirm("Delete this chunk? It will be removed from search until you add new content.")) return;
    setDocsActionError(null);
    setChunkBusyId(chunkId);
    const { error: delErr } = await supabase.from("knowledge_chunks").delete().eq("id", chunkId);
    setChunkBusyId(null);
    if (delErr) {
      setDocsActionError(delErr.message);
      return;
    }
    setDocChunks((prev) => ({
      ...prev,
      [documentId]: (prev[documentId] || []).filter((c) => c.id !== chunkId),
    }));
    void load();
  }

  async function handleDeleteDocumentRow(doc: KnowledgeDocumentRow) {
    if (!window.confirm(`Delete "${doc.title}" and all its chunks? This cannot be undone.`)) return;
    setDocsActionError(null);
    setDocBusyId(doc.id);
    if (doc.storage_path) {
      const { error: rmErr } = await supabase.storage.from("coach-documents").remove([doc.storage_path]);
      if (rmErr) {
        setDocsActionError(`Could not remove file from storage: ${rmErr.message}`);
        setDocBusyId(null);
        return;
      }
    }
    const { error: delErr } = await supabase.from("knowledge_documents").delete().eq("id", doc.id);
    setDocBusyId(null);
    if (delErr) {
      setDocsActionError(delErr.message);
      return;
    }
    setDocChunks((prev) => {
      const next = { ...prev };
      delete next[doc.id];
      return next;
    });
    if (expandedDocId === doc.id) setExpandedDocId(null);
    void load();
  }

  const loadEnrollments = useCallback(async (opts?: { showLoading?: boolean }) => {
    const showLoading = opts?.showLoading !== false;
    if (showLoading) setEnrolledLoading(true);
    const { data: rows, error: rowErr } = await supabase
      .from("library_enrollments")
      .select("profile_id")
      .eq("library_id", libraryId);
    if (rowErr) {
      console.warn("library_enrollments list:", rowErr.message);
      setEnrolledRows([]);
      if (showLoading) setEnrolledLoading(false);
      return;
    }
    const ids = (rows || []).map((r) => r.profile_id).filter(Boolean);
    if (ids.length === 0) {
      setEnrolledRows([]);
      if (showLoading) setEnrolledLoading(false);
      return;
    }
    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids);
    if (profErr) {
      console.warn("profiles for enrollments:", profErr.message);
      setEnrolledRows([]);
      if (showLoading) setEnrolledLoading(false);
      return;
    }
    const list = (profs || []).map((p) => ({
      profile_id: p.id as string,
      email: (p.email as string | null) ?? null,
      full_name: (p.full_name as string | null) ?? null,
    }));
    list.sort((a, b) => (a.email || a.profile_id).localeCompare(b.email || b.profile_id));
    setEnrolledRows(list);
    if (showLoading) setEnrolledLoading(false);
  }, [libraryId]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data: libRow, error: libErr } = await supabase
      .from("knowledge_libraries")
      .select("id, owner_id, title, description, status, created_at")
      .eq("id", libraryId)
      .maybeSingle();
    if (libErr || !libRow) {
      setLoadError(libErr?.message || "Library not found.");
      setLib(null);
      setLoading(false);
      return;
    }
    if ((libRow as KnowledgeLibraryRow).owner_id !== profileId) {
      setLoadError("This library belongs to another user.");
      setLib(null);
      setLoading(false);
      return;
    }
    setLib(libRow as KnowledgeLibraryRow);

    const { count: dc } = await supabase
      .from("knowledge_documents")
      .select("id", { count: "exact", head: true })
      .eq("library_id", libraryId);
    setDocCount(dc ?? 0);

    const { count: cc } = await supabase
      .from("knowledge_chunks")
      .select("id", { count: "exact", head: true })
      .eq("library_id", libraryId);
    setChunkCount(cc ?? 0);

    const { count: ec } = await supabase
      .from("knowledge_chunks")
      .select("id", { count: "exact", head: true })
      .eq("library_id", libraryId)
      .not("embedding", "is", null);
    setEmbeddedCount(ec ?? 0);
    await loadEnrollments({ showLoading: false });
    await loadDocuments();
    setLoading(false);
  }, [libraryId, profileId, loadEnrollments, loadDocuments]);

  useEffect(() => {
    void load();
  }, [load]);

  async function ingestFile(file: File, titleOverride?: string) {
    setUploading(true);
    setUploadError(null);
    setUploadOk(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setUploadError("Not signed in.");
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append("library_id", libraryId);
    formData.append("file", file);
    const title = (titleOverride ?? uploadTitle).trim();
    if (title) formData.append("title", title);
    try {
      const res = await fetch("/api/coach/ingest", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const raw = await res.text();
      let json: { error?: string; chunk_count?: number; document_id?: string } = {};
      if (raw) {
        try {
          json = JSON.parse(raw) as typeof json;
        } catch {
          setUploadError(raw.slice(0, 200) || `Upload failed (${res.status}, not JSON).`);
          setUploading(false);
          return;
        }
      } else if (!res.ok) {
        setUploadError(`Upload failed (${res.status}, empty response). Is the dev server running the /api/coach/ingest route?`);
        setUploading(false);
        return;
      }
      if (!res.ok) {
        setUploadError(json.error || `Upload failed (${res.status})`);
        setUploading(false);
        return;
      }
      setUploadFile(null);
      setUploadTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadOk(
        json.chunk_count != null
          ? `Uploaded and indexed ${json.chunk_count} chunk(s).`
          : "Upload complete."
      );
      void load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    await ingestFile(uploadFile);
  }

  async function handlePasteSave(e: React.FormEvent) {
    e.preventDefault();
    const body = pasteBody.trim();
    if (!body) return;
    setSaving(true);
    setPasteError(null);
    setPasteOk(null);
    const chunks = chunkPastedText(body);
    if (chunks.length === 0) {
      setPasteError("Nothing to save after trimming.");
      setSaving(false);
      return;
    }

    const { data: doc, error: dErr } = await supabase
      .from("knowledge_documents")
      .insert({
        library_id: libraryId,
        title: pasteTitle.trim() || "Pasted notes",
        source_type: "paste",
        processing_status: "ready",
        metadata: { phase: 1 },
      })
      .select("id")
      .maybeSingle();

    if (dErr || !doc?.id) {
      setPasteError(dErr?.message || "Could not create document.");
      setSaving(false);
      return;
    }

    const chunkRows = chunks.map((content, idx) => ({
      document_id: doc.id,
      library_id: libraryId,
      chunk_index: idx,
      content,
      metadata: { source: "paste" },
    }));

    const { error: cErr } = await supabase.from("knowledge_chunks").insert(chunkRows);
    setSaving(false);
    if (cErr) {
      setPasteError(cErr.message);
      return;
    }
    setPasteBody("");
    setPasteOk(`Saved ${chunks.length} chunk(s) in one document.`);
    void load();
  }

  async function handleEmbedAll() {
    setEmbedding(true);
    setEmbedError(null);
    setEmbedOk(null);
    try {
      const { data: rows, error: qErr } = await supabase
        .from("knowledge_chunks")
        .select("id, content")
        .eq("library_id", libraryId)
        .is("embedding", null)
        .limit(400);
      if (qErr) throw qErr;
      if (!rows?.length) {
        setEmbedOk("All chunks already have embeddings (or no chunks yet).");
        setEmbedding(false);
        void load();
        return;
      }
      for (const row of rows) {
        const emb = await fetchEmbedding(row.content);
        const vecStr = `[${emb.join(",")}]`;
        const { error: rpcErr } = await supabase.rpc("set_knowledge_chunk_embedding", {
          p_chunk_id: row.id,
          p_embedding: vecStr,
        } as never);
        if (rpcErr) throw new Error(rpcErr.message);
      }
      setEmbedOk(`Embedded ${rows.length} chunk(s). Trainees need enrollments + active library to use RAG.`);
      void load();
    } catch (e) {
      setEmbedError(e instanceof Error ? e.message : String(e));
    } finally {
      setEmbedding(false);
    }
  }

  async function handleEnrollTrainee(e: React.FormEvent) {
    e.preventDefault();
    const em = traineeEmail.trim();
    if (!em) return;
    setEnrolling(true);
    setEnrollError(null);
    setEnrollOk(null);
    const { data: prof, error: pErr } = await supabase.from("profiles").select("id").eq("email", em).maybeSingle();
    if (pErr || !prof) {
      setEnrollError(pErr?.message || `No profile with email ${em}. They must sign up first.`);
      setEnrolling(false);
      return;
    }
    const { error: iErr } = await supabase.from("library_enrollments").insert({
      library_id: libraryId,
      profile_id: prof.id,
      assigned_by: profileId,
    });
    setEnrolling(false);
    if (iErr) {
      setEnrollError(iErr.message);
      return;
    }
    setTraineeEmail("");
    setEnrollOk(`Enrolled ${em}. They can pick this library on the practice home when the library is active.`);
    void loadEnrollments();
  }

  async function handleRemoveEnrollment(traineeProfileId: string) {
    if (!window.confirm("Remove this trainee’s access to this library?")) return;
    setEnrollError(null);
    setEnrollOk(null);
    const { error: dErr } = await supabase
      .from("library_enrollments")
      .delete()
      .eq("library_id", libraryId)
      .eq("profile_id", traineeProfileId);
    if (dErr) {
      setEnrollError(dErr.message);
      return;
    }
    setEnrollOk("Enrollment removed.");
    void loadEnrollments();
  }

  async function handleActivateLibrary() {
    if (!lib) return;
    setActivating(true);
    setActivateError(null);
    setActivateOk(null);
    const { error: uErr } = await supabase
      .from("knowledge_libraries")
      .update({ status: "active" })
      .eq("id", lib.id);
    setActivating(false);
    if (uErr) {
      setActivateError(uErr.message);
      return;
    }
    setLib({ ...lib, status: "active" });
    setActivateOk("Library is now active — trainees enrolled in this library can use it for RAG.");
  }

  async function handleDeleteLibrary() {
    if (!lib) return;
    if (!window.confirm(`Delete library "${lib.title}" and all its documents? This cannot be undone.`)) return;
    setDeleteError(null);
    const { error: delErr } = await supabase.from("knowledge_libraries").delete().eq("id", lib.id);
    if (delErr) {
      setDeleteError(delErr.message);
      return;
    }
    navigate(appPath("/coach/libraries"));
  }

  if (loading) {
    return <div style={{ color: "#6B7280" }}>Loading…</div>;
  }

  if (!lib) {
    return (
      <div>
        <p style={{ color: "#7A2E3A" }}>{loadError || "Not found."}</p>
        <Link to={appPath("/coach/libraries")} style={{ color: NAVY, fontWeight: 600 }}>
          ← Back to libraries
        </Link>
      </div>
    );
  }

  const materialsCount = docCount ?? documents.length;
  const studentsCount = enrolledRows.length;
  const hasMaterials = materialsCount > 0;
  const isActive = lib.status === "active";
  const setupStep = !hasMaterials ? 0 : !isActive ? 1 : 2;
  const statusLabel = isActive ? "Active" : lib.status === "archived" ? "Archived" : "Draft";

  const tabBtn = (key: "materials" | "students", label: string) => (
    <button
      type="button"
      onClick={() => setDetailTab(key)}
      style={{
        border: "none",
        background: "transparent",
        padding: "10px 2px 12px",
        marginRight: 22,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: detailTab === key ? 700 : 500,
        color: detailTab === key ? NAVY : "#6B7280",
        borderBottom: detailTab === key ? `2.5px solid ${GOLD}` : "2.5px solid transparent",
      }}
    >
      {label}
    </button>
  );

  const modeToggle = (
    <div
      style={{
        display: "inline-flex",
        background: "#F3F0EA",
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
      }}
    >
      {(["upload", "paste"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setAddMode(m)}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            background: addMode === m ? "#FFF4EC" : "transparent",
            color: addMode === m ? GOLD : "#6B7280",
          }}
        >
          {m === "upload" ? "Upload file" : "Paste text"}
        </button>
      ))}
    </div>
  );

  const uploadPanel = (
    <div>
      {modeToggle}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void ingestFile(file);
        }}
        style={{
          border: `1.5px dashed ${dragOver ? GOLD : "#E2DFD6"}`,
          borderRadius: 12,
          padding: "28px 20px",
          textAlign: "center",
          background: dragOver ? "#FFF4EC" : "#FFFCFA",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#FFF4EC",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Upload size={20} color={GOLD} aria-hidden />
        </div>
        <div style={{ fontSize: 14, color: NAVY, marginBottom: 4 }}>
          Drag a file here or{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "none",
              background: "none",
              color: GOLD,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              padding: 0,
            }}
          >
            choose a file
          </button>
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>PDF, Word, TXT, or Markdown</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void ingestFile(file);
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...btnPrimary,
            color: "#fff",
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? "Uploading…" : "Choose file"}
        </button>
      </div>
      {uploadOk && <div style={{ marginTop: 12, color: "#2F5233", fontSize: 13 }}>{uploadOk}</div>}
      {uploadError && <div style={{ marginTop: 12, color: "#7A2E3A", fontSize: 13 }}>{uploadError}</div>}
    </div>
  );

  const pastePanel = (
    <form onSubmit={handlePasteSave}>
      {modeToggle}
      <input
        style={{ ...inputStyle, marginBottom: 10 }}
        placeholder="Document title"
        value={pasteTitle}
        onChange={(e) => setPasteTitle(e.target.value)}
      />
      <textarea
        style={{ ...inputStyle, minHeight: 160, resize: "vertical", marginBottom: 12 }}
        placeholder="Paste your coaching notes here…"
        value={pasteBody}
        onChange={(e) => setPasteBody(e.target.value)}
        required
      />
      <button type="submit" disabled={saving} style={{ ...btnPrimary, color: "#fff", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Saving…" : "Save material"}
      </button>
      {pasteOk && <div style={{ marginTop: 12, color: "#2F5233", fontSize: 13 }}>{pasteOk}</div>}
      {pasteError && <div style={{ marginTop: 12, color: "#7A2E3A", fontSize: 13 }}>{pasteError}</div>}
    </form>
  );

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Link to={appPath("/coach/libraries")} style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>
          ← Libraries
        </Link>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}> / {lib.title}</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: 0, color: NAVY }}>{lib.title}</h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: GOLD,
                background: "#FFF4EC",
                padding: "3px 10px",
                borderRadius: 999,
              }}
            >
              {statusLabel}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6B7280" }}>
            {lib.description || "Coaching materials for your students."}
          </p>
        </div>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            aria-label="Library menu"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              ...btnSecondary,
              padding: 8,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "110%",
                background: "#fff",
                border: "1px solid #E2DFD6",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(10,22,40,0.08)",
                minWidth: 180,
                zIndex: 5,
                padding: 6,
              }}
            >
              {lib.status !== "active" && (
                <button
                  type="button"
                  disabled={activating}
                  onClick={() => {
                    setMenuOpen(false);
                    void handleActivateLibrary();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    color: NAVY,
                  }}
                >
                  {activating ? "Activating…" : "Activate library"}
                </button>
              )}
              <button
                type="button"
                disabled={embedding || (chunkCount ?? 0) === 0}
                onClick={() => {
                  setMenuOpen(false);
                  void handleEmbedAll();
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  color: NAVY,
                }}
              >
                {embedding ? "Embedding…" : "Embed missing chunks"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void handleDeleteLibrary();
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  color: "#7A2E3A",
                }}
              >
                Delete library
              </button>
            </div>
          )}
        </div>
      </div>

      {(activateOk || activateError || embedOk || embedError || deleteError) && (
        <div style={{ marginBottom: 12, fontSize: 13 }}>
          {activateOk && <div style={{ color: "#2F5233" }}>{activateOk}</div>}
          {activateError && <div style={{ color: "#7A2E3A" }}>{activateError}</div>}
          {embedOk && <div style={{ color: "#2F5233" }}>{embedOk}</div>}
          {embedError && <div style={{ color: "#7A2E3A" }}>{embedError}</div>}
          {deleteError && <div style={{ color: "#7A2E3A" }}>{deleteError}</div>}
        </div>
      )}

      <div style={{ borderBottom: "1px solid #E2DFD6", marginBottom: 20 }}>
        {tabBtn("materials", `Materials (${materialsCount})`)}
        {tabBtn("students", `Students (${studentsCount})`)}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(240px, 0.75fr)",
          gap: 16,
          alignItems: "start",
        }}
        className="coach-lib-detail-grid"
      >
        <div>
          {detailTab === "materials" ? (
            <>
              {!hasMaterials ? (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #E2DFD6",
                    borderRadius: 14,
                    padding: 22,
                  }}
                >
                  <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: "0 0 6px", color: NAVY }}>
                    Add your first material
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6B7280" }}>
                    Upload a document or paste your coaching notes.
                  </p>
                  {addMode === "upload" ? uploadPanel : pastePanel}
                </div>
              ) : (
                <>
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #E2DFD6",
                      borderRadius: 14,
                      padding: 18,
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4, color: NAVY }}>Add material</div>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>
                      Upload or paste more coaching content.
                    </p>
                    {addMode === "upload" ? uploadPanel : pastePanel}
                  </div>

                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #E2DFD6",
                      borderRadius: 14,
                      padding: 18,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 8, color: NAVY }}>
                      Sources · {chunkCount ?? 0} chunks
                      {embeddedCount != null ? ` · ${embeddedCount} embedded` : ""}
                    </div>
                    {docsActionError && (
                      <div style={{ marginBottom: 10, color: "#7A2E3A", fontSize: 13 }}>{docsActionError}</div>
                    )}
                    {docsLoading ? (
                      <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Loading documents…</p>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {documents.map((d) => {
                          const expanded = expandedDocId === d.id;
                          const chunks = docChunks[d.id];
                          const chunkLoad = chunksLoadingDocId === d.id;
                          return (
                            <li
                              key={d.id}
                              style={{
                                border: "1px solid #EFEBE3",
                                borderRadius: 10,
                                padding: 12,
                                marginBottom: 10,
                                background: CREAM,
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: NAVY }}>{d.title}</div>
                                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                                    {d.source_type === "upload" ? "Upload" : "Paste"} · {d.processing_status}
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  <button type="button" onClick={() => toggleDocExpand(d.id)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12 }}>
                                    {expanded ? "Hide" : "Chunks"}
                                  </button>
                                  {d.storage_path ? (
                                    <button type="button" onClick={() => void handleDownloadOriginalFile(d)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12 }}>
                                      Download
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    disabled={docBusyId === d.id}
                                    onClick={() => void handleDeleteDocumentRow(d)}
                                    style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12, color: "#7A2E3A" }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {expanded ? (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E4DC" }}>
                                  {chunkLoad ? (
                                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Loading…</p>
                                  ) : !chunks?.length ? (
                                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>No chunks.</p>
                                  ) : (
                                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                      {chunks.map((c, idx) => (
                                        <li key={c.id} style={{ marginBottom: 8, padding: 10, background: "#fff", borderRadius: 6, border: "1px solid #E8E4DC", fontSize: 12 }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <span style={{ fontWeight: 600 }}>
                                              Chunk {idx + 1}
                                              {c.embedding != null ? " · embedded" : " · no embedding"}
                                            </span>
                                            <button
                                              type="button"
                                              disabled={chunkBusyId === c.id}
                                              onClick={() => void handleDeleteChunk(c.id, d.id)}
                                              style={{ ...btnSecondary, padding: "2px 8px", fontSize: 11, color: "#7A2E3A" }}
                                            >
                                              Delete
                                            </button>
                                          </div>
                                          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", color: "#4B5563", maxHeight: 140, overflow: "auto" }}>
                                            {c.content}
                                          </pre>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div
              style={{
                background: "#fff",
                border: "1px solid #E2DFD6",
                borderRadius: 14,
                padding: 22,
              }}
            >
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 8px", color: NAVY }}>
                Enroll students
              </h2>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280", lineHeight: 1.45 }}>
                Students must already have an Arena account. Library should be <strong>active</strong> for practice RAG.
              </p>
              <form onSubmit={handleEnrollTrainee} style={{ marginBottom: 18 }}>
                <input
                  style={{ ...inputStyle, marginBottom: 10 }}
                  type="email"
                  placeholder="Trainee email"
                  value={traineeEmail}
                  onChange={(e) => setTraineeEmail(e.target.value)}
                />
                <button type="submit" disabled={enrolling} style={{ ...btnPrimary, color: "#fff", opacity: enrolling ? 0.7 : 1 }}>
                  {enrolling ? "Saving…" : "Enroll"}
                </button>
              </form>
              {enrollOk && <div style={{ marginBottom: 10, color: "#2F5233", fontSize: 13 }}>{enrollOk}</div>}
              {enrollError && <div style={{ marginBottom: 10, color: "#7A2E3A", fontSize: 13 }}>{enrollError}</div>}
              {enrolledLoading ? (
                <p style={{ fontSize: 13, color: "#6B7280" }}>Loading…</p>
              ) : enrolledRows.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>No students enrolled yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {enrolledRows.map((r) => (
                    <li
                      key={r.profile_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "10px 0",
                        borderBottom: "1px solid #F3F0E8",
                        fontSize: 13,
                      }}
                    >
                      <span>
                        <strong style={{ color: NAVY }}>{r.full_name || r.email || r.profile_id}</strong>
                        {r.full_name && r.email ? (
                          <span style={{ color: "#6B7280", marginLeft: 8 }}>{r.email}</span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRemoveEnrollment(r.profile_id)}
                        style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12, color: "#7A2E3A" }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <aside
          style={{
            background: "#FFF4EC",
            border: "1px solid #F0E4DC",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 14,
            }}
          >
            Library setup
          </div>
          {[
            { title: "Add materials", body: null as string | null },
            { title: "Activate library", body: null },
            { title: "Enroll students", body: null },
          ].map((step, i) => {
            const done = i < setupStep || (i === 0 && hasMaterials) || (i === 1 && isActive) || (i === 2 && studentsCount > 0 && isActive && hasMaterials);
            const current = i === setupStep;
            return (
              <div
                key={step.title}
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 14,
                  padding: current ? "10px 10px" : "4px 0",
                  borderRadius: 10,
                  background: current ? "rgba(255,255,255,0.65)" : "transparent",
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: done ? "#2F5233" : current ? GOLD : "#fff",
                    color: done || current ? "#fff" : "#9CA3AF",
                    border: done || current ? "none" : "1px solid #E2DFD6",
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div>
                  <div style={{ fontWeight: current ? 700 : 600, fontSize: 14, color: NAVY }}>{step.title}</div>
                </div>
              </div>
            );
          })}
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6B7280", lineHeight: 1.45 }}>
            Arena prepares your materials for practice after you add them.
          </p>
          {hasMaterials && !isActive && (
            <button
              type="button"
              disabled={activating}
              onClick={() => void handleActivateLibrary()}
              style={{ ...btnPrimary, color: "#fff", width: "100%", marginTop: 14, opacity: activating ? 0.7 : 1 }}
            >
              {activating ? "Activating…" : "Activate library"}
            </button>
          )}
          {isActive && (
            <button
              type="button"
              onClick={() => setDetailTab("students")}
              style={{ ...btnSecondary, width: "100%", marginTop: 14, background: "#fff" }}
            >
              Go to students
            </button>
          )}
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .coach-lib-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CoachArea({ profileId, fullName, onSignOut }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [coachProfile, setCoachProfile] = useState<CoachProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadCoachProfile = useCallback(async () => {
    setProfileLoading(true);
    const full = await supabase
      .from("coach_profiles")
      .select(COACH_PROFILE_SELECT)
      .eq("profile_id", profileId)
      .maybeSingle();
    let raw: Record<string, unknown> | null = full.data as Record<string, unknown> | null;
    if (full.error) {
      // Migration not applied yet — fall back to base columns.
      console.warn("coach_profiles (full):", full.error.message);
      const fallback = await supabase
        .from("coach_profiles")
        .select("profile_id, display_name, bio, specialties, created_at, updated_at")
        .eq("profile_id", profileId)
        .maybeSingle();
      raw = (fallback.data as Record<string, unknown> | null) || null;
      if (fallback.error) console.warn("coach_profiles:", fallback.error.message);
    }
    setCoachProfile(normalizeCoachProfile(raw));
    setProfileLoading(false);
  }, [profileId]);

  useEffect(() => {
    void loadCoachProfile();
  }, [loadCoachProfile]);

  const profileReady = isCoachProfileComplete(coachProfile);

  useEffect(() => {
    if (profileLoading || profileReady) return;
    const onSetupRoute =
      matchPath({ path: `${APP_BASE}/coach`, end: true }, path) ||
      matchPath({ path: `${APP_BASE}/coach/profile`, end: true }, path);
    if (!onSetupRoute) {
      navigate(appPath("/coach"), { replace: true });
    }
  }, [profileLoading, profileReady, path, navigate]);

  const detail = matchPath({ path: `${APP_BASE}/coach/libraries/:libraryId`, end: true }, path);
  const onLibraries = Boolean(
    detail || matchPath({ path: `${APP_BASE}/coach/libraries`, end: true }, path)
  );
  const onStudents = Boolean(matchPath({ path: `${APP_BASE}/coach/students`, end: true }, path));
  const onProfile = Boolean(matchPath({ path: `${APP_BASE}/coach/profile`, end: true }, path));
  const navActive: CoachNavKey = !profileReady
    ? "setup"
    : onProfile
      ? "profile"
      : onStudents
        ? "students"
        : onLibraries
          ? "libraries"
          : "home";

  const breadcrumb = !profileReady
    ? "Profile setup"
    : onProfile
      ? "Profile"
      : onStudents
        ? "Students"
        : detail
          ? "Library"
          : onLibraries
            ? "Libraries"
            : "Dashboard";

  let body: React.ReactNode;
  if (profileLoading) {
    body = <div style={{ color: "#6B7280" }}>Loading coach profile…</div>;
  } else if (!profileReady) {
    body = (
      <CoachProfileForm
        profileId={profileId}
        fullName={fullName}
        initial={coachProfile}
        mode="setup"
        onSaved={(row) => setCoachProfile(row)}
        onContinue={(row) => {
          setCoachProfile(row);
          navigate(appPath("/coach"), { replace: true });
        }}
      />
    );
  } else if (detail?.params?.libraryId) {
    body = <LibraryDetail profileId={profileId} libraryId={detail.params.libraryId} />;
  } else if (matchPath({ path: `${APP_BASE}/coach/libraries`, end: true }, path)) {
    body = <LibrariesList profileId={profileId} />;
  } else if (onStudents) {
    body = <CoachStudents profileId={profileId} />;
  } else if (onProfile) {
    body = (
      <CoachProfileForm
        profileId={profileId}
        fullName={fullName}
        initial={coachProfile}
        mode="edit"
        onSaved={(row) => setCoachProfile(row)}
      />
    );
  } else {
    body = <CoachDashboard profileId={profileId} coachProfile={coachProfile!} />;
  }

  return (
    <CoachShell
      active={navActive}
      onSignOut={onSignOut}
      setupOnly={!profileReady && !profileLoading}
      breadcrumb={profileLoading ? undefined : breadcrumb}
    >
      {body}
    </CoachShell>
  );
}
