Speedo Vision AI — Project context (for humans and AI assistants)
Repository path: speedo-vision-ai
Package name (internal): tanstack_start_ts (from package.json; branding in the app is Speedo.ai).
Last reviewed from codebase: May 2026.

1. What this product is
Speedo.ai is positioned as an AI-powered video inspection platform. The live implementation centers on a Corrosion Detection — Video workflow: users manage inspection projects, upload video, the app samples frames, sends them to a remote object-detection API, and surfaces detections with timeline review, human-in-the-loop confirm/dismiss, and prediction-style summaries.

The root route metadata describes the product as: “AI Video Inspection” / “AI-powered video inspection platform.” (see src/routes/__root.tsx head meta.)

Primary user outcomes (inferred from implemented flows):

Pick an inspection model (today: corrosion video is the only fully wired model).
Create a new project from a video file, run automated analysis, land on a project detail view.
Review Details, Timeline (video + markers + frame list), and Predictions (stats + synthetic frame panels).
2. Product idea, objectives, and direction
2.1 Problem space
Industrial / asset inspection (pipelines, tanks, etc.) benefits from consistent, scalable review of video: flag defects, quantify confidence and area, and support reviewer judgment (confirm/dismiss, relabel).

2.2 What the codebase actually delivers today
Area	Status
Models hub (/)
Lists models; only Corrosion Detection — Video links to a real route; Car Scratch is disabled (to: null).
Corrosion hub (/models/corrosion)
Lists in-memory user projects + demo rows; New Project modal runs real frame extract + API calls.
Dynamic project (/models/corrosion/$projectId)
Full Details / Timeline / Predictions for projects created in-session via the store.
Legacy demo project (/models/corrosion/pipeline-inspection-01)
Hard-coded stats and detections; no real video (placeholder component).
/models/corrosion/new
Separate simplified upload UI; mock file pick; navigates to pipeline demo — not the main creation path.
Team / Settings (/team, /settings)
Linked from sidebar; no route files → expect 404 with current tree.
Direction implied by the code: evolve from a demo + single-model MVP toward a multi-model platform with persistent projects, auth, and backend-orchestrated jobs; the UI already mirrors an enterprise-style inspection console.

3. Product and UX principles (evidence-based)
These are inferred from copy, layout, and behavior—not a separate PRD file exists in-repo.

