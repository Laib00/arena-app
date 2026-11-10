# Arena — Technology stack (Coach & RAG)

**Status:** Reference for the shipped coach/RAG feature set on `dev`.  
**Audience:** Engineering, product, and operations.  
**Related:** [`COACH_RAG_PLAN.md`](./COACH_RAG_PLAN.md) (phases), [`DATABASE_RAG_AND_COACH.md`](./DATABASE_RAG_AND_COACH.md) (data model).

---

## 1. Summary

Arena’s coach layer lets coaches maintain **knowledge libraries** (paste + file upload), **enroll trainees**, and power **retrieval-augmented generation (RAG)** in trainee practice chat and in post-session debrief. The stack is intentionally small: **React** in the browser, **Supabase** for auth/data/storage/vectors, **Node** server routes for secrets and heavy file work, and **Google Gemini** for chat and embeddings.

---

## 2. Architecture (high level)

```mermaid
flowchart LR
  subgraph browser [Browser]
    UI[React app]
  end
  subgraph server [Server Node]
    Gemini[/api/gemini]
    Embed[/api/embeddings]
    Ingest[/api/coach/ingest]
  end
  subgraph supabase [Supabase]
    Auth[Auth]
    PG[(Postgres + pgvector)]
    Store[Storage coach-documents]
  end
  subgraph google [Google AI]
    Chat[Generative Language API]
    Vec[Embedding API]
  end
  UI --> Auth
  UI --> PG
  UI --> Store
  UI --> Gemini
  UI --> Embed
  UI --> Ingest
  Gemini --> Chat
  Embed --> Vec
  Ingest --> Store
  Ingest --> PG
  Embed --> PG
```

| Layer | Responsibility |
|--------|----------------|
| **Browser** | UI, Supabase client (JWT), file pickers; never holds Gemini API key. |
| **Server** | Gemini proxy, embeddings, multipart ingest (PDF/DOCX extraction). |
| **Supabase** | Users, RLS, libraries/chunks/enrollments, file bucket, vector search RPCs. |
| **Gemini** | Roleplay/debrief models; `text-embedding-004` (768 dims) for RAG. |

---

## 3. Application & UI

| Technology | Version (repo) | Use in Arena |
|------------|----------------|--------------|
| **React** | 18.x | Trainee practice, coach workspace, auth screens. |
| **TypeScript** | 5.x / 7.x | Typed app under `src/`. |
| **Vite** | 5.x | Dev server, production build (`npm run build` → `dist/`). |
| **React Router** | 7.x | Routes including `/signup/coach`, `/dashboard/coach/*`. |
| **lucide-react** | 0.383.x | Icons in coach shell (dashboard, libraries, students, profile). |

**Coach UI modules (representative):**

| Area | Location |
|------|-----------|
| Coach shell & routing | `src/coach/CoachArea.tsx`, `CoachShell.tsx` |
| Dashboard / students / profile | `src/coach/CoachDashboard.tsx`, `CoachStudents.tsx`, `CoachProfileForm.tsx` |
| Libraries, upload, embed, enroll, sources | `src/coach/CoachArea.tsx` (`LibraryDetail`) |
| Trainee library picker & chat RAG | `src/App.tsx`, `src/pages/SetupScreen.tsx`, `src/rag.ts` |
| Debrief playbook RAG | `src/SessionDebrief.tsx`, `src/rag.ts` |

---

## 4. Authentication & database

| Technology | Use |
|------------|-----|
| **Supabase Auth** | Email and Google sign-in; coach signup sets `user_metadata.account_type = coach`. |
| **Supabase Postgres** | All app and coach/RAG tables; `profiles.role` = `trainee` \| `coach` \| `manager`. |
| **Supabase JS** (`@supabase/supabase-js`) | Browser client with anon key; **Row Level Security (RLS)** enforces access. |
| **pgvector** (`extensions.vector`) | Column `knowledge_chunks.embedding` — **768 dimensions**. |
| **SQL migrations** | See §8. |

**Security model (short):**

- **`VITE_SUPABASE_ANON_KEY`** is public by design; RLS limits reads/writes.
- **`GEMINI_API_KEY`** and any service-role usage stay **server-side only**.
- Storage bucket **`coach-documents`** is private; paths scoped by `auth.uid()` (see phase 2 SQL).

---

## 5. Supabase Storage

