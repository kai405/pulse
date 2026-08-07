import { AppShell } from "@/components/app-shell";
import { getOwnedSessionOverview } from "@/lib/db/session-summaries";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const { weeklyCount, weeklyGoal, workspace } = await getOwnedSessionOverview();
  return <AppShell weeklyCount={weeklyCount} weeklyGoal={weeklyGoal} workspace={workspace}>{children}</AppShell>;
}
