# Arena — Coach signup & RAG implementation plan

**Status:** Plan only — not fully implemented in the app yet.  
**Database:** Migration applied — [`supabase/add_rag_and_coach.sql`](../supabase/add_rag_and_coach.sql).  
**Design reference:** [`DATABASE_RAG_AND_COACH.md`](./DATABASE_RAG_AND_COACH.md).

---

## Goals

1. **Separate coach access** — no “coach or trainee?” on the main signup form. Trainees use the existing flow; coaches use a **dedicated URL**.
2. **File-based RAG** for coach-owned knowledge libraries: **plain text (paste)**, **Markdown**, **`.txt`**, **`.pdf`**, **`.docx`**.
3. **Storage on Supabase** (Storage bucket + Postgres chunks/embeddings).

---

## 1. Coach signup URL

### Current vs planned (agreed)

- **Trainee / regular user (today):** `https://arenapractice.com/dashboard?signup=1` — same flow as other invite-style links (`?signup=1`, `?mode=signup`, optional `email`, `name`, `pack`, etc.). This is the only signup surface in the shipped app right now.
- **Coach (planned):** a **different path**, e.g. `https://arenapractice.com/signup/coach` — not the trainee query string.
- **Discoverability for v1:** it is acceptable that **coaches do not see coach signup inside the product** yet (no nav CTA). You share the coach URL directly (marketing, ops, email) until you add in-app links.

### Recommended pattern

| Audience | URL (example) | Status |
|----------|----------------|--------|
| Trainee | `https://arenapractice.com/dashboard?signup=1` | **Live** (existing auth) |
| Coach | `https://arenapractice.com/signup/coach` | **Planned** — route + auth branch still to build |

**Why:** Short link for marketing/partners; clear separation from trainee CTAs.

### Alternative (faster to wire, weaker UX)

- `https://arenapractice.com/dashboard?signup=1&account=coach`

### Behaviour (target)

1. Add a **top-level** route in `src/main.tsx`: `path="/signup/coach"` → render **`Auth`** (or a thin wrapper) in **coach signup mode**.
2. Coach mode **does not** show trainee pack picker (Property/Education) unless you explicitly want coaches to pick a practice domain later; default can be minimal profile.
3. On **email** and **Google** signup, set Supabase **`user_metadata`**, e.g. `account_type: "coach"` (avoid overloading `role` in metadata; DB `profiles.role` stays the source of truth after insert).
4. **Supabase trigger** `handle_new_user`: if `raw_user_meta_data->>'account_type' = 'coach'` then `profiles.role = 'coach'`, else default `trainee`.
5. After first login: redirect **`role === 'coach'`** to **`/dashboard/coach`** (shell); trainees stay on `/dashboard`.

### What we do *not* do

- No radio on the main signup asking “coach vs trainee.”

---

## 2. Tools & libraries

| Concern | Choice | Notes |
|---------|--------|--------|
| Routing | **React Router** (already in app) | New route `/signup/coach` |
| Auth | **Supabase Auth** (`signUp`, `signInWithOAuth`) | Pass `options.data` / metadata for coach |
| File pick (browser) | Native `<input type="file">` | `accept` for `.pdf,.txt,.md,.docx` |
| Upload to storage | **`@supabase/supabase-js`** | `storage.from(bucket).upload()` |
| PDF text | **`pdf-parse`** | Node / VPS API |
| DOCX text | **`mammoth`** | `extractRawText` |
| TXT / MD | `Buffer` / `TextDecoder` UTF-8 | Treat MD as plain text for v1 |
| Chunking | **Custom** (max chars + overlap) | Add LangChain etc. only if needed |
| Embeddings | **Gemini embedding API** (or Vertex) | **Must match** `knowledge_chunks.embedding` dimension (`vector(768)` in current migration — verify model output; change dimension in a new migration if not 768) |
| Vector search | **pgvector** in Postgres | Already in `add_rag_and_coach.sql` |
| Background jobs | **v1:** synchronous ingest in API after upload | Later: queue if slow |

**Storage:** **Supabase Storage** (not MinIO) — bucket e.g. `coach-documents`, private, path keyed by `profile_id` / `library_id`.

---

## 3. Supported formats (v1)

| Format | Server handling |
|--------|-----------------|
| Paste / plain | Skip Storage; insert document row + chunks directly or via small temp blob |
| `.md` | Read as UTF-8 text |
| `.txt` | Read as UTF-8 text |
| `.pdf` | `pdf-parse` → string |
| `.docx` | `mammoth.extractRawText` |

Validate MIME + extension; reject unknown types.

---

## 4. Supabase pieces