| Item | Value |
|------|--------|
| **Bucket** | `coach-documents` |
| **Typical paths** | `{coach_user_id}/{library_id}/{timestamp}-{filename}` for uploads; `{coach_user_id}/avatar/...` for coach avatars |
| **Migration** | [`supabase/phase2_coach_storage.sql`](../supabase/phase2_coach_storage.sql) |
| **Coach profile avatars** | [`supabase/add_coach_profile_details.sql`](../supabase/add_coach_profile_details.sql) (read policy for `avatar` folder) |

Uploads are stored here; **searchable text** lives in **`knowledge_chunks`**, not only in the file binary.

---

## 6. Document ingest (text extraction & chunking)

### 6.1 Supported formats (v1)

| Format | Library / method | Where it runs |
|--------|------------------|---------------|
| **Paste / plain text** | Browser → `chunkPaste.ts` | Client inserts chunks directly (no Storage file). |
| **`.txt`, `.md`** | UTF-8 decode | `server/coachIngest.mjs` |
| **`.pdf`** | **`pdf-parse`** | `server/coachIngest.mjs` |
| **`.docx`** | **`mammoth`** (`extractRawText`) | `server/coachIngest.mjs` |

### 6.2 Multipart upload

| Library | Role |
|---------|------|
| **`formidable`** | Parse `multipart/form-data` on `POST /api/coach/ingest`. |

### 6.3 Chunking

| Approach | Details |
|----------|---------|
| **Custom splitter** | `src/coach/chunkPaste.ts` (paste); `server/chunkText.mjs` (ingest) — character limits with overlap; no LangChain in v1. |

### 6.4 Ingest flow

1. Coach uploads via UI → **`POST /api/coach/ingest`** with `Authorization: Bearer <access_token>`.
2. Server verifies user owns the library.
3. File → **Storage**; row in **`knowledge_documents`** (`processing_status` → `ready` or `failed`).
4. Extracted text → rows in **`knowledge_chunks`** (`embedding` null until Phase 3 embed step).

**Local development:** route wired in [`vite.config.ts`](../vite.config.ts) → [`server/coachIngest.mjs`](../server/coachIngest.mjs).  
**Production:** same handler must be mounted on the host Node app (e.g. VPS `server.mjs` behind nginx `/api/`).

---

## 7. Embeddings & vector search (RAG)

### 7.1 Embedding provider

| Setting | Default | Notes |
|---------|---------|--------|
| **Model** | `text-embedding-004` | Env: `GEMINI_EMBEDDING_MODEL` |
| **Dimensions** | **768** | Must match `knowledge_chunks.embedding` in DB |
| **API key** | `GEMINI_API_KEY` | Same key family as chat; separate HTTP call |

**Server route:** [`api/embeddings.js`](../api/embeddings.js) → `POST /api/embeddings` body `{ "text": "..." }` → `{ "embedding": number[], "dimensions": 768 }`.

**Client helper:** [`src/rag.ts`](../src/rag.ts) — `fetchEmbedding`, `retrieveRagChunks`, `logConversationRetrievals`.

### 7.2 When embeddings are written

| Trigger | Behaviour |
|---------|-----------|
| **Coach UI — “Embed all missing chunks”** | Loops chunks with `embedding IS NULL`, calls `/api/embeddings`, RPC `set_knowledge_chunk_embedding`. |
| **Automatic on upload** | Not in v1 (manual batch by design). |

### 7.3 Search

| Piece | Role |
|-------|------|
| **RPC `match_knowledge_chunks`** | Cosine similarity (`<=>`), filtered by `library_id`; access via RLS (owner, enrolled trainee, manager). |
| **Migration** | [`supabase/phase3_rag.sql`](../supabase/phase3_rag.sql) |

### 7.4 Where RAG is used in the product

| Surface | Purpose |
|---------|---------|
| **Live roleplay chat** | Optional trainee library picker → chunks prepended to **system prompt** for the AI client; `conversation_retrievals` logged. |
| **Session debrief — AI suggestions** | “Coach playbook” retrieval from **enrolled** library (even if live chat used no library); document titles attached when possible. |

---

## 8. Server API routes

| Method & path | Implementation | Called by |
|---------------|----------------|-----------|
| `POST /api/gemini` | [`api/gemini.js`](../api/gemini.js) | Trainee chat, debrief, evaluation |
| `POST /api/embeddings` | [`api/embeddings.js`](../api/embeddings.js) | Embed-all, RAG retrieval |
| `POST /api/coach/ingest` | [`server/coachIngest.mjs`](../server/coachIngest.mjs) | Coach file upload |

