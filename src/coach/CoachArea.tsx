import React, { useCallback, useEffect, useState } from "react";
import { Link, matchPath, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { APP_BASE, appPath } from "../routes";
import { NAVY, GOLD, CREAM, inputStyle } from "../theme";
import { chunkPastedText } from "./chunkPaste";
import { fetchEmbedding } from "../rag";

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

const shellWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: CREAM,
  color: NAVY,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "24px 20px 48px",
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

function CoachNav({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 20px",
        borderBottom: "1px solid #E2DFD6",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link
          to={appPath("/coach")}
          style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: NAVY, textDecoration: "none" }}
        >
          Arena
        </Link>
        <nav style={{ display: "flex", gap: 14, fontSize: 14 }}>
          <Link to={appPath("/coach")} style={{ color: "#6B7280", textDecoration: "none" }}>
            Home
          </Link>
          <Link to={appPath("/coach/libraries")} style={{ color: NAVY, fontWeight: 600, textDecoration: "none" }}>
            Libraries
          </Link>
        </nav>
      </div>
      <button type="button" onClick={onSignOut} style={btnSecondary}>
        Sign out
      </button>
    </header>
  );
}

function CoachHome({ fullName }: { fullName?: string | null }) {
  return (
    <div style={container}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, margin: "8px 0 8px" }}>Coach dashboard</h1>
      {fullName ? (
        <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 20px" }}>Signed in as {fullName}</p>
      ) : null}
      <p style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
        Create <strong>knowledge libraries</strong> — collections of text that will power RAG for your trainees in a later
        phase. For now you can add a library and paste content to verify the pipeline.
      </p>
      <Link to={appPath("/coach/libraries")} style={{ ...btnPrimary, display: "inline-block", textDecoration: "none" }}>
        Manage libraries
      </Link>
    </div>
  );
}

