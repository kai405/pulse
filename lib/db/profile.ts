import type { PracticeMode } from "@/lib/product";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SettingsProfile = {
  displayName: string;
  targetWpm: number;
  weeklyGoal: number;
  preferredMode: PracticeMode;
  triggerWords: string[];
};

export async function getOwnedSettingsProfile(): Promise<{ profile: SettingsProfile | null; workspace: "demo" | "guest" | "account" }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { profile: null, workspace: "demo" };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { profile: null, workspace: "demo" };
  const [{ data: profile }, { data: triggers }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("trigger_words").select("phrase").eq("user_id", user.id).eq("enabled", true).order("created_at"),
  ]);
  return {
    workspace: user.is_anonymous ? "guest" : "account",
    profile: profile ? { displayName: profile.display_name ?? "", targetWpm: profile.target_wpm, weeklyGoal: profile.weekly_session_goal, preferredMode: profile.preferred_mode, triggerWords: (triggers ?? []).map((trigger) => trigger.phrase) } : null,
  };
}
