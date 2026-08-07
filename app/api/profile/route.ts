import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRACTICE_MODES } from "@/lib/product";

const profileSchema = z.object({
  displayName: z.string().trim().max(60),
  goal: z.enum(["confidence", "clarity", "interviews", "presentations"]),
  experience: z.enum(["beginner", "regular", "advanced"]),
  preferredMode: z.enum(PRACTICE_MODES),
  targetWpm: z.number().int().min(100).max(180),
  weeklyGoal: z.number().int().min(1).max(7).default(3),
  triggerWords: z.array(z.string().trim().min(1).max(80)).max(20),
  onboardingCompleted: z.boolean().default(true),
});

export async function PATCH(request: Request) {
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Profile settings were invalid." }, { status: 400 });
  const supabase = await createSupabaseServerClient(); const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ stored: "browser" });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ stored: "browser" });
  const input = parsed.data;
  const { error } = await admin.from("profiles").update({ display_name: input.displayName || null, goal: input.goal, experience_level: input.experience, preferred_mode: input.preferredMode, target_wpm: input.targetWpm, weekly_session_goal: input.weeklyGoal, onboarding_completed_at: input.onboardingCompleted ? new Date().toISOString() : null }).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Pulse could not save your profile." }, { status: 503 });
  await admin.from("trigger_words").delete().eq("user_id", user.id);
  if (input.triggerWords.length) {
    const { error: triggerError } = await admin.from("trigger_words").insert(input.triggerWords.map((phrase) => ({ user_id: user.id, phrase, normalized_phrase: phrase.toLocaleLowerCase("en-US"), enabled: true })));
    if (triggerError) return NextResponse.json({ error: "Your profile was saved, but trigger words could not be updated." }, { status: 503 });
  }
  return NextResponse.json({ stored: "account" });
}
