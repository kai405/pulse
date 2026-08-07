import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Persistent sessions are not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("practice_sessions").select("id, status, current_stage, failure_code, failure_message, updated_at").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}
