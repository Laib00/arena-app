import { supabase } from "./supabaseClient";

async function saveProfileFields(userId, fields) {
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select("id, agent_profile, industry, full_name");
  if (error) throw error;
  if (!data?.length) {
    throw new Error(
      "Save didn't go through — the database may be blocking profile updates. " +
      "Run supabase/fix_profile_rls.sql in the Supabase SQL Editor, then try again."
    );
  }
  return data[0];
}

export { saveProfileFields };
