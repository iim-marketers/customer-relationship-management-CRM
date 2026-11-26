import { ActivityIcon, CalendarXIcon, ClipboardListIcon, UserCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterBar } from "@/components/crm/filter-bar";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState, Panel } from "@/components/crm/panel";
import { StatCard } from "@/components/crm/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { addDaysYmd, RANGE_OPTIONS, resolveRange, ymdInTz } from "@/lib/dates";
import { getLookups, getProjectContext } from "@/lib/project";
import { percent } from "@/lib/utils";
import { TrendChart } from "./trend-chart";

export const metadata: Metadata = { title: "Reports" };

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | undefined>>;

type Row = { name: string; count: number; converted: number };
type Report = {
  total_leads: number;
  converted: number;
  total_contacts: number;
  appointments: number;
  no_show: number;
  completed: number;
  funnel: { name: string; color: string; kind: string; count: number }[];
  sources: Row[];
  services: Row[];
  team: Row[];
  daily: { day: string; count: number; converted: number }[];
};

export default function ReportsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <Reports params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Reports({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const sp = await searchParams;
  const ctx = await getProjectContext(slug);
  const lookups = await getLookups(slug);
  const range = resolveRange(sp.range, ctx.tz, new Date());

  const { data, error } = await ctx.supabase.rpc("report_stats", {
    p_project: ctx.project.id,
    p_from: range.from?.toISOString() ?? null,
    p_to: range.to?.toISOString() ?? null,
    p_branch: sp.branch ?? null,
    p_source: sp.source ?? null,
    p_service: sp.service ?? null,
    p_assigned: sp.assigned ?? null,
  });
  const r = data as Report | null;

  const filters = [
    { key: "branch", label: "Branch", allLabel: "All branches", options: lookups.branches.map((b) => ({ value: b.id, label: b.name })) },
    { key: "assigned", label: "Team member", allLabel: "Everyone", options: lookups.members.map((m) => ({ value: m.user_id, label: m.profile?.full_name || m.profile?.email || "Unknown" })) },
    { key: "source", label: "Source", allLabel: "All sources", options: lookups.sources.map((s) => ({ value: s.id, label: s.name })) },
    { key: "service", label: "Service", allLabel: "All services", options: lookups.services.map((s) => ({ value: s.id, label: s.name })) },
    { key: "range", label: "Date range", allLabel: "All time", options: RANGE_OPTIONS.filter((o) => o.value !== "all").map((o) => ({ ...o })) },
  ];

  const header = (
    <PageHeader title="Reports & Analytics" description={`Performance overview · ${range.label}`} search={<FilterBar filters={filters} />} />
  );

  if (error || !r) {
    return (
      <>
        {header}
        <EmptyState>Couldn&apos;t load the report{error ? `: ${error.message}` : ""}.</EmptyState>
      </>
    );
  }

  const daily = fillDays(r.daily, range.from ? ymdInTz(range.from, ctx.tz) : null, range.to ? addDaysYmd(ymdInTz(range.to, ctx.tz), -1) : ymdInTz(new Date(), ctx.tz));
  const funnelMax = Math.max(1, ...r.funnel.map((f) => f.count));
  const sourceMax = Math.max(1, ...r.sources.map((s) => s.count));

  return (
    <>
      {header}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Conversion rate" value={percent(r.converted, r.total_leads)} hint="Leads converted" icon={ActivityIcon} tone="muted" />
        <StatCard label="No-show rate" value={percent(r.no_show, r.appointments)} hint={`${r.no_show} of ${r.appointments} appointments`} icon={CalendarXIcon} tone="muted" />
        <StatCard label="Total leads" value={r.total_leads} hint="In selected scope" icon={ClipboardListIcon} tone="muted" />
        <StatCard label={`Total ${ctx.project.contact_label.toLowerCase()}`} value={r.total_contacts} hint="Added in this period" icon={UserCheckIcon} tone="muted" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Lead conversion funnel">
          {r.funnel.length === 0 ? (
            <EmptyState>No pipeline stages yet.</EmptyState>
          ) : (
            <MeterList
              rows={r.funnel.map((f) => ({ name: f.name, value: f.count, color: f.color, detail: `${f.count} leads · ${percent(f.count, r.total_leads)} of total` }))}
              max={funnelMax}
            />
          )}
        </Panel>

        <Panel title="Lead source breakdown">
          {r.sources.length === 0 ? (
            <EmptyState>No leads in this scope.</EmptyState>
          ) : (
            <MeterList
              rows={r.sources.map((s) => ({
                name: s.name,
                value: s.count,
                suffix: percent(s.count, r.total_leads),
                detail: `${s.count} leads · ${s.converted} converted (${percent(s.converted, s.count)})`,
              }))}
              max={sourceMax}
            />
          )}
        </Panel>
      </div>

      <Panel title="Leads over time" className="mb-4">
        {daily.length === 0 ? <EmptyState>No leads in this scope.</EmptyState> : <TrendChart data={daily} />}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Service breakdown" bodyClassName="p-0">
          <BreakdownTable rows={r.services} label="Service" />
        </Panel>
        <Panel title="Team performance" bodyClassName="p-0">
          <BreakdownTable rows={r.team} label="Team member" />
        </Panel>
      </div>
    </>
  );
}

function MeterList({
  rows,
  max,
}: {
  rows: { name: string; value: number; color?: string; suffix?: string; detail: string }[];
  max: number;
}) {
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.name}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 rounded-md px-1 py-0.5 hover:bg-muted/50 sm:grid-cols-[10rem_1fr_auto]">
                <span className="truncate text-right text-sm text-muted-foreground">{row.name}</span>
                <span className="h-3 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{
                      width: `${row.value ? Math.max(2, (row.value / max) * 100) : 0}%`,
                      ...(row.color ? { backgroundColor: row.color } : {}),
                    }}
                  />
                </span>
                <span className="min-w-16 text-right text-sm font-semibold tabular-nums">
                  {row.value}
                  {row.suffix && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{row.suffix}</span>}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="font-medium">{row.name}</span> · {row.detail}
            </TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

function BreakdownTable({ rows, label }: { rows: Row[]; label: string }) {
  if (rows.length === 0) return <EmptyState className="m-4">No data in this scope.</EmptyState>;
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-[11px] tracking-wider uppercase">
          <TableHead className="pl-4">{label}</TableHead>
          <TableHead className="text-right">Leads</TableHead>
          <TableHead className="text-right">Converted</TableHead>
          <TableHead className="pr-4 text-right">Conv. %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell className="max-w-56 truncate pl-4 font-medium">{row.name}</TableCell>
            <TableCell className="text-right tabular-nums">{row.count}</TableCell>
            <TableCell className="text-right tabular-nums">{row.converted}</TableCell>
            <TableCell className="pr-4 text-right tabular-nums">{percent(row.converted, row.count)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function fillDays(rows: Report["daily"], from: string | null, to: string) {
  if (rows.length === 0) return [];
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const start = from ?? rows[0].day;
  const end = to < rows[rows.length - 1].day ? rows[rows.length - 1].day : to;
  const out: Report["daily"] = [];
  for (let d = start, i = 0; d <= end && i < 366; d = addDaysYmd(d, 1), i++) {
    const hit = byDay.get(d);
    out.push({ day: d, count: hit?.count ?? 0, converted: hit?.converted ?? 0 });
  }
  return out.length >= 366 ? rows : out;
}

function ReportsSkeleton() {
  return (
    <div className="space-y-4 pt-3">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-20 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}
