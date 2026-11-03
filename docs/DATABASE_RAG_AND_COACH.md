# Arena — Database design: RAG & trainer/coach layer

**Purpose:** Plan new Supabase tables for human trainers/coaches and retrieval-augmented practice (RAG), without rewriting existing session storage.

**Related:** Current app tables are in [`supabase/schema.sql`](../supabase/schema.sql). **Migration:** [`supabase/add_rag_and_coach.sql`](../supabase/add_rag_and_coach.sql) — run once in Supabase SQL Editor on existing projects. App UI for coach/RAG is not wired yet.

---

## 1. Design principles (minimize future amendments)

1. **Separate “who” from “what they uploaded”** — Trainers own **libraries**, not ad‑hoc files on `profiles`.
2. **Document → chunk → embedding** — RAG needs a pipeline; do not store embeddings on `messages` or `conversations` rows directly.
3. **Scope with nullable FKs + enums** — `practice_pack`, `organization_id` optional so solo Property trials work now; schools/agencies plug in later.
4. **`metadata jsonb`** on libraries, documents, and chunks for tags, page numbers, persona hints without new columns every week.
5. **Log what was retrieved** per session — debugging, coach review, and evidence for “what the AI saw.”
6. **Extend roles carefully** — Today: `trainee` | `manager`. Add **`coach`** (external trainer) instead of overloading one role for everything.

---

## 2. What stays the same

Keep using:

| Existing table | Role |
|----------------|------|
| `profiles` | Accounts, XP, `agent_profile`, `practice_pack` |
| `conversations` | One practice session (add optional FKs only — see §6) |
| `messages` | Chat transcript |
| `coaching_reports` | Debrief (reflection, client feedback, facts, AI suggestions) |
| `progress_notes` | Free-form notes (trainee or manager) |

Login remains **`auth.users`** (Supabase); `profiles` extends it.

---

## 3. Trainer / organization (who can teach)

### 3.1 `organizations` (optional in v1; useful for v2 B2B)

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | PK |
| `name` | text | Display name |
| `slug` | text | Unique URL-safe id |
| `created_at` | timestamptz | |

### 3.2 `organization_members`

| Column | Type | Notes |
|--------|------|--------|
| `organization_id` | uuid | FK → `organizations` |
| `profile_id` | uuid | FK → `profiles` |
| `role` | text | `owner`, `coach`, `admin`, `trainee` |
| `created_at` | timestamptz | |

**Unique:** `(organization_id, profile_id)`.

### 3.3 `coach_profiles` (1:1 with `profiles`)

| Column | Type | Notes |
|--------|------|--------|
| `profile_id` | uuid | PK, FK → `profiles` |
| `display_name` | text | Optional public name |
| `bio` | text | |
| `specialties` | jsonb | e.g. `["property", "objection handling"]` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 3.4 Roles on `profiles`

Extend `profiles.role` check to include **`coach`**:

| Role | Typical use |
|------|-------------|
| `trainee` | Default; practices, sees own data |
| `manager` | Internal team dashboard (existing) |
| `coach` | Owns libraries, enrollments, assignments |

**Minimal v1:** Skip `organizations`; add `coach_profiles` + `coach` role. Use `manager` for internal oversight; use `coach` for external trainers with their own content.

---

## 4. RAG — knowledge libraries

Requires **pgvector** in Supabase when you implement search (`create extension if not exists vector`).

### 4.1 `knowledge_libraries`

One curated collection (course, script pack, agency playbook).

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | PK |
| `owner_id` | uuid | FK → `profiles` (coach) |
| `organization_id` | uuid | Nullable FK → `organizations` |
| `practice_pack` | text | `property`, `education`, `fp`, or null = cross-pack |
| `title` | text | |
| `description` | text | |
| `visibility` | text | `private`, `org`, `published` |
| `status` | text | `draft`, `active`, `archived` |
| `embedding_model` | text | e.g. `text-embedding-004` — re-embed per library if model changes |
| `metadata` | jsonb | Tags, language, version notes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 4.2 `knowledge_documents`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | PK |
| `library_id` | uuid | FK → `knowledge_libraries` |
| `title` | text | |
| `source_type` | text | `upload`, `url`, `paste` |
| `storage_path` | text | Supabase Storage path (if upload) |
| `source_url` | text | If URL source |
| `mime_type` | text | |
| `checksum` | text | Dedup / re-process detection |
| `processing_status` | text | `pending`, `processing`, `ready`, `failed` |
| `error_message` | text | Nullable |
| `version` | integer | Increment on replace |
| `metadata` | jsonb | Page count, effective date, etc. |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 4.3 `knowledge_chunks`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | PK |
| `document_id` | uuid | FK → `knowledge_documents` |
| `library_id` | uuid | FK → `knowledge_libraries` (denormalized for filters) |
| `chunk_index` | integer | Order within document |
| `content` | text | Chunk text |
| `token_count` | integer | Optional |
| `embedding` | vector(N) | **N = embedding model dimension** (set once in migration) |
| `metadata` | jsonb | Page, section title, `persona_id`, `aim_key`, etc. |
| `created_at` | timestamptz | |

