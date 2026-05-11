import type { Detection, Project } from "@/lib/projects-store";
import type { D1Prepared, SpeedoEnv } from "@/lib/cf-bindings";

type D1 = NonNullable<SpeedoEnv["DB"]>;

const JSON_HDR = { "content-type": "application/json; charset=utf-8" };

function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HDR, ...Object.fromEntries(new Headers(extra)) },
  });
}

function videoKeyForProject(projectId: string): string {
  return `videos/${projectId}/source`;
}

function isHttpUrl(s: string): boolean {
  return s.startsWith("https://") || s.startsWith("http://");
}

type RowProject = {
  id: string;
  name: string;
  created_at: string;
  duration: number;
  status: string;
  file_name: string | null;
  frames_analysed: number | null;
  video_key: string;
  /** Present after migration `0002_video_playback_url`; omit when migration not applied. */
  video_playback_url?: string | null;
  detection_count?: number;
};

type RowDetection = {
  timestamp: number;
  label: string;
  confidence: number;
  area_percent: number;
  box_x: number;
  box_y: number;
  box_w: number;
  box_h: number;
  sort_order: number;
};

function rowToDetection(r: RowDetection): Detection {
  return {
    timestamp: r.timestamp,
    label: r.label,
    confidence: r.confidence,
    area_percent: r.area_percent,
    box: { x: r.box_x, y: r.box_y, width: r.box_w, height: r.box_h },
  };
}

type ExportPayload = {
  version?: number;
  project: Omit<Project, "videoURL" | "detections">;
  detections: Detection[];
  playbackUrl?: string;
};

function parseExportPayload(text: string): ExportPayload {
  const data = JSON.parse(text) as ExportPayload;
  if (!data.project?.id || !Array.isArray(data.detections)) throw new Error("Invalid manifest");
  return data;
}

function isD1MissingSchemaError(e: unknown): boolean {
  const s = e instanceof Error ? e.message : String(e);
  return s.includes("no such table:") && (s.includes("projects") || s.includes("detections"));
}

