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
    <div className="flex min-h-svh flex-col">
      <div className="flex h-12 items-center gap-3 border-b bg-navbar px-3">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="hidden h-4 w-96 lg:block" />
      </div>
      <div className="border-b bg-card px-6 py-3">
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex gap-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-72 shrink-0 rounded-md" />
        ))}
      </div>
    </div>
  );
}
