import { PhoneCallIcon, PlayCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CallBadge } from "@/components/crm/badges";
import { FilterBar } from "@/components/crm/filter-bar";
import { PageHeader } from "@/components/crm/page-header";
import { Pager, pageWindow } from "@/components/crm/pager";
import { EmptyState } from "@/components/crm/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt, formatDuration, RANGE_OPTIONS, resolveRange, toZonedInput } from "@/lib/dates";
import { clientLookups, getLookups, getProjectContext } from "@/lib/project";
import type { CallLog } from "@/lib/types";
import { CallLogDialog } from "./call-log-dialog";
import { CallRowActions } from "./call-row-actions";

export const metadata: Metadata = { title: "Call Logs" };

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | undefined>>;

const STATUSES = ["answered", "missed", "busy", "failed"] as const;
const DIRECTIONS = ["incoming", "outgoing"] as const;

export default function CallLogsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CallLogs params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CallLogs({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const sp = await searchParams;
  const ctx = await getProjectContext(slug);
  const lookups = await getLookups(slug);
  const now = new Date();
  const range = resolveRange(sp.range, ctx.tz, now);
  const { page, from, to } = pageWindow(sp.page);

  let query = ctx.supabase
    .from("call_logs")
    .select(
      "id, lead_id, contact_id, contact_name, phone, direction, status, agent_status, handled_by, branch_id, duration_seconds, recording_url, called_at",
      { count: "exact" },
    )
    .eq("project_id", ctx.project.id)
    .order("called_at", { ascending: false })
    .range(from, to);
  if (sp.status && (STATUSES as readonly string[]).includes(sp.status)) query = query.eq("status", sp.status);
  if (sp.direction && (DIRECTIONS as readonly string[]).includes(sp.direction)) query = query.eq("direction", sp.direction);
  if (sp.branch) query = query.eq("branch_id", sp.branch);
  if (range.from) query = query.gte("called_at", range.from.toISOString());
  if (range.to) query = query.lt("called_at", range.to.toISOString());

  const { data, count, error } = await query;
  const calls = (data ?? []) as CallLog[];
  const total = count ?? 0;
  const branchName = (id: string | null) => lookups.branches.find((b) => b.id === id)?.name ?? "—";
  const base = `/p/${slug}`;

  const filters = [
    { key: "status", label: "Status", allLabel: "All statuses", options: STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) },
    { key: "direction", label: "Type", allLabel: "All types", options: DIRECTIONS.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) })) },
    { key: "branch", label: "Branch", allLabel: "All branches", options: lookups.branches.map((b) => ({ value: b.id, label: b.name })) },
    { key: "range", label: "Date range", allLabel: "All time", options: RANGE_OPTIONS.filter((o) => o.value !== "all").map((o) => ({ ...o })) },
  ];

  return (
    <>
      <PageHeader
        title="Call Logs"
        description={`${total} ${total === 1 ? "call" : "calls"} · ${range.label}`}
        actions={
          <CallLogDialog
            slug={slug}
            lookups={clientLookups(lookups)}
            defaultWhen={toZonedInput(now, ctx.tz)}
            trigger={
              <Button>
                <PhoneCallIcon /> Log call
              </Button>
            }
          />
        }
      />
      <FilterBar filters={filters} />

      {error ? (
        <EmptyState>Couldn&apos;t load calls: {error.message}</EmptyState>
      ) : calls.length === 0 ? (
        <EmptyState>No calls match these filters.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card/90">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px] tracking-wider uppercase">
                <TableHead className="pl-4">When</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Handled by</TableHead>
                <TableHead>Agent status</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Recording</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((c) => {
                const name = c.contact_name || c.phone;
                const href = c.lead_id ? `${base}/leads/${c.lead_id}` : c.contact_id ? `${base}/contacts/${c.contact_id}` : null;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4 whitespace-nowrap text-muted-foreground">{fmt.dateTime(c.called_at, ctx.tz)}</TableCell>
                    <TableCell className="max-w-48 truncate font-medium">
                      {href ? (
                        <Link href={href} className="text-info hover:underline">
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{c.phone}</TableCell>
                    <TableCell className="max-w-40 truncate">{branchName(c.branch_id)}</TableCell>
                    <TableCell>
                      <CallBadge status={c.status} />
                    </TableCell>
                    <TableCell className="capitalize">{c.direction}</TableCell>
                    <TableCell className="max-w-40 truncate">{c.handled_by ?? "—"}</TableCell>
                    <TableCell>
                      {c.agent_status ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          {c.agent_status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatDuration(c.duration_seconds)}</TableCell>
                    <TableCell>
                      {c.recording_url && /^https?:\/\//i.test(c.recording_url) ? (
                        <a
                          href={c.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-info hover:underline"
                        >
                          <PlayCircleIcon className="size-4" /> Play
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <CallRowActions slug={slug} callId={c.id} hasLead={Boolean(c.lead_id)} canDelete={ctx.canDelete} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager pathname={`${base}/call-logs`} searchParams={sp} page={page} total={total} />
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4 pt-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
