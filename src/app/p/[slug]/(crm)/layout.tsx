import type { SupabaseClient } from "@supabase/supabase-js";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AppShell } from "@/components/crm/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { dayBounds, formatInTz, ymdInTz } from "@/lib/dates";
import { getProjectContext } from "@/lib/project";
import { ROLE_LABELS, type Project } from "@/lib/types";

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
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <AppShell
      project={project}
      user={{ name: profile?.full_name || user.email || "You", roleLabel: ROLE_LABELS[role] }}
      alerts={loadAlerts(supabase, project)}
      defaultOpen={sidebarOpen}
      today={formatInTz(new Date(), project.timezone, { weekday: "short", day: "numeric", month: "short" })}
    >
      {children}
    </AppShell>
  );
}

async function loadAlerts(supabase: SupabaseClient, project: Pick<Project, "id" | "timezone">) {
  await io();
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

  return {
    overdueFollowUps: followUps.count ?? 0,
    overdueTasks: tasks.count ?? 0,
    todayAppointments: appts.count ?? 0,
  };
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh">
      <div className="hidden w-64 shrink-0 flex-col gap-2 border-r bg-sidebar p-2 md:flex">
        <div className="flex items-center gap-2 p-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="mx-2 h-6" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center gap-3 border-b bg-navbar px-3">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto hidden h-6 w-28 sm:block" />
        </div>
        <div className="border-b bg-card px-6 py-3">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-4 overflow-hidden p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-72 shrink-0 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
