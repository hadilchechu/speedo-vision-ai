#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/public/demo-inspection/demo.mp4"
TMP="${ROOT}/public/demo-inspection/demo.no-audio.tmp.mp4"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install on macOS: brew install ffmpeg" >&2
  exit 1
fi

if [[ ! -f "$SRC" ]]; then
  echo "Missing: $SRC" >&2
  exit 1
fi

# Copy video stream only; drop all audio tracks (fast, no re-encode).
ffmpeg -y -hide_banner -loglevel warning -i "$SRC" -an -c:v copy "$TMP"
mv "$TMP" "$SRC"
echo "OK: audio removed from public/demo-inspection/demo.mp4"
