import { NextResponse } from "next/server";
import { queueSession } from "@/lib/processing/queue-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient(); const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Processing is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: session } = await admin.from("practice_sessions").select("status, retry_count").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!session || !["failed", "partial"].includes(session.status)) return NextResponse.json({ error: "This session is not eligible for retry." }, { status: 409 });
  if (session.retry_count >= 3) return NextResponse.json({ error: "Retry limit reached. The recording remains available for support review or deletion." }, { status: 429 });
  await admin.from("practice_sessions").update({ status: "queued", current_stage: "queued", retry_count: session.retry_count + 1, failure_code: null, failure_message: null }).eq("id", id);
  await queueSession(id, user.id);
  return NextResponse.json({ status: "queued" }, { status: 202 });
}
