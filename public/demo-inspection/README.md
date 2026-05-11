# Featured inspection demo asset

See the [repository README](../../README.md) for project overview and Cloudflare setup.

Add your demo video here as:

**`demo.mp4`**

The app serves it at `/demo-inspection/demo.mp4`. The featured project (`/models/corrosion/pipeline-inspection-01`) uses that file for:

- Timeline playback and detection overlays  
- Predictions thumbnails (original frame + annotated overlay) sampled from the same video  

After you replace the clip, update the baked metadata in `src/lib/static-featured-demo.ts`:

The **stock** repo ships a short **~5s** `demo.mp4` with **five** baked detections spread between **0.6s–4.5s** in `static-featured-demo.ts` so every marker is seekable in that clip. If you replace the file with a longer inspection, update timestamps so **every detection time is ≤ the real video duration**.
- `framesAnalysed` — should match how many frames you want to show in Details (e.g. from your extraction interval).  
- Each entry in `demoDetections`: `timestamp` (seconds), `box` `{ x, y, width, height }` as **percentages of the video frame** (0–100), plus `confidence` / `area_percent` / `label` as you want them displayed.

Optional: re-run the in-app inspection flow once against your file, copy the resulting `detections` array from the browser devtools or from a small script using `extractFrames` + `detectFrame`, and paste into `static-featured-demo.ts` so boxes align with the model.

## Remove audio from `demo.mp4`

This only changes the file on disk (video stream is copied, not re-encoded; audio tracks are dropped).

1. Install [FFmpeg](https://ffmpeg.org/) (macOS: `brew install ffmpeg`).
2. From the repo root: `npm run media:strip-demo-audio`

Or manually:

```bash
ffmpeg -y -i public/demo-inspection/demo.mp4 -an -c:v copy public/demo-inspection/demo.tmp.mp4 \
  && mv public/demo-inspection/demo.tmp.mp4 public/demo-inspection/demo.mp4
```

**Note:** `<video muted>` in the app only silences playback in the browser; it does not remove audio from the file. Use FFmpeg (or another editor) to strip the track from the MP4.