### 8.1 Local development

| Command | APIs available |
|---------|----------------|
| **`npm run dev`** | Vite middleware registers the three routes above; loads env from [`.env`](../.env.example). |

Plain Vite **without** these plugins does **not** expose `/api/*`.

### 8.2 Production (Arena VPS pattern)

| Component | Typical setup |
|-----------|----------------|
| **Static UI** | `npm run build` → nginx serves `dist/` |
| **API** | **PM2** process (e.g. `arena-api`) running [`server.mjs`](../server.mjs) on the VPS (not in all repo snapshots; lives on server) |
| **Reverse proxy** | nginx `location /api/` → Node listener |
| **Env** | `GEMINI_API_KEY`, `GEMINI_MODEL`, Supabase URL/anon for ingest; set in PM2 or `.env` on server |

**Ops checklist:** Confirm production `server.mjs` registers **`/api/embeddings`** and **`/api/coach/ingest`** before relying on RAG or upload outside local dev.

### 8.3 Alternative: Vercel

Repo layout (`api/*.js` + [`vercel.json`](../vercel.json)) supports serverless functions on Vercel; env vars in project settings. Team production path today is **VPS + PM2**.

---

## 9. Environment variables

| Variable | Required | Consumer |
|----------|----------|----------|
| `VITE_SUPABASE_URL` | Yes | Browser |
| `VITE_SUPABASE_ANON_KEY` | Yes | Browser |
| `GEMINI_API_KEY` | Yes (chat + RAG) | Server only |
| `GEMINI_MODEL` | Optional | Chat (`gemini-3.6-flash` default in app) |
| `GEMINI_EMBEDDING_MODEL` | Optional | Embeddings (`text-embedding-004`) |
| `VITE_ENABLE_EDUCATION_PACK` | Optional | Feature flag |

Template: [`.env.example`](../.env.example). **Never commit `.env`**.

---

## 10. NPM dependencies (coach/RAG–relevant)

| Package | Role |
|---------|------|
| `@supabase/supabase-js` | Auth, DB, Storage, RPC |
| `pdf-parse` | PDF text extraction |
| `mammoth` | DOCX text extraction |
| `formidable` | Multipart ingest |

Full list: [`package.json`](../package.json).

---

## 11. Database scripts (run order)

Run in **Supabase SQL Editor** on the target project (re-run only where noted as safe).

| Order | Script | Purpose |
|-------|--------|---------|
| 1 | [`supabase/add_rag_and_coach.sql`](../supabase/add_rag_and_coach.sql) | Tables, pgvector, RLS baseline |
| 2 | [`supabase/phase0_coach_signup.sql`](../supabase/phase0_coach_signup.sql) | Coach role on signup |
| 3 | [`supabase/phase2_coach_storage.sql`](../supabase/phase2_coach_storage.sql) | Storage bucket + policies |
| 4 | [`supabase/phase3_rag.sql`](../supabase/phase3_rag.sql) | `match_knowledge_chunks`, `set_knowledge_chunk_embedding` |
| 5 | [`supabase/add_coach_profile_details.sql`](../supabase/add_coach_profile_details.sql) | Extended `coach_profiles` + avatar policy |

---

## 12. Explicitly out of scope (v1)

| Item | Notes |
|------|--------|
| External vector DB (Pinecone, etc.) | Vectors in Postgres only. |
| LangChain / LlamaIndex | Custom chunking only. |
| Background job queue for embed/ingest | Synchronous API + coach button. |
| `training_assignments` UI | Schema exists; Phase 4 not shipped in app. |
| Service role key in browser | Forbidden. |

---

## 13. References (code & docs)

| Document / path | Content |
|-----------------|---------|
| [`docs/COACH_RAG_PLAN.md`](./COACH_RAG_PLAN.md) | Phased delivery checklist |
| [`docs/DATABASE_RAG_AND_COACH.md`](./DATABASE_RAG_AND_COACH.md) | Entity and table design |
| [`src/rag.ts`](../src/rag.ts) | RAG client utilities |
| [`server/coachIngest.mjs`](../server/coachIngest.mjs) | Upload pipeline |

---

*Last updated to reflect coach workspace, debrief RAG, and VPS deployment notes. Revise this file when new providers or routes are added.*
