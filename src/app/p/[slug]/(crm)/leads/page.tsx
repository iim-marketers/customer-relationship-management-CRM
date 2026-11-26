import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LeadFormDialog } from "@/components/crm/dialogs/lead-form-dialog";
import { FilterBar } from "@/components/crm/filter-bar";
import { PageHeader } from "@/components/crm/page-header";
import { RefreshButton } from "@/components/crm/refresh-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RANGE_OPTIONS, resolveRange } from "@/lib/dates";
import { clientLookups, getLookups, getProjectContext, type ProjectContext } from "@/lib/project";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LeadsKanban } from "./leads-kanban";
import { LeadsTable } from "./leads-table";

export const metadata: Metadata = { title: "Leads" };

type SP = { view?: string; stage?: string; branch?: string; assigned?: string; source?: string; service?: string; range?: string; page?: string };
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

const PAGE_SIZE = 50;
const KANBAN_LIMIT = 40;
const LEAD_LIST_COLS =
  "id, project_id, name, phone, email, stage_id, source_id, service_id, branch_id, assigned_to, contact_id, notes, follow_up_at, enquiry_count, last_enquiry_at, created_at, updated_at";

export default function LeadsPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 pt-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-20 rounded-2xl" />
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <Leads {...props} />
    </Suspense>
  );
}

/** Base leads query with the URL filters applied. */
function leadQuery(ctx: ProjectContext, sp: SP, range: { from: Date | null; to: Date | null }) {
  let q = ctx.supabase.from("leads").select(LEAD_LIST_COLS, { count: "exact" }).eq("project_id", ctx.project.id);
  if (sp.branch) q = q.eq("branch_id", sp.branch);
  if (sp.source) q = q.eq("source_id", sp.source);
  if (sp.service) q = q.eq("service_id", sp.service);
  if (sp.assigned === "none") q = q.is("assigned_to", null);
  else if (sp.assigned) q = q.eq("assigned_to", sp.assigned);
  if (range.from) q = q.gte("created_at", range.from.toISOString());
  if (range.to) q = q.lt("created_at", range.to.toISOString());
  return q;
}

async function Leads({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const ctx = await getProjectContext(slug);
  const lookups = await getLookups(slug);
  const cl = clientLookups(lookups);
  const view = sp.view === "list" ? "list" : "kanban";
  const now = new Date();
  const range = resolveRange(sp.range, ctx.tz, now);

  const filters = (
    <FilterBar
      keep={["view"]}
      filters={[
        { key: "stage", label: "Status", allLabel: "All statuses", options: lookups.stages.map((s) => ({ value: s.id, label: s.name })) },
        { key: "branch", label: "Branch", allLabel: "All branches", options: lookups.branches.map((b) => ({ value: b.id, label: b.name })) },
        {
          key: "assigned",
          label: "Assigned to",
          allLabel: "Everyone",
          options: [{ value: "none", label: "Unassigned" }, ...cl.members.map((m) => ({ value: m.id, label: m.name }))],
        },
        { key: "source", label: "Source", allLabel: "All sources", options: lookups.sources.map((s) => ({ value: s.id, label: s.name })) },
        { key: "service", label: "Service", allLabel: "All services", options: lookups.services.map((s) => ({ value: s.id, label: s.name })) },
        { key: "range", label: "Date range", allLabel: "All time", options: RANGE_OPTIONS.filter((o) => o.value !== "all") },
      ]}
    />
  );

  const qs = (patch: Partial<SP>) => {
    const next = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `?${next}`;
  };

  let body: React.ReactNode;
  let total = 0;

  if (view === "kanban") {
    const stages = sp.stage ? lookups.stages.filter((s) => s.id === sp.stage) : lookups.stages;
    const columns = await Promise.all(
      stages.map(async (stage) => {
        const { data, count } = await leadQuery(ctx, sp, range)
          .eq("stage_id", stage.id)
          .order("created_at", { ascending: false }).limit(KANBAN_LIMIT);
        return { stage, leads: (data ?? []) as Lead[], count: count ?? 0 };
      }),
    );
    total = columns.reduce((n, c) => n + c.count, 0);
    body = <LeadsKanban slug={slug} tz={ctx.tz} lookups={cl} columns={columns} canDelete={ctx.canDelete} limit={KANBAN_LIMIT} />;
  } else {
    const page = Math.max(1, Number(sp.page) || 1);
    let q = leadQuery(ctx, sp, range);
    if (sp.stage) q = q.eq("stage_id", sp.stage);
    const { data, count } = await q.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    total = count ?? 0;
    body = (
      <LeadsTable
        slug={slug}
        tz={ctx.tz}
        lookups={cl}
        leads={(data ?? []) as Lead[]}
        page={page}
        pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        prevHref={qs({ page: String(page - 1) })}
        nextHref={qs({ page: String(page + 1) })}
        nowIso={now.toISOString()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Lead Management"
        description={`${total.toLocaleString("en-IN")} ${range.key === "all" ? "" : `${range.label.toLowerCase()} · `}leads`}
        actions={<LeadActions ctx={ctx} cl={cl} view={view} qs={qs} />}
      />
      {filters}
      {body}
    </>
  );
}

function LeadActions({
  ctx,
  cl,
  view,
  qs,
}: {
  ctx: ProjectContext;
  cl: ReturnType<typeof clientLookups>;
  view: "kanban" | "list";
  qs: (p: Partial<SP>) => string;
}) {
  return (
    <>
      <div className="flex rounded-lg border bg-card p-0.5">
        {(["kanban", "list"] as const).map((v) => (
          <Link
            key={v}
            href={qs({ view: v === "kanban" ? undefined : v, page: undefined })}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-semibold capitalize transition",
              view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v}
          </Link>
        ))}
      </div>
      <RefreshButton />
      <LeadFormDialog
        slug={ctx.project.slug}
        tz={ctx.tz}
        lookups={cl}
        trigger={
          <Button>
            <PlusIcon /> Add lead
          </Button>
        }
      />
    </>
  );
}
