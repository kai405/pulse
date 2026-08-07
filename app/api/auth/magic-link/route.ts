import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicEnv } from "@/lib/env";
import { consumeRateLimit, requestRateLimitKey } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({ email: z.email() });

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(requestRateLimitKey(request, "magic-link"), 5, 10 * 60_000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many email-link requests. Try again shortly." }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Email sign-in is not configured in this environment. Continue as a guest." }, { status: 503 });
  const env = getPublicEnv();
  const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`;
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.is_anonymous) {
    const { error } = await supabase.auth.updateUser({ email: parsed.data.email }, { emailRedirectTo: redirectTo });
    if (error) return NextResponse.json({ error: "We couldn’t send the workspace-saving link. Try again shortly." }, { status: 503 });
    return NextResponse.json({ ok: true, convertingGuest: true });
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) return NextResponse.json({ error: "We couldn’t send the sign-in link. Try again shortly." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
