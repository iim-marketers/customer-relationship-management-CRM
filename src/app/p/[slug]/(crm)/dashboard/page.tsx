import { ActivityIcon, CalendarCheckIcon, ListChecksIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppointmentBadge, ColorBadge, StageBadge } from "@/components/crm/badges";
import { FilterBar } from "@/components/crm/filter-bar";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState, Panel } from "@/components/crm/panel";
import { StatCard } from "@/components/crm/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { RANGE_OPTIONS, fmt, resolveRange } from "@/lib/dates";
import { getLookups, getProjectContext } from "@/lib/project";
import type { Appointment, Lead } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ range?: string }> };

export default function DashboardPage(props: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard {...props} />
    </Suspense>
  );
}

type Stats = {
  total_leads: number;
  converted: number;
  booked: number;
  no_show: number;
  repeat: number;
  stages: { id: string; name: string; color: string; kind: string; count: number }[];
};

async function Dashboard({ params, searchParams }: Props) {
  const { slug } = await params;
  const { range } = await searchParams;
  const ctx = await getProjectContext(slug);
  const { supabase, project, tz, base } = ctx;
  const lookups = await getLookups(slug);
  const now = new Date();
  const r = resolveRange(range, tz, now);
  const pid = project.id;

  const [stats, repeats, followUps, upcoming, recent] = await Promise.all([
    supabase.rpc("dashboard_stats", {
      p_project: pid,
      p_from: r.from?.toISOString() ?? null,
      p_to: r.to?.toISOString() ?? null,
    }),
    supabase
      .from("leads")
      .select("id, name, phone, source_id, enquiry_count, last_enquiry_at")
      .eq("project_id", pid)
      .gt("enquiry_count", 1)
      .order("last_enquiry_at", { ascending: false })
      .limit(5),
    supabase
      .from("leads")
      .select("id, name, notes, stage_id, source_id, service_id, follow_up_at")
      .eq("project_id", pid)
      .is("contact_id", null)
      .not("follow_up_at", "is", null)
      .order("follow_up_at", { ascending: true })
      .limit(6),
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, branch_id, lead:leads(id, name, phone), contact:contacts(id, name, phone)")
      .eq("project_id", pid)
      .in("status", ["scheduled", "confirmed", "rescheduled"])
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("leads")
      .select("id, name, phone, stage_id, source_id, created_at")
      .eq("project_id", pid)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const s = (stats.data ?? { total_leads: 0, converted: 0, booked: 0, no_show: 0, repeat: 0, stages: [] }) as Stats;
  const stageOf = (id: string) => lookups.stages.find((x) => x.id === id);
  const sourceName = (id: string | null) => lookups.sources.find((x) => x.id === id)?.name ?? "Unknown source";
  const serviceName = (id: string | null) => lookups.services.find((x) => x.id === id)?.name ?? "Not set";
  const branchName = (id: string | null) => lookups.branches.find((x) => x.id === id)?.name;

  return (
    <>
      <PageHeader title="Dashboard" description={`${r.label} · ${project.name}`} />
      <FilterBar
        filters={[{ key: "range", label: "Date range", allLabel: "All time", options: RANGE_OPTIONS.filter((o) => o.value !== "all") }]}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total leads" value={s.total_leads} hint={`${s.repeat} with repeat enquiries`} />
        <StatCard label="Booked appointments" value={s.booked} hint="Scheduled, confirmed or rescheduled" tone="info" />
        <StatCard label="No-show appointments" value={s.no_show} hint="Needs recovery follow-up" tone="warning" />
        <StatCard
          label={`${project.contact_label.replace(/s$/, "")} conversion`}
          value={percent(s.converted, s.total_leads)}
          hint={`${s.converted} converted leads`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Lead Pipeline" icon={ActivityIcon} bodyClassName="p-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {s.stages.map((st) => (
                <Link
                  key={st.id}
                  href={`${base}/leads?stage=${st.id}${range ? `&range=${range}` : ""}`}
                  className="min-w-28 flex-1 rounded-xl border bg-background/40 p-3 transition hover:border-primary/50"
                >
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: st.color }} />
                    <span className="truncate">{st.name}</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold tabular-nums">{st.count}</div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Repeat Enquiries" icon={RefreshCwIcon} bodyClassName="p-2">
            {(repeats.data ?? []).length === 0 ? (
              <EmptyState className="m-2">No repeat enquiries yet — duplicates by phone show up here.</EmptyState>
            ) : (
              <ul className="divide-y">
                {(repeats.data ?? []).map((l) => (
                  <li key={l.id}>
                    <Link href={`${base}/leads/${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{l.name}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {l.enquiry_count} enquiries · latest via {sourceName(l.source_id)} · {l.phone}
                        </div>
                        <div className="text-xs text-muted-foreground">{fmt.dateTime(l.last_enquiry_at, tz)}</div>
                      </div>
                      <ColorBadge color="#f97316">Re-enquiry</ColorBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Newest Leads"
            icon={SparklesIcon}
            bodyClassName="p-2"
            action={
              <Link href={`${base}/leads?view=list`} className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            }
          >
            {(recent.data ?? []).length === 0 ? (
              <EmptyState className="m-2">
                No leads yet. Add one from <Link href={`${base}/leads`} className="text-primary underline">Leads</Link> or connect the
                webhook in Settings → Integrations.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {(recent.data ?? []).map((l) => (
                  <li key={l.id}>
                    <Link href={`${base}/leads/${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{l.name}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {sourceName(l.source_id)} · {l.phone ?? "no phone"} · {fmt.dateTime(l.created_at, tz)}
                        </div>
                      </div>
                      <StageBadge stage={stageOf(l.stage_id)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title="Follow-up Queue"
            icon={ListChecksIcon}
            bodyClassName="p-2"
            action={
              <Link href={`${base}/todo`} className="text-sm font-medium text-primary hover:underline">
                Open To-Do
              </Link>
            }
          >
            {(followUps.data ?? []).length === 0 ? (
              <EmptyState className="m-2">No follow-ups scheduled.</EmptyState>
            ) : (
              <ul className="divide-y">
                {(followUps.data as Pick<Lead, "id" | "name" | "notes" | "stage_id" | "source_id" | "service_id" | "follow_up_at">[]).map((l) => {
                  const overdue = l.follow_up_at! < now.toISOString();
                  return (
                    <li key={l.id}>
                      <Link href={`${base}/leads/${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
                        <span className={cn("size-2 shrink-0 rounded-full", overdue ? "bg-destructive" : "bg-primary")} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{l.name}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            {sourceName(l.source_id)} / {l.notes || serviceName(l.service_id)}
                          </div>
                          <div className={cn("text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
                            {fmt.dateTime(l.follow_up_at, tz)}
                            {overdue && " · overdue"}
                          </div>
                        </div>
                        <StageBadge stage={stageOf(l.stage_id)} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Upcoming Appointments"
            icon={CalendarCheckIcon}
            bodyClassName="p-2"
            action={
              <Link href={`${base}/appointments`} className="text-sm font-medium text-primary hover:underline">
                Calendar
              </Link>
            }
          >
            {(upcoming.data ?? []).length === 0 ? (
              <EmptyState className="m-2">No upcoming appointments</EmptyState>
            ) : (
              <ul className="divide-y">
                {(upcoming.data as unknown as Appointment[]).map((a) => {
                  const who = a.contact ?? a.lead;
                  const href = a.contact ? `${base}/contacts/${a.contact.id}` : a.lead ? `${base}/leads/${a.lead.id}` : `${base}/appointments`;
                  return (
                    <li key={a.id}>
                      <Link href={href} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
                        <div className="w-14 shrink-0 text-center">
                          <div className="text-xs text-muted-foreground uppercase">{fmt.date(a.scheduled_at, tz).split(" ").slice(0, 2).join(" ")}</div>
                          <div className="font-semibold tabular-nums">{fmt.time(a.scheduled_at, tz)}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{who?.name ?? "—"}</div>
                          <div className="truncate text-sm text-muted-foreground">{branchName(a.branch_id) ?? who?.phone}</div>
                        </div>
                        <AppointmentBadge status={a.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 pt-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
