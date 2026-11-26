import { CalendarCheckIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppointmentStatusMenu } from "@/components/crm/appointment-status-menu";
import { DayStrip } from "@/components/crm/day-strip";
import { AppointmentDialog } from "@/components/crm/dialogs/appointment-dialog";
import { FilterBar } from "@/components/crm/filter-bar";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState, Panel } from "@/components/crm/panel";
import { RefreshButton } from "@/components/crm/refresh-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addDaysYmd, dayBounds, fmt, isYmd, weekStart, ymdInTz } from "@/lib/dates";
import { clientLookups, getLookups, getProjectContext } from "@/lib/project";
import { APPOINTMENT_STATUSES, type Appointment } from "@/lib/types";
import { AppointmentRowActions } from "./row-actions";

export const metadata: Metadata = { title: "Appointments" };

type SP = { date?: string; branch?: string; status?: string; assigned?: string };
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export default function AppointmentsPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 pt-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      }
    >
      <Appointments {...props} />
    </Suspense>
  );
}

async function Appointments({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const ctx = await getProjectContext(slug);
  const { supabase, project, tz, base } = ctx;
  const lookups = await getLookups(slug);
  const cl = clientLookups(lookups);

  const now = new Date();
  const today = ymdInTz(now, tz);
  const selected = isYmd(sp.date) ? sp.date : today;
  const day = dayBounds(selected, tz);
  const monday = weekStart(selected);
  const week = { from: dayBounds(monday, tz).from, to: dayBounds(addDaysYmd(monday, 6), tz).to };

  let q = supabase
    .from("appointments")
    .select("*, lead:leads(id, name, phone), contact:contacts(id, name, phone)")
    .eq("project_id", project.id)
    .gte("scheduled_at", day.from.toISOString())
    .lt("scheduled_at", day.to.toISOString());
  let wq = supabase
    .from("appointments")
    .select("scheduled_at")
    .eq("project_id", project.id)
    .neq("status", "cancelled")
    .gte("scheduled_at", week.from.toISOString())
    .lt("scheduled_at", week.to.toISOString());
  if (sp.branch) {
    q = q.eq("branch_id", sp.branch);
    wq = wq.eq("branch_id", sp.branch);
  }
  if (sp.assigned) {
    q = q.eq("assigned_to", sp.assigned);
    wq = wq.eq("assigned_to", sp.assigned);
  }
  if (sp.status && APPOINTMENT_STATUSES.some((s) => s.value === sp.status)) q = q.eq("status", sp.status);

  const [{ data, error }, { data: weekRows }] = await Promise.all([q.order("scheduled_at"), wq]);
  const rows = (data ?? []) as unknown as Appointment[];
  const marked = [...new Set((weekRows ?? []).map((r) => ymdInTz(new Date(r.scheduled_at), tz)))];
  const dayLabel = selected === today ? "Today" : fmt.longDay(selected);
  const find = (list: { id: string; name: string }[], id: string | null) => list.find((x) => x.id === id)?.name;
  const defaultWhen = `${selected}T${selected === today ? fmt.time(new Date(now.getTime() + 3600_000).toISOString(), tz).slice(0, 2) : "10"}:00`;

  return (
    <>
      <PageHeader
        title="Appointments"
        description={`${rows.length} appointment${rows.length === 1 ? "" : "s"} · ${dayLabel}`}
        actions={
          <>
            <RefreshButton />
            <AppointmentDialog
              slug={slug}
              projectId={project.id}
              contactLabel={project.contact_label}
              lookups={cl}
              defaultWhen={defaultWhen}
              trigger={
                <Button>
                  <PlusIcon /> Book
                </Button>
              }
            />
          </>
        }
        search={
          <FilterBar
            keep={["date"]}
            filters={[
              { key: "branch", label: "Branch", allLabel: "All branches", options: lookups.branches.map((b) => ({ value: b.id, label: b.name })) },
              { key: "status", label: "Status", allLabel: "All statuses", options: APPOINTMENT_STATUSES },
              { key: "assigned", label: "With", allLabel: "Everyone", options: cl.members.map((m) => ({ value: m.id, label: m.name })) },
            ]}
          />
        }
      />
      <DayStrip selected={selected} today={today} marked={marked} />
      <Panel title={dayLabel} icon={CalendarCheckIcon} bodyClassName="p-2">
        {error ? (
          <EmptyState className="m-2">Couldn&apos;t load appointments: {error.message}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState className="m-2">No appointments scheduled for {dayLabel}.</EmptyState>
        ) : (
          <ul className="divide-y">
            {rows.map((a) => {
              const who = a.contact ?? a.lead;
              const href = a.contact ? `${base}/contacts/${a.contact.id}` : a.lead ? `${base}/leads/${a.lead.id}` : null;
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-2 py-3 sm:flex-nowrap">
                  <div className="w-16 shrink-0 text-center">
                    <div className="text-lg font-bold tabular-nums">{fmt.time(a.scheduled_at, tz)}</div>
                    <div className="text-xs text-muted-foreground">{a.duration_minutes} min</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <Link href={href} className="font-semibold hover:underline">
                        {who?.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">Deleted record</span>
                    )}
                    <div className="truncate text-sm text-muted-foreground">
                      {[who?.phone, find(lookups.services, a.service_id), find(lookups.branches, a.branch_id), a.assigned_to && lookups.memberName(a.assigned_to)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {a.notes && <div className="truncate text-xs text-muted-foreground">{a.notes}</div>}
                  </div>
                  <AppointmentStatusMenu slug={slug} id={a.id} status={a.status} />
                  <AppointmentRowActions slug={slug} id={a.id} tz={tz} scheduledAt={a.scheduled_at} canDelete={ctx.canDelete} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