export async function handleProjectsApi(request: Request, env: unknown): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (!path.startsWith("/api/projects")) return null;

  const cfEnv = env as SpeedoEnv;

  if (!cfEnv.DB) {
    return json(
      { error: "D1 is not configured. Add the DB binding in wrangler.jsonc and apply migrations." },
      503,
    );
  }

  const db = cfEnv.DB;
  const bucket = cfEnv.VIDEOS;

  const segments = path.split("/").filter(Boolean);

  try {
    // --- /api/projects/import ---
    if (
      segments.length === 3 &&
      segments[0] === "api" &&
      segments[1] === "projects" &&
      segments[2] === "import"
    ) {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const form = await request.formData();
      const manifest = form.get("manifest");
      const video = form.get("video");
      const playbackField = form.get("playbackUrl");
      const playback =
        typeof playbackField === "string" && playbackField.trim()
          ? playbackField.trim()
          : undefined;
      if (typeof manifest !== "string")
        return json({ error: "Expected multipart field: manifest (JSON string)" }, 400);
      const parsed = parseExportPayload(manifest);
      const pb = parsed.playbackUrl ?? playback;
      if (bucket && video instanceof File && video.size > 0) {
        const videoKey = videoKeyForProject(parsed.project.id);
        await bucket.put(videoKey, video.stream(), {
          httpMetadata: { contentType: video.type || "video/mp4" },
        });
        await insertProjectAndDetections(db, parsed.project, parsed.detections, videoKey, null);
      } else if (pb && isHttpUrl(pb)) {
        await insertProjectAndDetections(db, parsed.project, parsed.detections, "", pb);
      } else {
        return json(
          {
            error:
              "Import requires either a video file (when R2 is enabled) or a valid playbackUrl (https://…) in the manifest or form when R2 is disabled.",
          },
          400,
        );
      }
      return json({ ok: true, id: parsed.project.id });
    }

    // --- /api/projects (list / create) ---
    if (segments.length === 2 && segments[0] === "api" && segments[1] === "projects") {
      if (request.method === "GET") {
        try {
          const { results } = await db
            .prepare(
              `SELECT p.id, p.name, p.created_at, p.duration, p.status, p.file_name, p.frames_analysed,
              (SELECT COUNT(*) FROM detections d WHERE d.project_id = p.id) AS detection_count
             FROM projects p ORDER BY p.created_at DESC`,
            )
            .all<Omit<RowProject, "video_key" | "video_playback_url">>();
          return json({ projects: results ?? [] });
        } catch (e) {
          if (isD1MissingSchemaError(e)) {
            return json({
              projects: [],
              d1SetupRequired: true,
              setupMessage:
                "D1 has no projects table yet. Apply migrations once: wrangler d1 migrations apply speedo-vision-ai --remote (same database_id as wrangler.jsonc).",
            });
          }
          throw e;
        }
      }
      if (request.method === "POST") {
        const form = await request.formData();
        const payloadRaw = form.get("payload");
        const video = form.get("video");
        const playbackField = form.get("playbackUrl");
        const playback =
          typeof playbackField === "string" && playbackField.trim() ? playbackField.trim() : "";
        if (typeof payloadRaw !== "string")
          return json({ error: "Expected multipart field: payload (JSON string)" }, 400);
        const body = JSON.parse(payloadRaw) as {
          project: Omit<Project, "videoURL" | "detections">;
          detections: Detection[];
        };
        if (!body.project?.id || !Array.isArray(body.detections))
          return json({ error: "Invalid payload" }, 400);

        if (bucket && video instanceof File && video.size > 0) {
          const videoKey = videoKeyForProject(body.project.id);
          await bucket.put(videoKey, video.stream(), {
            httpMetadata: { contentType: video.type || "video/mp4" },
          });
          await insertProjectAndDetections(db, body.project, body.detections, videoKey, null);
        } else if (playback && isHttpUrl(playback)) {
          await insertProjectAndDetections(db, body.project, body.detections, "", playback);
        } else {
          return json(
            {
              error:
                "Provide a non-empty video file (requires R2 on the account) or a playbackUrl (https://…) pointing at the MP4 when R2 is not configured.",
            },
            400,
          );
        }
        return json({ ok: true, id: body.project.id });
      }
      return json({ error: "Method not allowed" }, 405);
    }

    // --- /api/projects/:id/... ---
    if (segments.length >= 3 && segments[0] === "api" && segments[1] === "projects") {
      const id = segments[2];
      if (!id || id === "import") return json({ error: "Not found" }, 404);

      const sub = segments[3];

      if (sub === "video") {
        if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const row = await db
          .prepare("SELECT * FROM projects WHERE id = ?")
          .bind(id)
          .first<RowProject>();
        if (!row) return json({ error: "Not found" }, 404);
        const playbackUrl = row.video_playback_url;
        if (playbackUrl && isHttpUrl(playbackUrl)) {
          return Response.redirect(playbackUrl, 302);
        }
        if (!bucket || !row.video_key) return json({ error: "Video not available" }, 404);
        const obj = await bucket.get(row.video_key);
        if (!obj?.body) return json({ error: "Video missing" }, 404);
        return new Response(obj.body, {
          headers: {
            "content-type": obj.httpMetadata?.contentType ?? "video/mp4",
            "cache-control": "public, max-age=3600",
          },
        });
      }

      if (sub === "export") {
        if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const proj = await db
          .prepare("SELECT * FROM projects WHERE id = ?")
          .bind(id)
          .first<RowProject>();
        if (!proj) return json({ error: "Not found" }, 404);
        const { results: detRows } = await db
          .prepare(
            "SELECT timestamp, label, confidence, area_percent, box_x, box_y, box_w, box_h, sort_order FROM detections WHERE project_id = ? ORDER BY sort_order ASC",
          )
          .bind(id)
          .all<RowDetection>();
        const detections = (detRows ?? []).map(rowToDetection);
        const exportBody: Record<string, unknown> = {
          version: 1,
          project: {
            id: proj.id,
            name: proj.name,
            createdAt: proj.created_at,
            duration: proj.duration,
            status: proj.status,
            fileName: proj.file_name ?? undefined,
            framesAnalysed: proj.frames_analysed ?? undefined,
          },
          detections,
        };
        if (proj.video_playback_url) exportBody.playbackUrl = proj.video_playback_url;
        return new Response(JSON.stringify(exportBody, null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "content-disposition": `attachment; filename="project-${id}.json"`,
          },
        });
      }

      if (segments.length === 3) {
        if (request.method === "GET") {
          const proj = await db
            .prepare("SELECT * FROM projects WHERE id = ?")
            .bind(id)
            .first<RowProject>();
          if (!proj) return json({ error: "Not found" }, 404);
          const { results: detRows } = await db
            .prepare(
              "SELECT timestamp, label, confidence, area_percent, box_x, box_y, box_w, box_h, sort_order FROM detections WHERE project_id = ? ORDER BY sort_order ASC",
            )
            .bind(id)
            .all<RowDetection>();
          const detections = (detRows ?? []).map(rowToDetection);
          const playback =
            proj.video_playback_url && isHttpUrl(proj.video_playback_url)
              ? proj.video_playback_url
              : null;
          const videoURL = playback ?? `/api/projects/${encodeURIComponent(id)}/video`;
          const project: Project = {
            id: proj.id,
            name: proj.name,
            videoURL,
            createdAt: proj.created_at,
            detections,
            status: proj.status,
            duration: proj.duration,
            fileName: proj.file_name ?? undefined,
            framesAnalysed: proj.frames_analysed ?? undefined,
          };
          return json({ project });
        }
        if (request.method === "DELETE") {
          const row = await db
            .prepare("SELECT video_key FROM projects WHERE id = ?")
            .bind(id)
            .first<{ video_key: string }>();
          if (!row) return json({ error: "Not found" }, 404);
          await db.prepare("DELETE FROM detections WHERE project_id = ?").bind(id).run();
          await db.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
          if (bucket && row.video_key) await bucket.delete(row.video_key);
          return json({ ok: true });
        }
        return json({ error: "Method not allowed" }, 405);
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    if (isD1MissingSchemaError(e)) {
      return json(
        {
          error:
            "D1 tables are missing. Run: wrangler d1 migrations apply speedo-vision-ai --remote (use the database_id from wrangler.jsonc).",
          code: "D1_NOT_MIGRATED",
        },
        503,
      );
    }
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ error: msg }, 500);
  }
}

