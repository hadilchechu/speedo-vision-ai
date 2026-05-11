# Featured inspection demo asset

Add your demo video here as:

**`demo.mp4`**

The app serves it at `/demo-inspection/demo.mp4`. The featured project (`/models/corrosion/pipeline-inspection-01`) uses that file for:

- Timeline playback and detection overlays  
- Predictions thumbnails (original frame + annotated overlay) sampled from the same video  

After you replace the clip, update the baked metadata in `src/lib/static-featured-demo.ts`:

- `duration` (seconds) — or rely on the player: the UI reads real duration from the file once it loads; the initial value is only used before metadata loads.  
- `framesAnalysed` — should match how many frames you want to show in Details (e.g. from your extraction interval).  
- Each entry in `demoDetections`: `timestamp` (seconds), `box` `{ x, y, width, height }` as **percentages of the video frame** (0–100), plus `confidence` / `area_percent` / `label` as you want them displayed.

Optional: re-run the in-app inspection flow once against your file, copy the resulting `detections` array from the browser devtools or from a small script using `extractFrames` + `detectFrame`, and paste into `static-featured-demo.ts` so boxes align with the model.
