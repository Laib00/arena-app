import { supabase } from "../supabaseClient";

const BUCKET = "coach-documents";

export function avatarObjectPath(profileId: string, fileName: string): string {
  const safe = fileName.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "avatar.jpg";
  return `${profileId}/avatar/${Date.now()}-${safe}`;
}

export async function uploadCoachAvatar(
  profileId: string,
  file: File
): Promise<{ path: string; signedUrl: string | null }> {
  const path = avatarObjectPath(profileId, file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(error.message);
  const signedUrl = await resolveAvatarUrl(path);
  return { path, signedUrl };
}

export async function resolveAvatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error || !data?.signedUrl) {
    if (error) console.warn("avatar signed URL:", error.message);
    return null;
  }
  return data.signedUrl;
}

export async function removeCoachAvatar(path: string | null | undefined): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn("avatar remove:", error.message);
}
