-- Optional public/same-origin video URL when R2 is not used (D1-only deploys).
ALTER TABLE projects ADD COLUMN video_playback_url TEXT;
