# The Arena — Roleplay Trainer

A live roleplay practice tool for real estate agents and financial advisors.
The trainee chats with an LLM playing a fixed client persona (graded Easy →
Impossible), then gets an AI-generated coaching report at the end. Every
session, transcript, and report is saved per user, with progress notes
either the trainee or their manager can add.

Runs on **Gemini** via a small serverless proxy (API key never touches the
browser) and **Supabase** for accounts, saved data, and permissions.

## How it's structured

```
index.html            entry point
src/App.jsx           the whole app (setup, chat, evaluation, team dashboard)
src/Auth.jsx          login/signup screen (email + Google)
src/supabaseClient.js Supabase client setup
src/main.jsx          React mount point
api/gemini.js         serverless function — the ONLY place your Gemini key lives
supabase/schema.sql   database schema + permissions — run this in Supabase once
```

The frontend never calls Gemini directly. It calls `/api/gemini`, which is a
serverless function that adds your `GEMINI_API_KEY` server-side and forwards
the request. This is important: if the frontend called Gemini directly with
the key embedded, anyone could open dev tools, steal the key, and rack up
charges on your account.

Supabase works differently — its `VITE_SUPABASE_ANON_KEY` is *designed* to be
public. Real security comes from Row Level Security policies (in
`supabase/schema.sql`), enforced by the database itself: a trainee can only
ever read/write their own conversations, and only a `manager`-role profile
can see everyone's.

## 1. Get a Gemini API key

Go to https://aistudio.google.com/apikey and create a key. Free tier is
enough for a trial.

## 2. Deploy to Vercel (recommended — free, ~5 minutes)

**Option A — via GitHub (easiest for ongoing updates)**
1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com/new, import the repo.
3. Vercel auto-detects Vite + the `api/` folder — no config needed.
4. Before the first deploy (or right after), go to
   **Project Settings → Environment Variables** and add:
   - `GEMINI_API_KEY` = your key from step 1
   - `GEMINI_MODEL` = `gemini-2.5-flash` (optional, this is the default)
5. Deploy. You'll get a URL like `the-arena-trainer.vercel.app`.

**Option B — via CLI (fastest for a one-off trial)**
```bash
npm install -g vercel
cd arena-app
vercel
# follow the prompts, then:
vercel env add GEMINI_API_KEY
vercel --prod
```

## 3. Set up Supabase (accounts, saved conversations, notes)

**Create the project**
1. Go to [supabase.com](https://supabase.com) → New Project (free tier is enough for a trial)
2. Once it's ready, go to **SQL Editor** → New query
3. Paste the entire contents of `supabase/schema.sql` and click **Run**
   This creates all tables, permissions (Row Level Security), and an
   auto-profile trigger. Safe to re-run if you ever need to.

**Enable login methods**
1. Go to **Authentication → Providers**
2. **Email** is on by default — leave it on
3. Click **Google** → toggle it on. You'll need a Google OAuth Client ID/Secret:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create an OAuth Client ID (type: Web application)
   - Authorized redirect URI: copy the one Supabase shows you on the Google
     provider settings page (looks like `https://xxxx.supabase.co/auth/v1/callback`)
   - Paste the resulting Client ID and Secret back into Supabase's Google
     provider settings, save

**Get your API credentials**
1. Go to **Project Settings → API**
2. Copy the **Project URL** and the **anon public** key
   (NOT the `service_role` key — never expose that one)

**Add them to Vercel**
Same place as `GEMINI_API_KEY` — Project Settings → Environment Variables:
- `VITE_SUPABASE_URL` = your Project URL
- `VITE_SUPABASE_ANON_KEY` = your anon public key

Then redeploy.

**Make yourself (or someone) a manager**
By default every new signup is a `trainee`. To promote someone:
1. Have them sign up once through the app first (so their profile row exists)
2. In Supabase, go to **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'manager' where email = 'their@email.com';
   ```
Managers see a "Team Dashboard" link in the top bar, showing every trainee's
sessions, transcripts, AI coaching reports, and progress notes — and can add
their own notes on any trainee's session. Trainees only see and add notes on
their own sessions.

## 4. Local development


```bash
npm install
cp .env.example .env        # then fill in your real key
npm install -g vercel        # if you don't have it
vercel dev                   # runs both the frontend AND /api locally
```

Plain `npm run dev` (Vite only) will NOT run the `/api` function — use
`vercel dev` so the serverless proxy works locally too.

## Other hosts

This also works on **Netlify** (put `api/gemini.js` in `netlify/functions/`
instead and adjust the fetch URL to `/.netlify/functions/gemini`) or any
platform that supports Node serverless functions alongside a static build.
Vercel just requires zero config for this exact layout.

## Notes / known limitations

- **Conversations, coaching reports, and progress notes now persist** in
  Supabase, tied to each user's account — refreshing no longer loses
  anything, and managers can review any trainee's history via the Team
  Dashboard.
- **Auth is now required** to use the app — email/password or Google.
  Every new signup defaults to `trainee`; promote someone to `manager` via
  the SQL snippet in the Supabase setup section above.
- **Personas are hand-authored, not verified** against real CEA/MAS
  practice — worth a review pass from someone in each industry before
  trainees rely on it.
- Default model is `gemini-2.5-flash` (fast, cheap, good for this use
  case). Swap `GEMINI_MODEL` if you want a stronger model for the
  evaluation step specifically — that would require a second env var and
  a small code change in `api/gemini.js` to support two models.
- Email confirmation is on by default in Supabase (users must click a link
  in their inbox before logging in). For a fast internal trial, you can
  turn this off under **Authentication → Providers → Email → Confirm
  email** if you'd rather skip that step.
