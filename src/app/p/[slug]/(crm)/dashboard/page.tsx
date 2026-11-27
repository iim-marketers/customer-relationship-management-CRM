import { io } from "next/cache";
import {
  ActivityIcon,
  CalendarCheckIcon,
  CalendarXIcon,
  ClipboardListIcon,
  InboxIcon,
  ListChecksIcon,
  RefreshCwIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  AppointmentBadge,
  ColorBadge,
  StageBadge,
} from "@/components/crm/badges";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState, Panel } from "@/components/crm/panel";
import { RangeSelect } from "@/components/crm/range-select";
import { StatCard } from "@/components/crm/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmt, resolveRange } from "@/lib/dates";
import { getLookups, getProjectContext } from "@/lib/project";
import type { Appointment, Lead } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

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
  stages: {
    id: string;
    name: string;
    color: string;
    kind: string;
    count: number;
  }[];
};

async function Dashboard({ params, searchParams }: Props) {
  const { slug } = await params;
  const { range } = await searchParams;
  const ctx = await getProjectContext(slug);
  const { supabase, project, tz, base } = ctx;
  const lookups = await getLookups(slug);
  await io();
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
      .select(
        "id, scheduled_at, status, branch_id, lead:leads(id, name, phone), contact:contacts(id, name, phone)",
      )
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

  const s = (stats.data ?? {
    total_leads: 0,
    converted: 0,
    booked: 0,
    no_show: 0,
    repeat: 0,
    stages: [],
  }) as Stats;
  const stageOf = (id: string) => lookups.stages.find((x) => x.id === id);
  const sourceName = (id: string | null) =>
    lookups.sources.find((x) => x.id === id)?.name ?? "Unknown source";
  const serviceName = (id: string | null) =>
    lookups.services.find((x) => x.id === id)?.name ?? "Not set";
  const branchName = (id: string | null) =>
    lookups.branches.find((x) => x.id === id)?.name;

  const stageTotal = s.stages.reduce((n, st) => n + st.count, 0);
  const rangeQs = range ? `&range=${range}` : "";
  const viewAll = (href: string, label: string) => (
    <Link
      href={href}
      className="text-sm font-medium text-primary hover:underline"
    >
      {label}
    </Link>
  );
  const rowClass =
    "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/60";
  const emptyClass = "border-0 bg-transparent py-10";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${r.label} · ${project.name}`}
        actions={<RangeSelect />}
      />

      <div className="flex flex-col gap-6 pt-2">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total leads"
            value={s.total_leads}
            hint={`${s.repeat} with repeat enquiries`}
            icon={ClipboardListIcon}
            tone="muted"
          />
          <StatCard
            label="Booked appointments"
            value={s.booked}
            hint="Scheduled, confirmed or rescheduled"
            icon={CalendarCheckIcon}
            tone="info"
          />
          <StatCard
            label="No-show appointments"
            value={s.no_show}
            hint="Needs recovery follow-up"
            icon={CalendarXIcon}
            tone="warning"
          />
          <StatCard
            label={`${project.contact_label.replace(/s$/, "")} conversion`}
            value={percent(s.converted, s.total_leads)}
            hint={`${s.converted} converted leads`}
            icon={TrendingUpIcon}
            tone="success"
          />
        </div>

        <Panel
          title="Lead Pipeline"
          icon={ActivityIcon}
          bodyClassName="flex flex-col gap-4 p-5"
          action={viewAll(
            `${base}/leads${range ? `?range=${range}` : ""}`,
            "Open pipeline",
          )}
        >
          <div
            className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            {stageTotal > 0 &&
              s.stages.map((st) =>
                st.count > 0 ? (
                  <span
                    key={st.id}
                    style={{
                      width: `${(st.count / stageTotal) * 100}%`,
                      background: st.color,
                    }}
                  />
                ) : null,
              )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
            {s.stages.map((st) => (
              <Link
                key={st.id}
                href={`${base}/leads?stage=${st.id}${rangeQs}`}
                className="group rounded-lg border bg-background/50 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: st.color }}
                  />
                  <span className="truncate" title={st.name}>
                    {st.name}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-semibold tabular-nums">
                    {st.count}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {percent(st.count, stageTotal)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Follow-up Queue"
            icon={ListChecksIcon}
            bodyClassName="p-2"
            action={viewAll(`${base}/todo`, "Open To-Do")}
          >
            {(followUps.data ?? []).length === 0 ? (
              <EmptyState icon={ListChecksIcon} className={emptyClass}>
                No follow-ups scheduled.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {(
                  followUps.data as Pick<
                    Lead,
                    | "id"
                    | "name"
                    | "notes"
                    | "stage_id"
                    | "source_id"
                    | "service_id"
                    | "follow_up_at"
                  >[]
                ).map((l) => {
                  const overdue = l.follow_up_at! < now.toISOString();
                  return (
                    <li key={l.id}>
                      <Link href={`${base}/leads/${l.id}`} className={rowClass}>
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            overdue ? "bg-destructive" : "bg-primary",
                          )}
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="truncate font-medium">{l.name}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            {sourceName(l.source_id)} /{" "}
                            {l.notes || serviceName(l.service_id)}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              overdue
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
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
            action={viewAll(`${base}/appointments`, "Calendar")}
          >
            {(upcoming.data ?? []).length === 0 ? (
              <EmptyState icon={CalendarCheckIcon} className={emptyClass}>
                No upcoming appointments.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {(upcoming.data as unknown as Appointment[]).map((a) => {
                  const who = a.contact ?? a.lead;
                  const href = a.contact
                    ? `${base}/contacts/${a.contact.id}`
                    : a.lead
                      ? `${base}/leads/${a.lead.id}`
                      : `${base}/appointments`;
                  return (
                    <li key={a.id}>
                      <Link href={href} className={rowClass}>
                        <div className="w-14 shrink-0 rounded-md bg-muted/60 py-1 text-center">
                          <div className="text-[11px] text-muted-foreground uppercase">
                            {fmt
                              .date(a.scheduled_at, tz)
                              .split(" ")
                              .slice(0, 2)
                              .join(" ")}
                          </div>
                          <div className="text-sm font-semibold tabular-nums">
                            {fmt.time(a.scheduled_at, tz)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="truncate font-medium">
                            {who?.name ?? "—"}
                          </div>
                          <div className="truncate text-sm text-muted-foreground">
                            {branchName(a.branch_id) ?? who?.phone}
                          </div>
                        </div>
                        <AppointmentBadge status={a.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Newest Leads"
            icon={SparklesIcon}
            bodyClassName="p-2"
            action={viewAll(`${base}/leads?view=list`, "View all")}
          >
            {(recent.data ?? []).length === 0 ? (
              <EmptyState icon={InboxIcon} className={emptyClass}>
                No leads yet. Add one from{" "}
                <Link
                  href={`${base}/leads`}
                  className="font-medium text-primary hover:underline"
                >
                  Leads
                </Link>{" "}
                or connect the webhook in Settings → Integrations.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {(recent.data ?? []).map((l) => (
                  <li key={l.id}>
                    <Link href={`${base}/leads/${l.id}`} className={rowClass}>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="truncate font-medium">{l.name}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {sourceName(l.source_id)} · {l.phone ?? "no phone"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fmt.dateTime(l.created_at, tz)}
                        </div>
                      </div>
                      <StageBadge stage={stageOf(l.stage_id)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Recent Repeat Enquiries"
            icon={RefreshCwIcon}
            bodyClassName="p-2"
          >
            {(repeats.data ?? []).length === 0 ? (
              <EmptyState icon={RefreshCwIcon} className={emptyClass}>
                No repeat enquiries yet — duplicates by phone show up here.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {(repeats.data ?? []).map((l) => (
                  <li key={l.id}>
                    <Link href={`${base}/leads/${l.id}`} className={rowClass}>
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="truncate font-medium">{l.name}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {l.enquiry_count} enquiries · latest via{" "}
                          {sourceName(l.source_id)} · {l.phone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fmt.dateTime(l.last_enquiry_at, tz)}
                        </div>
                      </div>
                      <ColorBadge color="#f97316">Re-enquiry</ColorBadge>
                    </Link>
                  </li>
                ))}
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
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-44 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
