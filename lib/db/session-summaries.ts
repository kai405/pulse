import type { SessionSummary } from "@/lib/demo-data";
import type { PracticeMode } from "@/lib/product";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProgressPoint = {
  label: string;
  score: number;
  pace: number;
  fillers: number;
  engagement: number;
};

type WorkspaceKind = "demo" | "guest" | "account";

export async function getOwnedSessionOverview(): Promise<{ sessions: SessionSummary[]; progress: ProgressPoint[]; weeklyCount: number; weeklyGoal: number; workspace: WorkspaceKind }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { sessions: [], progress: [], weeklyCount: 0, weeklyGoal: 3, workspace: "demo" };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sessions: [], progress: [], weeklyCount: 0, weeklyGoal: 3, workspace: "demo" };
  const workspace: WorkspaceKind = user.is_anonymous ? "guest" : "account";
  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase.from("practice_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("weekly_session_goal").eq("user_id", user.id).maybeSingle(),
  ]);
  const weeklyGoal = profile?.weekly_session_goal ?? 3;
  if (!rows?.length) return { sessions: [], progress: [], weeklyCount: 0, weeklyGoal, workspace };
  const sessionIds = rows.map((row) => row.id);
  const { data: analyses } = await supabase.from("analysis_results").select("*").eq("user_id", user.id).in("session_id", sessionIds);
  const activeAnalyses = (analyses ?? []).filter((analysis) => rows.some((row) => row.id === analysis.session_id && row.active_analysis_version === analysis.analysis_version));
  const analysisIds = activeAnalyses.map((analysis) => analysis.id);
  const { data: metrics } = analysisIds.length
    ? await supabase.from("metric_results").select("*").eq("user_id", user.id).in("analysis_id", analysisIds).in("metric_key", ["pace", "fillers", "camera_engagement"])
    : { data: [] };
  const analysisBySession = new Map(activeAnalyses.map((analysis) => [analysis.session_id, analysis]));
  const sessions: SessionSummary[] = rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    prompt: row.prompt_snapshot,
    mode: row.mode as PracticeMode,
    durationSeconds: Number(row.recording_duration_seconds ?? 0),
    targetSeconds: row.target_seconds,
    score: analysisBySession.get(row.id)?.overall_score ?? null,
    status: normalizeStatus(row.status),
  }));
  const progress = rows.slice().reverse().flatMap((row) => {
    const analysis = analysisBySession.get(row.id);
    if (!analysis || analysis.overall_score === null || row.status !== "completed") return [];
    const metric = (key: string) => metrics?.find((item) => item.analysis_id === analysis.id && item.metric_key === key)?.numeric_value;
    return [{
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(row.created_at)),
      score: analysis.overall_score,
      pace: Number(metric("pace") ?? 0),
      fillers: Number(metric("fillers") ?? 0),
      engagement: Number(metrics?.find((item) => item.analysis_id === analysis.id && item.metric_key === "camera_engagement")?.score ?? 0),
    }];
  });
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weeklyCount = sessions.filter((session) => new Date(session.createdAt) >= weekStart).length;
  return { sessions, progress, weeklyCount, weeklyGoal, workspace };
}

function normalizeStatus(status: string): SessionSummary["status"] {
  if (["completed", "partial", "incomplete", "failed"].includes(status)) return status as SessionSummary["status"];
  return "processing";
}
