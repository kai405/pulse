import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit, requestRateLimitKey } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(requestRateLimitKey(request, "guest-auth"), 10, 60 * 60_000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many guest workspaces were created from this connection. Try again later." }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } });
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return NextResponse.json({ error: "Guest access is temporarily unavailable." }, { status: 503 });
  } else {
    const cookieStore = await cookies();
    cookieStore.set("pulse_demo_guest", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }
  return NextResponse.json({ next: "/onboarding" });
}