function isMissingVideoPlaybackColumnError(e: unknown): boolean {
  const s = e instanceof Error ? e.message : String(e);
  return (
    s.includes("video_playback_url") &&
    (s.includes("no such column") || s.includes("does not exist") || s.includes("Unknown column"))
  );
}

async function insertProjectAndDetections(
  db: D1,
  project: Omit<Project, "videoURL" | "detections">,
  detections: Detection[],
  videoKey: string,
  videoPlaybackUrl: string | null,
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO projects (id, name, created_at, duration, status, file_name, frames_analysed, video_key, video_playback_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         created_at = excluded.created_at,
         duration = excluded.duration,
         status = excluded.status,
         file_name = excluded.file_name,
         frames_analysed = excluded.frames_analysed,
         video_key = excluded.video_key,
         video_playback_url = excluded.video_playback_url`,
      )
      .bind(
        project.id,
        project.name,
        project.createdAt,
        project.duration,
        project.status,
        project.fileName ?? null,
        project.framesAnalysed ?? null,
        videoKey,
        videoPlaybackUrl,
      )
      .run();
  } catch (e) {
    if (!isMissingVideoPlaybackColumnError(e)) throw e;
    if (videoPlaybackUrl) {
      throw new Error(
        "D1 is missing column video_playback_url. Apply migrations: wrangler d1 migrations apply speedo-vision-ai --remote",
      );
    }
    await db
      .prepare(
        `INSERT INTO projects (id, name, created_at, duration, status, file_name, frames_analysed, video_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         created_at = excluded.created_at,
         duration = excluded.duration,
         status = excluded.status,
         file_name = excluded.file_name,
         frames_analysed = excluded.frames_analysed,
         video_key = excluded.video_key`,
      )
      .bind(
        project.id,
        project.name,
        project.createdAt,
        project.duration,
        project.status,
        project.fileName ?? null,
        project.framesAnalysed ?? null,
        videoKey,
      )
      .run();
  }

  await db.prepare("DELETE FROM detections WHERE project_id = ?").bind(project.id).run();

  const stmts: D1Prepared[] = detections.map((d, i) =>
    db
      .prepare(
        `INSERT INTO detections (project_id, sort_order, timestamp, label, confidence, area_percent, box_x, box_y, box_w, box_h)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        project.id,
        i,
        d.timestamp,
        d.label,
        d.confidence,
        d.area_percent,
        d.box.x,
        d.box.y,
        d.box.width,
        d.box.height,
      ),
  );
  if (stmts.length > 0) await db.batch(stmts);
}
