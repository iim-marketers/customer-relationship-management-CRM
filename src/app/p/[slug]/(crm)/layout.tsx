import { Suspense } from "react";
import { AppShell } from "@/components/crm/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { dayBounds, ymdInTz } from "@/lib/dates";
import { getProjectContext } from "@/lib/project";
import { ROLE_LABELS } from "@/lib/types";
import { readableOn } from "@/lib/utils";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

export default function CrmLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell params={params}>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children, params }: Props) {
  const { slug } = await params;
  const { supabase, project, profile, user, role } = await getProjectContext(slug);

  const now = new Date();
  const today = dayBounds(ymdInTz(now, project.timezone), project.timezone);
  const [followUps, tasks, appts] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .is("contact_id", null)
      .lt("follow_up_at", now.toISOString()),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .is("completed_at", null)
      .lt("due_at", now.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .in("status", ["scheduled", "confirmed", "rescheduled"])
      .gte("scheduled_at", today.from.toISOString())
      .lt("scheduled_at", today.to.toISOString()),
  ]);

  const brand = project.brand_color;
  const style = brand
    ? ({
        "--primary": brand,
        "--ring": brand,
        "--sidebar-primary": brand,
        "--primary-foreground": readableOn(brand),
      } as React.CSSProperties)
    : undefined;

  return (
    <div style={style}>
      <AppShell
        project={project}
        user={{ name: profile?.full_name || user.email || "You", roleLabel: ROLE_LABELS[role] }}
        alerts={{
          overdueFollowUps: followUps.count ?? 0,
          overdueTasks: tasks.count ?? 0,
          todayAppointments: appts.count ?? 0,
        }}
      >
        {children}
      </AppShell>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh gap-3 p-3">
      <Skeleton className="hidden h-[calc(100svh-1.5rem)] w-60 rounded-2xl lg:block" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
