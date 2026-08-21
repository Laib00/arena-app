import { supabase } from "./supabaseClient";

type ProfileUpdateFields = Record<string, unknown>;

type SavedProfileRow = {
  id: string;
  agent_profile: unknown;
  industry: unknown;
  full_name: unknown;
  xp?: number | null;
};

async function saveProfileFields(
  userId: string,
  fields: ProfileUpdateFields
): Promise<SavedProfileRow> {
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select("id, agent_profile, industry, full_name, xp");
  if (error) throw error;
  if (!data?.length) {
    throw new Error(
      "Save didn't go through — the database may be blocking profile updates. " +
      "Run supabase/fix_profile_rls.sql in the Supabase SQL Editor, then try again."
    );
  }
  return data[0] as SavedProfileRow;
}

export { saveProfileFields };
