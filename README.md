# Speedo Vision AI

AI-assisted **video inspection** for industrial corrosion detection: upload footage, sample frames, run object detection, then review results on a **timeline**, **predictions** grid, and optional **PDF export**. Ships with a **bundled demo** at `/models/corrosion/pipeline-inspection-01`.

## Features

- **Corrosion Detection — Video** workflow: new project from MP4, frame extraction, remote inference API, in-browser review
- **Timeline** with playhead-synced bounding boxes, confirm / dismiss / label edits (session state)
- **Predictions** tab with stats and **Export** to PDF (original + annotated thumbnails)
- **Cloudflare Workers + D1** persistence for project lists and assets (`/api/projects`), with graceful handling when migrations are not applied yet
- Optional **R2** video storage; **playback URL** path when R2 is disabled

## Tech stack

| Layer | Choice |
|--------|--------|
| App | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) (file routes) |
| UI | React 19, Tailwind CSS 4, Radix UI, lucide-react |
| Server | `src/server.ts` → TanStack server entry + `/api/projects` REST handlers (`src/server-projects-api.ts`) |
| Deploy | Cloudflare Workers (`wrangler.jsonc`), D1 SQLite, optional R2 |
| PDF | jsPDF + jspdf-autotable |

## Prerequisites

- **Node.js** 22+
- **npm** (primary); **bun** optional if you refresh `bun.lock` after dependency changes
- **Cloudflare account** (only if you deploy or use D1/R2)

## Local development

```bash
git clone <your-fork-or-repo-url>
cd speedo-vision-ai
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Why the repo root looks busy

Vite, ESLint, Prettier, TypeScript, and Wrangler **expect config next to `package.json`**—that is normal. Most code lives in **`src/`**; **`public/`** is static assets; **`migrations/d1/`** is the database schema.

| Root file | Purpose |
|-----------|---------|
| `vite.config.ts` | Vite + TanStack Start |
| `eslint.config.js`, `.prettierrc`, `.prettierignore` | Lint & format |
| `components.json` | shadcn/ui paths |
| `tsconfig.json` | TypeScript |
| `wrangler.jsonc` | Cloudflare Workers + D1 binding |
| `vercel.json` | Optional SPA rewrites on Vercel |

### Two lockfiles (`package-lock.json` + `bun.lock`)

Both are committed intentionally:

- **`package-lock.json`** — use with **`npm install`** / **`npm ci`** (typical local flow).
- **`bun.lock`** — needed if CI (e.g. Cloudflare) runs **`bun install --frozen-lockfile`**.

After **changing dependencies**, refresh both locks so installs stay reproducible:

```bash
npm install
bun install
```

To use **only one** package manager in CI, update your pipeline first—then you can drop the other lockfile.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production client + server bundles |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run cf:dev` | Wrangler dev (Workers) |
| `npm run cf:migrate:local` | Apply D1 migrations locally |
| `npm run cf:migrate:remote` | Apply D1 migrations to production DB |
| `npm run media:strip-demo-audio` | Strip audio from `public/demo-inspection/demo.mp4` (needs FFmpeg) |

## Detection API

Frame inference calls a Hugging Face Space by default:

`src/lib/corrosion-detect.ts` → `API_URL` (`detectFrame`).

Point `API_URL` at your own deployment if you replace the model.

## Cloudflare setup

1. **D1** — Create a database and set `database_id` in `wrangler.jsonc` (see comments in that file).
2. **Migrations** (required for cloud project list / save):

   ```bash
   npm run cf:migrate:remote
   ```

   Until migrations run, the hub shows an **amber** setup notice instead of failing hard; the **featured demo** still works without D1.

3. **R2** — Optional. If omitted, saving uses a **playback URL** (same-origin or HTTPS) for the video; see `server-projects-api.ts`.

4. **Deploy** — Use your usual Workers pipeline (`wrangler deploy` or CI). Ensure `bun.lock` stays in sync if CI uses `bun install --frozen-lockfile`.

## Repository layout

```
src/
  routes/           # File-based routes (TanStack Router)
  components/       # App shell, corrosion UI, shadcn-style UI kit
  lib/              # API clients, detection, PDF export, static demo data
  server.ts         # Worker fetch handler entry
migrations/d1/      # D1 SQL migrations
public/demo-inspection/   # Bundled demo MP4 + folder README
scripts/            # e.g. strip-demo-audio.sh
```

## Bundled demo asset

`public/demo-inspection/demo.mp4` powers the **Featured inspection demo**. Detection rows for that route live in `src/lib/static-featured-demo.ts` (illustrative boxes for the stock clip). Replace the video and paste **real model JSON** there if you want pixel-perfect alignment.

More detail: [`public/demo-inspection/README.md`](public/demo-inspection/README.md).

## License

No license file is included in this template—add a `LICENSE` that matches how you distribute the project.
