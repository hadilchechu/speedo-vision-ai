-- Speedo Vision AI — persisted inspection projects (Cloudflare D1)

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  duration REAL NOT NULL,
  status TEXT NOT NULL,
  file_name TEXT,
  frames_analysed INTEGER,
  video_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  timestamp REAL NOT NULL,
  label TEXT NOT NULL,
  confidence REAL NOT NULL,
  area_percent REAL NOT NULL,
  box_x REAL NOT NULL,
  box_y REAL NOT NULL,
  box_w REAL NOT NULL,
  box_h REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_detections_project_id ON detections(project_id);
