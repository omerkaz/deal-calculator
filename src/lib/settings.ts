import { supabase } from "@/lib/supabase";
import type { PractitionerSettings, PractitionerSettingsUpdate } from "@/types/database";

export async function getSettings(
  userId: string,
): Promise<{ data: PractitionerSettings | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("practitioner_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: new Error(`Failed to fetch settings for user ${userId}: ${error.message}`),
    };
  }

  return { data: data as PractitionerSettings | null, error: null };
}

export async function upsertSettings(
  userId: string,
  patch: PractitionerSettingsUpdate,
): Promise<{ data: PractitionerSettings | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("practitioner_settings")
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: new Error(`Failed to upsert settings for user ${userId}: ${error.message}`),
    };
  }

  return { data: data as PractitionerSettings, error: null };
}