**Index:** similarity search on `embedding`, filtered by `library_id`.

---

## 5. Who may use a library (trainees)

### 5.1 `library_enrollments`

| Column | Type | Notes |
|--------|------|--------|
| `library_id` | uuid | FK |
| `profile_id` | uuid | FK → `profiles` (trainee) |
| `assigned_by` | uuid | FK → `profiles` (coach) |
| `starts_at` | timestamptz | Default now |
| `expires_at` | timestamptz | Nullable (trial end) |
| `created_at` | timestamptz | |

**Unique:** `(library_id, profile_id)`.

RAG in the app: only retrieve from libraries the trainee is enrolled in (and that match `practice_pack` if set).

---

## 6. Trainer assignments (with or without RAG)

### 6.1 `training_assignments`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | PK |
| `coach_id` | uuid | FK → `profiles` |
| `trainee_id` | uuid | FK → `profiles` |
| `library_id` | uuid | Nullable — RAG context for this assignment |
| `title` | text | |
| `instructions` | text | What to practice |
| `practice_pack` | text | Optional lock |
| `persona_id` | text | Optional suggested persona |
| `aim_key` | text | Optional |
| `setting_key` | text | Optional |
| `due_at` | timestamptz | Nullable |
| `status` | text | `assigned`, `in_progress`, `completed`, `cancelled` |
| `metadata` | jsonb | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 6.2 `assignment_conversations`

| Column | Type | Notes |
|--------|------|--------|
| `assignment_id` | uuid | FK |
| `conversation_id` | uuid | FK → `conversations` |
| `completed_at` | timestamptz | |

Links “coach homework” to a completed session.

---

## 7. RAG audit (per session)

### 7.1 `conversation_retrievals`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | PK |
| `conversation_id` | uuid | FK → `conversations` |
| `chunk_id` | uuid | FK → `knowledge_chunks` |
| `rank` | integer | 1 = top match |
| `score` | float | Similarity score |
| `query_text` | text | Nullable — what was embedded for search |
| `created_at` | timestamptz | |

Do **not** duplicate this inside every `messages` row; log retrievals when the app builds the system prompt (start of session or per turn).

### 7.2 Small additions to `conversations` (recommended)

Add nullable columns when you ship RAG/assignments:

| Column | Type | Notes |
|--------|------|--------|
| `rag_library_id` | uuid | Nullable FK → `knowledge_libraries` |
| `assignment_id` | uuid | Nullable FK → `training_assignments` |

Stable, minimal change to an existing table.

---

## 8. What not to build (yet)

| Avoid | Why |
|--------|-----|
| Embeddings on `messages` | Retrieve in app layer; audit in `conversation_retrievals` |
| One giant `trainer_content` table | You will need documents + chunks within months |
| Replacing `coaching_reports` | Debrief flow already works |
| Storing full RAG context only in JSON on `conversations` | Hard to query, re-embed, and debug |

---

## 9. Entity relationships

```text
auth.users ──1:1──► profiles
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
   coach_profiles   conversations   library_enrollments
         │              │              │
         │              ├── messages   │
         │              ├── coaching_reports
         │              ├── conversation_retrievals ──► knowledge_chunks
         │              │
         ▼              ▼
knowledge_libraries ◄───┘ (rag_library_id)
         │
         ├── knowledge_documents
         │         └── knowledge_chunks (embedding)
         │
training_assignments ──► assignment_conversations ──► conversations

organizations ──► organization_members ──► profiles
```

---

## 10. Rollout order

| Phase | Tables / changes | Product |
|-------|------------------|---------|
| **1 — Coach workflow** | `coach_profiles`, `training_assignments`, `assignment_conversations`; extend `profiles.role` | Assign practice; no upload yet |
| **2 — Content storage** | `knowledge_libraries`, `knowledge_documents` | Upload PDFs/scripts; coach reads manually |
| **3 — RAG** | `knowledge_chunks`, pgvector, `library_enrollments`, `conversation_retrievals`; optional `conversations.rag_library_id` | Retrieve chunks into prompts |
| **4 — B2B** | `organizations`, `organization_members` | Multi-tenant agencies / schools |

---

## 11. Security (RLS) — sketch

When implementing SQL migrations:

- **Trainees:** read chunks only via enrolled `library_id`; insert retrievals only for own `conversation_id`.
- **Coaches:** CRUD on own libraries/documents; manage enrollments and assignments for their trainees.
- **Managers:** read team conversations/reports (existing pattern); optional read-only on assigned org libraries.
- **Service role:** document ingestion worker (chunk + embed) bypasses client RLS.

Mirror patterns from [`schema.sql`](../supabase/schema.sql) (`is_manager()`, own-row checks).

---

## 12. Document control

| Item | Value |
|------|--------|
| Status | SQL migration ready — run when you choose |
| Migration file | [`supabase/add_rag_and_coach.sql`](../supabase/add_rag_and_coach.sql) |
| Next step | Run SQL in Supabase → then build app features (upload, embed, coach UI) |

---

*End of document.*
