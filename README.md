# The Arena — Roleplay Trainer

A live roleplay practice tool for real estate agents and financial advisors.
The trainee chats with an LLM playing a fixed client persona (graded Easy →
Impossible), then gets an AI-generated coaching report at the end.

Runs on **Gemini** via a small serverless proxy, so your API key never
touches the browser.

## How it's structured

```
index.html          entry point
src/App.jsx          the whole app (setup screen, chat, evaluation)
src/main.jsx          React mount point
api/gemini.js         serverless function — the ONLY place your API key lives
```

The frontend never calls Gemini directly. It calls `/api/gemini`, which is a
serverless function that adds your `GEMINI_API_KEY` server-side and forwards
the request. This is important: if the frontend called Gemini directly with
the key embedded, anyone could open dev tools, steal the key, and rack up
charges on your account.

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

## 3. Local development

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

- **No persistence.** Refreshing the page loses the current conversation.
  If you want managers to review past sessions later, that needs a real
  database (e.g. Vercel Postgres, Supabase) — not included here.
- **No auth.** Anyone with the URL can use it (and consume your API quota).
  For a closed trial, consider adding a simple password gate or Vercel's
  built-in password protection (Pro plan) before sharing the link widely.
- **Personas are hand-authored, not verified** against real CEA/MAS
  practice — worth a review pass from someone in each industry before
  trainees rely on it.
- Default model is `gemini-2.5-flash` (fast, cheap, good for this use
  case). Swap `GEMINI_MODEL` if you want a stronger model for the
  evaluation step specifically — that would require a second env var and
  a small code change in `api/gemini.js` to support two models.