| Piece | Purpose |
|-------|---------|
| **Bucket** `coach-documents` (or similar) | Raw uploads |
| **RLS on Storage** | Coaches upload/read only their prefix; or signed URLs from backend |
| **Tables** (already in DB) | `knowledge_libraries`, `knowledge_documents`, `knowledge_chunks`, `library_enrollments`, `training_assignments`, `conversation_retrievals`, optional `coach_profiles` |
| **`conversations`** | Optional `rag_library_id`, `assignment_id` (columns in migration) |

---

## 5. Phased implementation

### Phase 0 — Coach signup & routing

- [x] `GET /signup/coach` → coach signup UI (`Auth` with `variant="coach-signup"` in `src/main.tsx`).
- [x] `signUp` / OAuth: set `user_metadata.account_type = 'coach'` (`src/Auth.tsx`).
- [x] SQL: update **`handle_new_user`** and **`ensure_own_profile`** — apply in Supabase (see **§9** below; file [`supabase/phase0_coach_signup.sql`](../supabase/phase0_coach_signup.sql)).
- [x] Post-login redirect: coach → **`/dashboard/coach`** shell (`src/coach/CoachArea.tsx`); trainees unchanged.

**Supabase (required for correct `profiles.role`):** paste and run [`supabase/phase0_coach_signup.sql`](../supabase/phase0_coach_signup.sql) in the **SQL Editor**. Without this, new coach accounts still get `role = 'trainee'` from the old trigger.

### Phase 1 — Coach shell (libraries, no files)

- [x] Route **`/dashboard/coach/*`** guarded (same as Phase 0: only coaches; non-coaches redirected from `App`).
- [x] List/create **`knowledge_libraries`** — `src/coach/CoachArea.tsx` (`/dashboard/coach/libraries`).
- [x] **Paste-only** document — insert `knowledge_documents` (`source_type: paste`, `processing_status: ready`) + **`knowledge_chunks`** with naive splitting (`src/coach/chunkPaste.ts`); no embeddings yet.

### Phase 2 — Upload + ingest (no semantic search yet)

- [x] Storage bucket + RLS — run [`supabase/phase2_coach_storage.sql`](../supabase/phase2_coach_storage.sql) in the SQL Editor (`coach-documents`, path prefix = `auth.uid()`).
- [x] Local dev API **`POST /api/coach/ingest`** — `vite.config.ts` middleware → `server/coachIngest.mjs` (multipart: `library_id`, `file`, optional `title`; `Authorization: Bearer <access_token>`).
- [x] Flow: upload file to Storage → **`knowledge_documents`** (`source_type: upload`, `processing_status` processing → ready/failed) → extract text (**pdf-parse**, **mammoth**, UTF-8 for txt/md) → **`knowledge_chunks`** (no `embedding` until Phase 3).
- [x] Coach UI — `LibraryDetail` in `src/coach/CoachArea.tsx` (upload form).

**Production:** wire the same handler on your VPS / serverless with env **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** (and the same Storage policies). The Vite middleware only runs during `npm run dev`.

### Phase 3 — Embeddings + RAG in chat

- [x] Embedding job fills **`knowledge_chunks.embedding`** (Gemini `text-embedding-004`, 768 dims — see [`api/embeddings.js`](../api/embeddings.js); coach UI **Embed all missing chunks** in `CoachArea`).
- [x] Similarity RPC **`match_knowledge_chunks`** filtered by **`library_id`** and RLS (enrolled trainee or coach/manager) — run [`supabase/phase3_rag.sql`](../supabase/phase3_rag.sql) on Supabase after [`add_rag_and_coach.sql`](../supabase/add_rag_and_coach.sql).
- [x] Trainee practice chat: retrieve on first turn and each user message; prepend **`formatRagContextBlock`** to the system prompt; log **`conversation_retrievals`**; set **`conversations.rag_library_id`** when a library is selected (setup dropdown on home when the trainee has enrolled **active** libraries).

### Phase 4 — Enrollments & assignments

- [x] Coach UI: **`library_enrollments`** (enroll trainees to a library by email, list/remove) — see `LibraryDetail` in `src/coach/CoachArea.tsx`.
- [ ] **`training_assignments`** + link sessions via **`assignment_conversations`** (structured “homework” / assignment flow — not the same as library enrollment).

---

## 6. Security checklist

- Never expose **service_role** key to the browser.
- Use **authenticated** Supabase client + RLS for normal reads; **server** with service role for ingest/embed if policies are strict.
- Coach uploads: scoped path **`{coach_user_id}/{library_id}/{filename}`**.

---

## 7. Open decisions (record when decided)