function LibrariesList({ profileId }: { profileId: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<KnowledgeLibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error: insErr } = await supabase
      .from("knowledge_libraries")
      .insert({
        owner_id: profileId,
        title: title.trim(),
        description: description.trim() || null,
        status: "draft",
      })
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setTitle("");
    setDescription("");
    if (data?.id) navigate(appPath(`/coach/libraries/${data.id}`));
    else void load();
  }

  return (
    <div style={container}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, margin: "8px 0 16px" }}>Knowledge libraries</h1>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
        Each library is a bucket for documents and (later) embeddings. Trainees get access via enrollments in a later
        phase.
      </p>

      <form
        onSubmit={handleCreate}
        style={{
          background: "#fff",
          border: "1px solid #E2DFD6",
          borderRadius: 10,
          padding: 16,
          marginBottom: 28,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>New library</div>
        <input
          style={{ ...inputStyle, marginBottom: 10 }}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          style={{ ...inputStyle, minHeight: 72, resize: "vertical", marginBottom: 12 }}
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Creating…" : "Create library"}
        </button>
        {error && <div style={{ marginTop: 12, color: "#7A2E3A", fontSize: 13 }}>{error}</div>}
      </form>

      {loading ? (
        <p style={{ color: "#6B7280" }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#6B7280" }}>No libraries yet. Create one above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((r) => (
            <li
              key={r.id}
              style={{
                background: "#fff",
                border: "1px solid #E2DFD6",
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Link
                to={appPath(`/coach/libraries/${r.id}`)}
                style={{
                  display: "block",
                  padding: 14,
                  color: NAVY,
                  textDecoration: "none",
                }}
              >
                <div style={{ fontWeight: 700 }}>{r.title}</div>
                {r.description ? (
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{r.description}</div>
                ) : null}
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
                  Status: {r.status} · {new Date(r.created_at).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
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

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
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
    formData.append("file", uploadFile);
    if (uploadTitle.trim()) formData.append("title", uploadTitle.trim());
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
      setUploadOk(
        json.chunk_count != null
          ? `Uploaded and indexed ${json.chunk_count} chunk(s). Document id: ${json.document_id ?? "—"}.`
          : "Upload complete."
      );
      void load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
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
    return (
      <div style={container}>
        <p style={{ color: "#6B7280" }}>Loading…</p>
      </div>
    );
  }

  if (!lib) {
    return (
      <div style={container}>
        <p style={{ color: "#7A2E3A" }}>{loadError || "Not found."}</p>
        <Link to={appPath("/coach/libraries")} style={{ color: NAVY, fontWeight: 600 }}>
          ← Back to libraries
        </Link>
      </div>
    );
  }

  return (
    <div style={container}>
      <Link to={appPath("/coach/libraries")} style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>
        ← Libraries
      </Link>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, margin: "12px 0 8px" }}>{lib.title}</h1>
      {lib.description ? <p style={{ color: "#6B7280", marginBottom: 12 }}>{lib.description}</p> : null}
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
        Documents: {docCount ?? "—"} · Chunks: {chunkCount ?? "—"}
        {embeddedCount != null && chunkCount != null ? (
          <> · With embeddings: {embeddedCount}</>
        ) : null}
      </p>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
        Status: <strong>{lib.status}</strong>
        {lib.status !== "active" ? (
          <>
            {" "}
            <button
              type="button"
              disabled={activating}
              onClick={() => void handleActivateLibrary()}
              style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12, marginLeft: 8 }}
            >
              {activating ? "…" : "Set active for trainees"}
            </button>
          </>
        ) : null}
      </p>
      {activateOk && <div style={{ fontSize: 13, color: "#2F5233", marginBottom: 12 }}>{activateOk}</div>}
      {activateError && <div style={{ fontSize: 13, color: "#7A2E3A", marginBottom: 12 }}>{activateError}</div>}

      <div
        style={{
          background: "#fff",
          border: "1px solid #E2DFD6",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Phase 3 — embeddings</div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
          Compute vectors for chunks without embeddings (uses <code style={{ fontSize: 12 }}>/api/embeddings</code> +
          Gemini). Required before RAG search works.
        </p>
        <button type="button" disabled={embedding || (chunkCount ?? 0) === 0} onClick={() => void handleEmbedAll()} style={{ ...btnPrimary, opacity: embedding ? 0.7 : 1 }}>
          {embedding ? "Embedding…" : "Embed all missing chunks"}
        </button>
        {embedOk && <div style={{ marginTop: 12, color: "#2F5233", fontSize: 13 }}>{embedOk}</div>}
        {embedError && <div style={{ marginTop: 12, color: "#7A2E3A", fontSize: 13 }}>{embedError}</div>}
      </div>

      <form
        onSubmit={handleEnrollTrainee}
        style={{
          background: "#fff",
          border: "1px solid #E2DFD6",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Enroll a trainee</div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
          Adds a row to <code style={{ fontSize: 12 }}>library_enrollments</code> so they can retrieve this library in practice chat (library must be <strong>active</strong>).
        </p>
        <input
          style={{ ...inputStyle, marginBottom: 10 }}
          type="email"
          placeholder="Trainee email"
          value={traineeEmail}
          onChange={(e) => setTraineeEmail(e.target.value)}
        />
        <button type="submit" disabled={enrolling} style={{ ...btnSecondary, opacity: enrolling ? 0.7 : 1 }}>
          {enrolling ? "Saving…" : "Enroll"}
        </button>
        {enrollOk && <div style={{ marginTop: 12, color: "#2F5233", fontSize: 13 }}>{enrollOk}</div>}
        {enrollError && <div style={{ marginTop: 12, color: "#7A2E3A", fontSize: 13 }}>{enrollError}</div>}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #EFEBE3" }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: NAVY }}>Enrolled trainees</div>
          {enrolledLoading ? (
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Loading…</p>
          ) : enrolledRows.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>No enrollments yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {enrolledRows.map((r) => (
                <li
                  key={r.profile_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid #F3F0E8",
                    fontSize: 13,
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: NAVY }}>{r.email || r.profile_id}</span>
                    {r.full_name ? (
                      <span style={{ color: "#6B7280", marginLeft: 8 }}>{r.full_name}</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveEnrollment(r.profile_id)}
                    style={{
                      ...btnSecondary,
                      padding: "4px 10px",
                      fontSize: 12,
                      flexShrink: 0,
                      color: "#7A2E3A",
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      <div
        style={{
          background: "#fff",
          border: "1px solid #E2DFD6",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Sources in this library</div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
          Every paste and upload becomes a <strong>document</strong> with <strong>chunks</strong>. Download the original file (uploads) or a text export of chunks; delete one chunk or remove a whole document.
        </p>
        {docsActionError && (
          <div style={{ marginBottom: 10, color: "#7A2E3A", fontSize: 13 }}>{docsActionError}</div>
        )}
        {docsLoading ? (
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Loading documents…</p>
        ) : documents.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>No documents yet. Paste or upload below.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {documents.map((d) => {
              const meta = d.metadata;
              const origName =
                meta && typeof meta === "object" && meta !== null && "original_filename" in meta
                  ? String((meta as { original_filename?: unknown }).original_filename || "")
                  : "";
              const expanded = expandedDocId === d.id;
              const chunks = docChunks[d.id];
              const chunkLoad = chunksLoadingDocId === d.id;
              return (
                <li
                  key={d.id}
                  style={{
                    border: "1px solid #EFEBE3",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 10,
                    background: CREAM,
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: NAVY }}>{d.title}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                        {d.source_type === "upload" ? "Upload" : d.source_type === "paste" ? "Paste" : d.source_type}
                        {" · "}
                        {d.processing_status}
                        {d.error_message ? ` — ${d.error_message.slice(0, 120)}${d.error_message.length > 120 ? "…" : ""}` : ""}
                        {" · "}
                        {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => toggleDocExpand(d.id)}
                        style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12 }}
                      >
                        {expanded ? "Hide chunks" : "View chunks"}
                      </button>
                      {d.storage_path ? (
                        <button
                          type="button"
                          onClick={() => void handleDownloadOriginalFile(d)}
                          style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12 }}
                        >
                          {origName ? `Download ${origName.slice(0, 24)}${origName.length > 24 ? "…" : ""}` : "Download original"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleDownloadChunksAsText(d)}
                        style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12 }}
                      >
                        Download chunks (.txt)
                      </button>
                      <button
                        type="button"
                        disabled={docBusyId === d.id}
                        onClick={() => void handleDeleteDocumentRow(d)}
                        style={{
                          ...btnSecondary,
                          padding: "4px 10px",
                          fontSize: 12,
                          color: "#7A2E3A",
                          opacity: docBusyId === d.id ? 0.6 : 1,
                        }}
                      >
                        {docBusyId === d.id ? "…" : "Delete document"}
                      </button>
                    </div>
                  </div>
                  {expanded ? (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E4DC" }}>
                      {chunkLoad ? (
                        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Loading chunks…</p>
                      ) : !chunks?.length ? (
                        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>No chunks (failed ingest or empty).</p>
                      ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {chunks.map((c, idx) => (
                            <li
                              key={c.id}
                              style={{
                                marginBottom: 10,
                                padding: 10,
                                background: "#fff",
                                borderRadius: 6,
                                border: "1px solid #E8E4DC",
                                fontSize: 12,
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ fontWeight: 600, color: NAVY }}>
                                  Chunk {idx + 1}
                                  {c.embedding != null ? " · embedded" : " · no embedding"}
                                </span>
                                <button
                                  type="button"
                                  disabled={chunkBusyId === c.id}
                                  onClick={() => void handleDeleteChunk(c.id, d.id)}
                                  style={{
                                    ...btnSecondary,
                                    padding: "2px 8px",
                                    fontSize: 11,
                                    color: "#7A2E3A",
                                    opacity: chunkBusyId === c.id ? 0.6 : 1,
                                  }}
                                >
                                  {chunkBusyId === c.id ? "…" : "Delete chunk"}
                                </button>
                              </div>
                              <pre
                                style={{
                                  margin: 0,
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                  fontFamily: "inherit",
                                  color: "#4B5563",
                                  maxHeight: 160,
                                  overflow: "auto",
                                }}
                              >
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

      <form
        onSubmit={handleFileUpload}
        style={{
          background: "#fff",
          border: "1px solid #E2DFD6",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Upload file (Phase 2)</div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
          PDF, plain text, Markdown, or Word (.docx). File goes to Storage under{" "}
          <code style={{ fontSize: 12 }}>coach-documents/{`{your id}/{library id}/...`}</code>, then text is extracted and
          chunked (no embeddings yet — Phase 3). Uses local dev API{" "}
          <code style={{ fontSize: 12 }}>POST /api/coach/ingest</code> when you run <code style={{ fontSize: 12 }}>npm run
          dev</code>.
        </p>
        <input
          style={{ ...inputStyle, marginBottom: 10 }}
          placeholder="Title (optional — defaults to filename)"
          value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
        />
        <input
          type="file"
          accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ marginBottom: 12, fontSize: 14 }}
          onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={uploading || !uploadFile} style={{ ...btnPrimary, opacity: uploading || !uploadFile ? 0.6 : 1 }}>
          {uploading ? "Uploading…" : "Upload & ingest"}
        </button>
        {uploadOk && <div style={{ marginTop: 12, color: "#2F5233", fontSize: 13 }}>{uploadOk}</div>}
        {uploadError && <div style={{ marginTop: 12, color: "#7A2E3A", fontSize: 13 }}>{uploadError}</div>}
      </form>

      <form
        onSubmit={handlePasteSave}
        style={{
          background: "#fff",
          border: "1px solid #E2DFD6",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Paste text (Phase 1)</div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
          Text is split into chunks and stored in <code style={{ fontSize: 12 }}>knowledge_chunks</code>. Embeddings
          come in Phase 3.
        </p>
        <input
          style={{ ...inputStyle, marginBottom: 10 }}
          placeholder="Document title"
          value={pasteTitle}
          onChange={(e) => setPasteTitle(e.target.value)}
        />
        <textarea
          style={{ ...inputStyle, minHeight: 160, resize: "vertical", marginBottom: 12 }}
          placeholder="Paste knowledge base text here…"
          value={pasteBody}
          onChange={(e) => setPasteBody(e.target.value)}
          required
        />
        <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save as chunked document"}
        </button>
        {pasteOk && <div style={{ marginTop: 12, color: "#2F5233", fontSize: 13 }}>{pasteOk}</div>}
        {pasteError && <div style={{ marginTop: 12, color: "#7A2E3A", fontSize: 13 }}>{pasteError}</div>}
      </form>

      {deleteError && <div style={{ marginBottom: 10, color: "#7A2E3A", fontSize: 13 }}>{deleteError}</div>}
      <button type="button" onClick={handleDeleteLibrary} style={{ ...btnSecondary, color: "#7A2E3A", borderColor: "#E2DFD6" }}>
        Delete this library
      </button>
    </div>
  );
}

export default function CoachArea({ profileId, fullName, onSignOut }: Props) {
  const location = useLocation();
  const path = location.pathname;

  const detail = matchPath({ path: `${APP_BASE}/coach/libraries/:libraryId`, end: true }, path);

  let body: React.ReactNode;
  if (detail?.params?.libraryId) {
    body = <LibraryDetail profileId={profileId} libraryId={detail.params.libraryId} />;
  } else if (matchPath({ path: `${APP_BASE}/coach/libraries`, end: true }, path)) {
    body = <LibrariesList profileId={profileId} />;
  } else {
    body = <CoachHome fullName={fullName} />;
  }

  return (
    <div style={shellWrap}>
      <CoachNav onSignOut={onSignOut} />
      {body}
    </div>
  );
}
