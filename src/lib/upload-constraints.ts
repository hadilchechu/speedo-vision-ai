export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

export const ACCEPTED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
]);

export function validateInspectionVideo(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Please choose a video under ${MAX_UPLOAD_MB}MB.`;
  }

  if (file.type && !ACCEPTED_VIDEO_MIME_TYPES.has(file.type)) {
    return "Please choose an MP4, MOV, AVI, or WebM video.";
  }

  return null;
}