- [ ] Exact embedding model and vector dimension (768 vs change migration).
- [ ] Whether coaches get a **coach_profiles** row on first login or lazily.
- [ ] Whether **Google OAuth** for coaches uses same Google app with extra redirect path for `/signup/coach`.

---

## 8. References

- [`supabase/add_rag_and_coach.sql`](../supabase/add_rag_and_coach.sql) — tables, RLS, pgvector
- [`supabase/phase3_rag.sql`](../supabase/phase3_rag.sql) — **run on Supabase** for Phase 3 (`match_knowledge_chunks`, `set_knowledge_chunk_embedding`)
- [`docs/DATABASE_RAG_AND_COACH.md`](./DATABASE_RAG_AND_COACH.md) — entity design
- [`supabase/phase0_coach_signup.sql`](../supabase/phase0_coach_signup.sql) — **run on Supabase** for Phase 0 (`handle_new_user` + `ensure_own_profile`)
- [`supabase/phase2_coach_storage.sql`](../supabase/phase2_coach_storage.sql) — **run on Supabase** for Phase 2 (Storage bucket + policies)
- `server/coachIngest.mjs` — multipart ingest (used by Vite dev middleware)
- `src/main.tsx` — `/signup/coach` route
- `src/Auth.tsx` — `variant="coach-signup"` + `account_type` metadata
- `src/App.tsx` — coach redirect + `/dashboard/coach` shell

## 9. Supabase SQL Editor (Phase 0)

1. Open **Supabase Dashboard** → your project → **SQL Editor** → **New query**.
2. Paste the full contents of [`supabase/phase0_coach_signup.sql`](../supabase/phase0_coach_signup.sql).
3. Click **Run** (safe to re-run — it only replaces the two functions).

What it does:

- **`handle_new_user`:** on `auth.users` insert, sets `profiles.role` to **`coach`** when `raw_user_meta_data->>'account_type'` is `coach` (case-insensitive), otherwise **`trainee`**. Coach signups get `practice_pack = 'property'` regardless of other metadata.
- **`ensure_own_profile`:** same `role` / `practice_pack` logic when the app recreates or upserts a profile row. On conflict it now updates **`role`** and **`practice_pack`** from auth metadata (not only email/name).
- **`protect_role_column`:** updated so role changes are only blocked for normal client updates; trusted functions set `set_config('arena.allow_profile_role_sync','1',true)` before syncing role from JWT metadata.

**If `role` stayed `trainee` after re-running Phase 0:** an older DB had `protect_role_column` **reverting every role change** and `ensure_own_profile` **not updating `role` on conflict** — so existing rows never became `coach`. **Re-run the full** [`phase0_coach_signup.sql`](../supabase/phase0_coach_signup.sql) **again** (it now replaces all three). Then refresh the app; it calls `ensure_own_profile` once when JWT has `account_type: coach` but DB is still `trainee`.

**Debug in SQL:** `select id, email, raw_user_meta_data from auth.users where email = '...';` — confirm `raw_user_meta_data` includes `"account_type":"coach"`. If it does not, signup did not send metadata (wrong URL or old client).

**Existing users:** you can still manually `UPDATE public.profiles SET role = 'coach' WHERE ...` from the SQL editor (admin), or rely on `ensure_own_profile` after the script above.

**Google OAuth:** Supabase often does **not** put `signInWithOAuth({ data: { account_type } })` into `user_metadata` (JWT may only show Google claims). The app uses `redirectTo` → `/dashboard/coach?coach_google_intent=1` on coach signup, then **`updateUser({ data: { account_type: 'coach' } })`** on return and calls `ensure_own_profile` so `profiles.role` syncs.

**Debug in SQL:** `select email, raw_user_meta_data from auth.users where email = '...';` — if `account_type` is missing for Google users before the client fix, confirm JWT in the app matched that; after one coach Google signup with the updated app, `raw_user_meta_data` should include `account_type`.

## 10. Supabase SQL Editor (Phase 2 — Storage)

1. Run [`supabase/phase2_coach_storage.sql`](../supabase/phase2_coach_storage.sql) in the **SQL Editor** (creates bucket `coach-documents` and policies so each user can only access objects under folder `auth.uid()/…`).

## 11. Supabase SQL Editor (Phase 3 — vector search + embedding RPCs)

1. Run [`supabase/phase3_rag.sql`](../supabase/phase3_rag.sql) in the **SQL Editor** after `add_rag_and_coach.sql` (defines `match_knowledge_chunks` and `set_knowledge_chunk_embedding`).
2. Ensure the app host has **`GEMINI_API_KEY`** (shared with chat) so **`POST /api/embeddings`** can run for retrieval and for the coach **Embed all** action.

---

*End of plan.*
