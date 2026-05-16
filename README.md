# Speedo Vision AI

> AI-powered video inspection platform for industrial corrosion detection — built solo, for free by a UX designer learning full-stack AI development through vibe coding.

🔗 **[Live Demo](https://speedo-vision-ai.hadilchechu.workers.dev)** · built with React, TypeScript, Cloudflare Workers, Supabase, and Hugging Face

---

## What it does

Speedo Vision AI lets engineers upload pipeline inspection footage and automatically detect corrosion using an AI model. Upload an MP4, the app extracts frames, runs each through a object detection model, and presents results on an interactive timeline with bounding boxes, a predictions grid, severity stats, and a PDF/Video export.

---

## Why I built this

I'm a UX designer who wanted to understand how AI products are actually built — not just how to design them.

I challenged myself to build a full-stack AI application completely solo, using AI-assisted coding (Claude, Cursor, Codex) to bridge the gap between design knowledge and engineering. Every architectural decision, every bug, every deployment was mine to figure out.

This project taught me:
- How to integrate a real ML model from Hugging Face into a production app
- How to architect a full-stack app with auth, database, and file storage
- How vibe coding works in practice — and where it breaks down
- The gap between designing AI interfaces and building them

---

## Features

- **Corrosion detection** — upload MP4 footage, extract frames automatically, run inference via Hugging Face API
- **Interactive timeline** — playhead-synced bounding boxes with confirm / dismiss / label editing
- **Predictions grid** — detection stats, confidence scores, severity breakdown
- **PDF export** — full inspection report with original and annotated thumbnails
- **Google OAuth** — sign in with Google via Supabase Auth
- **Persistent storage** — projects and videos saved to Supabase, available across sessions and devices
- **Bundled demo** — try it instantly at `/models/corrosion/pipeline-inspection-01` with no upload needed

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, TanStack Router |
| Backend | Cloudflare Workers |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase Postgres (with row-level security) |
| File storage | Supabase Storage |
| AI model | Hugging Face (corrosion object detection) |
| PDF | jsPDF + jspdf-autotable |
| Deploy | Cloudflare Workers (auto-deploy via GitHub) |

---

## Architecture

```
Browser → Cloudflare Workers → Supabase (Auth + DB + Storage)
                          ↓
               Hugging Face Inference API
```

- Users authenticate via Google OAuth (Supabase handles the full flow)
- Videos upload directly to Supabase Storage with per-user folder isolation
- Detection results stored in Postgres with row-level security (users only see their own projects)
- Frame inference calls a remote Hugging Face Space — swap `API_URL` in `src/lib/corrosion-detect.ts` to use your own model

---

## Running locally

```bash
git clone https://github.com/hadilchechu/speedo-vision-ai.git
cd speedo-vision-ai
npm install
```

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then:

```bash
npm run dev
```

Open `http://localhost:8080`

---

## Project structure

```
src/
  routes/         # Page components (TanStack file-based routing)
  components/     # App shell, auth, corrosion UI
  lib/            # Detection, PDF export, Supabase client, project store
  server.ts       # Cloudflare Worker entry point
public/
  demo-inspection/ # Bundled demo video
```

---

## What I learned

This was my first full-stack AI project built entirely solo. Key lessons:

- **Vibe coding is real but requires judgment** — AI can write the code but you need to understand enough to spot when it's wrong
- **Auth is always harder than it looks** — OAuth redirects, session persistence, and CORS took real debugging
- **Storage and database are separate concerns** — learned this the hard way when videos disappeared after logout
- **Designing and building are very different skills** — having both perspectives made me a better engineer and a better designer

---

## About me

UX Designer, now expanding into AI product development. I believe the best AI products are built by people who understand both design and engineering — so I'm learning to be one of them.

[LinkedIn](https://linkedin.com/in/hadilchechu) · [Live App](https://speedo-vision-ai.hadilchechu.workers.dev)

---

## License

MIT