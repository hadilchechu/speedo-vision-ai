import { createClient } from "@supabase/supabase-js";
import { validateInspectionVideo } from "@/lib/upload-constraints";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function extensionFromFile(file: File): string {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (extension) return extension.slice(0, 8);

  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/quicktime") return "mov";
  if (file.type === "video/x-msvideo") return "avi";
  if (file.type === "video/webm") return "webm";

  return "mp4";
}

export async function uploadVideo(file: File, projectId: string): Promise<string> {
  const validationError = validateInspectionVideo(file);
  if (validationError) throw new Error(validationError);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Sign in to save projects across sessions");

  const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = `${session.user.id}/${safeProjectId}/${crypto.randomUUID()}.${extensionFromFile(file)}`;

  const { error } = await supabase.storage.from("video").upload(filePath, file, {
    cacheControl: "3600",
    contentType: file.type || "video/mp4",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("video").getPublicUrl(filePath);

  return data.publicUrl;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