Inspection-first layout — Sidebar (Models / Team / Settings), top bar with contextual back links, main content on a light gray canvas (#F0F2F7).
Human-in-the-loop — Timeline tab supports pending / confirmed / dismissed and label edits (local component state only; not persisted to projectsStore).
Severity and evidence surfaced — Confidence %, area %, bounding boxes overlaid on video (percent-based positioning).
AI narrative — “AI Inspection Summary” collapsible panel (InspectionSummary in frame-panels.tsx).
Teal + blue industrial palette — Primary actions often teal (#2E9E8F); links/active states blue (#2E86AB); many CTAs use square corners (borderRadius: 0) for a utilitarian look.
Resilience over perfect analysis — Per-frame detectFrame failures in the new-project flow are skipped silently (loop continues).
Branded error experience — SSR errors can be normalized to an HTML error page (renderErrorPage) instead of opaque JSON.
4. Technical stack
Layer	Choice
Framework
TanStack Start (@tanstack/react-start) + TanStack Router (file-based routes, generated routeTree.gen.ts)
UI
React 19, Tailwind CSS 4 (@tailwindcss/vite), Radix UI primitives, lucide-react icons
Forms / validation libs present
react-hook-form, zod, @hookform/resolvers (heavy shadcn-style kit in src/components/ui/)
Data fetching
TanStack Query wired in router context (QueryClient in src/router.tsx) — corrosion flow uses direct fetch, not Query, for detection
Build
Vite 7 via @lovable.dev/vite-tanstack-config (comment in vite.config.ts: do not duplicate plugins)
SSR / server
src/server.ts wraps TanStack Start server entry; src/start.ts registers error middleware
Optional / template signals
@cloudflare/vite-plugin, .lovable/project.json template tanstack_start_ts_2026-05-06
Deploy hint
vercel.json: SPA-style rewrite to index.html, outputDirectory dist/client
5. Code architecture overview
5.1 High-level request flow
Browser
SSR / Edge
User
Hugging Face Space API
TanStack Router + React
HTML video + canvas frame extract
fetch detect API
projectsStore in-memory
src/server.ts
TanStack server-entry
start.ts error middleware
5.2 Entry points
File	Role
vite.config.ts
Uses Lovable TanStack config; tanstackStart.server.entry: "server" points SSR at src/server.ts.
src/server.ts
Default export fetch: loads @tanstack/react-start/server-entry, wraps response to replace certain h3-swallowed 500 JSON bodies with HTML error page; imports error-capture for stack recovery.
src/start.ts
createStart with server try/catch middleware; non-HTTP errors → HTML 500.
src/router.tsx
createRouter({ routeTree, context: { queryClient }, ... }).
src/routes/__root.tsx
HTML shell (RootShell), QueryClientProvider, meta/OG tags, 404 and route error UI.
5.3 Application layers
Routes (src/routes/*.tsx) — Page-level composition, local UI state, orchestration (e.g. modal pipeline in models.corrosion.tsx).
Layout (src/components/app-shell.tsx) — Sidebar, top bar, main padding, floating chat button (non-functional placeholder).
Domain lib (src/lib/) — corrosion-detect.ts (video → frames → API → normalized detections), projects-store.ts (types + store), error-*.
Presentation components (src/components/frame-panels.tsx) — Canvas-based “original” / “annotated” panels, inspection summary, legacy video placeholder.
Design system (src/components/ui/*, src/styles.css, components.json) — shadcn-style primitives; much of the corrosion UI uses inline hex classes instead of only semantic tokens.
5.4 Routing (authoritative from routeTree.gen.ts)
URL path	Route file	Notes
/
routes/index.tsx
Models grid
/models/corrosion
routes/models.corrosion.tsx
Projects + modal new project
/models/corrosion/new
routes/models.corrosion.new.tsx
Child route; mock upload
/models/corrosion/$projectId
routes/models.corrosion_.$projectId.tsx
Dynamic segment; requires project in store
/models/corrosion/pipeline-inspection-01
routes/models.corrosion_.pipeline-inspection-01.tsx
Static demo id
TanStack file naming: files like models.corrosion_.$projectId.tsx use the _ segment so the URL stays flat (/models/corrosion/...) without nesting layout folders.

6. Domain model and state
6.1 Types (src/lib/projects-store.ts)
DetectionBox: { x, y, width, height } — stored as percentages 0–100 of the video/frame.
Detection: timestamp (seconds), label, confidence (0–100 scale in app), area_percent, box.
Project: id, name, videoURL (blob URL from uploaded file), createdAt (formatted string), detections[], status, duration, optional fileName, framesAnalysed.
6.2 projectsStore (critical limitation)
In-memory only module-level projects array + useSyncExternalStore subscribers.
No persistence — refresh loses user-created projects.
API: subscribe, getSnapshot, add, get(id).
Any AI extending the product should assume persistence is a deliberate next step (localStorage, IndexedDB, or backend).

7. Corrosion detection pipeline (src/lib/corrosion-detect.ts)
extractFrames(videoFile, intervalSec) (default 2s): loads video in a hidden <video>, seeks on loadedmetadata / seeked, draws to <canvas>, exports JPEG blobs (~quality 0.8). Returns frames[], duration, videoURL (object URL; caller must be aware of revoke policy — not revoked in current flow).
detectFrame(blob) — POST multipart to
https://hadilc-speedo-vision-api.hf.space/detect
with field file named frame.jpg.
normalizeDetections(apiJson, timestamp, imgW?, imgH?) — Reads apiJson.detections; supports multiple box shapes (box / bbox, x/y/width/height or array indices); converts pixels vs normalized using image_width / image_height from JSON or args; confidence and area coerced to app conventions.
Security / ops note for implementers: API URL is hard-coded; CORS and HF Space availability affect the browser-only fetch.

8. Key user flows (implementation map)
8.1 “New inspection project” (primary)
Trigger: + New Project on /models/corrosion → NewProjectModal in models.corrosion.tsx.

User selects video → simulated upload progress to 100%.
extractFrames(file, 2) — client-only.
For each frame: detectFrame → normalizeDetections; failures swallowed.
projectsStore.add with new id = String(Date.now()).
Navigate to /models/corrosion/$projectId.
8.2 Project detail — Timeline tab
Video element with project.videoURL.
Selected detection draws percentage-based overlay (left/top/width/height as %).
Scrubber markers at (timestamp / duration) * 100.
Side list: confirm/dismiss, edit label — React local state only (useState); does not write back to projectsStore.
8.3 Project detail — Predictions tab
Aggregates from project.detections (avg score, avg area).
OriginalFramePanel / AnnotatedFramePanel — synthetic grid/canvas visuals (not the actual decoded frame image from video); timestamps/labels shown as text.
9. UI and design system
Global CSS: src/styles.css — Tailwind v4 @theme inline, oklch semantic colors, tw-animate-css.
Root shell: Loads Inter from Google Fonts + styles.css?url.
App chrome: Fixed sidebar 220px, white surfaces, borders #E5E7EB.
Component library: Large src/components/ui/ set (dialog, form, chart, sidebar, etc.) — typical shadcn/ui pattern (components.json present).
Corrosion pages mix semantic classes (bg-background) with explicit hex for brand alignment to a spec/mockup.
10. Error handling and observability
Mechanism	Purpose
src/lib/error-capture.ts
Listens to error and unhandledrejection; stores last error with TTL 5s for consumeLastCapturedError.
src/server.ts normalizeCatastrophicSsrResponse
Detects JSON body shape {"unhandled":true,"message":"HTTPError",...} from h3 behavior and swaps in HTML error page + logs consumed error.
src/lib/error-page.ts
Minimal standalone HTML string for failures outside React tree.
src/routes/__root.tsx
errorComponent / notFoundComponent for in-app failures.
11. Scripts and quality
From package.json:

npm run dev — Vite dev
npm run build / build:dev / preview
npm run lint — ESLint
npm run format — Prettier
eslint.config.js extends recommended JS/TS + Prettier + React Hooks + React Refresh; @typescript-eslint/no-unused-vars is off.

12. Deployment notes
vercel.json suggests static SPA fallback to index.html for unknown paths — fine for client-navigated routes; SSR behavior depends on actual host (TanStack Start + Cloudflare plugin may target Workers).
Treat vercel.json vs Cloudflare plugin as environment-specific; resolve conflicts when shipping.
13. Known gaps, inconsistencies, and tech debt (for AI implementers)
Two “new project” experiences — Modal (real) vs /models/corrosion/new (mock); consider consolidating.
Sidebar /team, /settings — No routes; add routes or remove links.
Search / filters on models and projects — UI only, no logic.
Model stats (accuracy, frames analysed on hub) — Static strings.
Pipeline demo — Summary text mentions 4:12 while details say 3:00; minor content inconsistency.
Memory — Blob URLs for videos; no URL.revokeObjectURL in shown flow.
Persistence — All new projects lost on reload.
Timeline review state — Not persisted.
Predictions tab — “Original” frames are placeholders, not true thumbnails from API/video.
package.json name — Does not match “speedo-vision-ai” branding; optional rename for clarity.
14. Principles for future development (recommended)
Single source of truth for project creation and navigation.
Persist projects (minimum: localStorage + migration; better: API + DB).
Centralize API base URL in env (import.meta.env) for staging/production.
Unify detection review state with the store or a dedicated API.
Replace or augment synthetic frame panels with real crops or server-rendered thumbnails.
Align branding in package.json, README, and meta tags when product name is finalized.
15. Quick file index (onboarding cheat sheet)
Path	Responsibility
src/routes/index.tsx
Models landing
src/routes/models.corrosion.tsx
Corrosion hub + real new-project modal + store integration
src/routes/models.corrosion_.$projectId.tsx
Dynamic project tabs
src/routes/models.corrosion_.pipeline-inspection-01.tsx
Static demo
src/routes/models.corrosion.new.tsx
Alternate mock new-project page
src/lib/corrosion-detect.ts
Frame extraction + HF API + normalization
src/lib/projects-store.ts
Types + in-memory store
src/components/app-shell.tsx
Global layout + nav
src/components/frame-panels.tsx
Canvas panels + summary + legacy placeholder
src/server.ts / src/start.ts
SSR error handling
src/routeTree.gen.ts
Generated — do not hand-edit
Ask mode note
This document was generated from the repository as it exists in your workspace; it was not written to a file. Save it yourself, or switch to Agent mode if you want the assistant to add PROJECT_CONTEXT.md (or another name) to the repo.
