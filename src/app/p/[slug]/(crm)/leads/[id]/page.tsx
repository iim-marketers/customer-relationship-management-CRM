import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  ClipboardCheckIcon,
  HistoryIcon,
  InfoIcon,
  MailIcon,
  PencilIcon,
  PhoneCallIcon,
  PhoneIcon,
  PlusIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppointmentStatusMenu } from "@/components/crm/appointment-status-menu";
import { CallBadge, StageBadge } from "@/components/crm/badges";
import { AppointmentDialog } from "@/components/crm/dialogs/appointment-dialog";
import { LeadFormDialog } from "@/components/crm/dialogs/lead-form-dialog";
import { TaskDialog } from "@/components/crm/dialogs/task-dialog";
import { EmptyState, Panel } from "@/components/crm/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addDaysYmd, fmt, formatDuration, toZonedInput, ymdInTz } from "@/lib/dates";
import { clientLookups, getLookups, getProjectContext } from "@/lib/project";
import type { Activity, Appointment, CallLog, Lead, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ContactLink, ConvertButton, DeleteLeadButton, FollowUpEditor, NoteComposer, StagePills } from "./lead-widgets";

export const metadata: Metadata = { title: "Lead" };

type Props = { params: Promise<{ slug: string; id: string }> };

export default function LeadPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 pt-3">
          <Skeleton className="h-16 rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      }
    >
      <LeadDetail {...props} />
    </Suspense>
  );
}

const ACTIVITY_ICON: Record<Activity["type"], string> = {
  note: "bg-primary",
  stage_change: "bg-info",
  enquiry: "bg-warning",
  call: "bg-success",
  appointment: "bg-chart-4",
  system: "bg-muted-foreground",
};

async function LeadDetail({ params }: Props) {
  const { slug, id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await getProjectContext(slug);
  const { supabase, project, tz, base, user } = ctx;
  const lookups = await getLookups(slug);

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).eq("project_id", project.id).maybeSingle<Lead>();
  if (!lead) notFound();

  const phoneKey = lead.phone?.replace(/\D/g, "").slice(-10);
  const [activities, appointments, tasks, calls] = await Promise.all([
    supabase
      .from("lead_activities")
      .select("id, type, body, created_at, author:profiles(full_name, email)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("appointments").select("*").eq("lead_id", id).order("scheduled_at", { ascending: false }),
    supabase.from("tasks").select("id, title, notes, due_at, lead_id, assigned_to, completed_at").eq("lead_id", id).order("due_at"),
    phoneKey && phoneKey.length >= 7
      ? supabase
          .from("call_logs")
          .select("*")
          .eq("project_id", project.id)
          .or(`lead_id.eq.${id},phone.ilike.%${phoneKey}`)
          .order("called_at", { ascending: false })
          .limit(20)
      : supabase.from("call_logs").select("*").eq("lead_id", id).order("called_at", { ascending: false }).limit(20),
  ]);

  const cl = clientLookups(lookups);
  const stage = lookups.stages.find((s) => s.id === lead.stage_id);
  const singular = project.contact_label.replace(/s$/, "");
  const now = new Date();
  const today = ymdInTz(now, tz);
  const nextHour = toZonedInput(new Date(now.getTime() + 3600_000), tz).slice(0, 14) + "00";
  const overdue = lead.follow_up_at && !lead.contact_id && lead.follow_up_at < now.toISOString();
  const find = <T extends { id: string; name: string }>(rows: T[], v: string | null) => rows.find((r) => r.id === v)?.name;

  const details: [string, React.ReactNode][] = [
    ["Source", find(lookups.sources, lead.source_id) ?? "—"],
    ["Service", find(lookups.services, lead.service_id) ?? "Not set"],
    ["Branch", find(lookups.branches, lead.branch_id) ?? "—"],
    ["Assigned to", lookups.memberName(lead.assigned_to)],
    ["Enquiries", lead.enquiry_count > 1 ? <span className="font-semibold text-warning">{lead.enquiry_count} (repeat)</span> : "1"],
    ["Last enquiry", fmt.dateTime(lead.last_enquiry_at, tz)],
    ["Created", fmt.dateTime(lead.created_at, tz)],
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <Link href={`${base}/leads`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-4" /> Leads
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
            <StageBadge stage={stage} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <PhoneIcon className="size-3.5" /> {lead.phone}
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <MailIcon className="size-3.5" /> {lead.email}
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LeadFormDialog
            slug={slug}
            tz={tz}
            lookups={cl}
            lead={lead}
            trigger={
              <Button variant="outline">
                <PencilIcon /> Edit
              </Button>
            }
          />
          <AppointmentDialog
            slug={slug}
            projectId={project.id}
            contactLabel={project.contact_label}
            lookups={cl}
            defaultWhen={nextHour}
            record={{ kind: "lead", id: lead.id, name: lead.name, phone: lead.phone }}
            defaults={{ branch_id: lead.branch_id, service_id: lead.service_id, assigned_to: lead.assigned_to }}
            trigger={
              <Button variant="outline">
                <CalendarCheckIcon /> Book appointment
              </Button>
            }
          />
          {lead.contact_id ? (
            <ContactLink href={`${base}/contacts/${lead.contact_id}`} label={singular.toLowerCase()} />
          ) : (
            <ConvertButton slug={slug} leadId={lead.id} label={singular.toLowerCase()} />
          )}
          {ctx.canDelete && <DeleteLeadButton slug={slug} leadId={lead.id} name={lead.name} />}
        </div>
      </div>

      <Panel className="mb-4" bodyClassName="p-3">
        <StagePills slug={slug} leadId={lead.id} stages={lookups.stages} current={lead.stage_id} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Activity" icon={HistoryIcon}>
            <NoteComposer slug={slug} leadId={lead.id} />
            <ol className="mt-5 space-y-4">
              {lead.notes && (
                <li className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground" />
                  <div>
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                    <p className="text-xs text-muted-foreground">Original enquiry · {fmt.dateTime(lead.created_at, tz)}</p>
                  </div>
                </li>
              )}
              {((activities.data ?? []) as unknown as Activity[]).map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", ACTIVITY_ICON[a.type])} />
                  <div className="min-w-0">
                    <p className={cn("text-sm whitespace-pre-wrap", a.type !== "note" && "text-muted-foreground")}>{a.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.author?.full_name ?? a.author?.email ?? "System"} · {fmt.dateTime(a.created_at, tz)}
                    </p>
                  </div>
                </li>
              ))}
              {(activities.data ?? []).length === 0 && !lead.notes && <EmptyState>No activity yet.</EmptyState>}
            </ol>
          </Panel>

          <Panel title="Calls" icon={PhoneCallIcon} bodyClassName="p-2">
            {((calls.data ?? []) as CallLog[]).length === 0 ? (
              <EmptyState className="m-2">No calls logged for this number.</EmptyState>
            ) : (
              <ul className="divide-y">
                {((calls.data ?? []) as CallLog[]).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-2 py-2.5 text-sm">
                    <CallBadge status={c.status} />
                    <span className="capitalize">{c.direction}</span>
                    <span className="text-muted-foreground">{formatDuration(c.duration_seconds)}</span>
                    <span className="truncate text-muted-foreground">{c.handled_by}</span>
                    <span className="ml-auto text-muted-foreground">{fmt.dateTime(c.called_at, tz)}</span>
                    {c.recording_url && (
                      <a href={c.recording_url} target="_blank" rel="noreferrer" className="font-medium text-info hover:underline">
                        Play
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Follow-up" icon={CalendarClockIcon}>
            {lead.follow_up_at && (
              <p className={cn("mb-3 text-sm", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                {overdue ? "Overdue since " : "Scheduled for "}
                {fmt.dateTime(lead.follow_up_at, tz)}
              </p>
            )}
            <FollowUpEditor
              slug={slug}
              leadId={lead.id}
              value={toZonedInput(lead.follow_up_at, tz)}
              presets={[
                { label: "In 1 hour", wall: nextHour },
                { label: "Tomorrow 10:00", wall: `${addDaysYmd(today, 1)}T10:00` },
                { label: "In 3 days", wall: `${addDaysYmd(today, 3)}T10:00` },
                { label: "Next week", wall: `${addDaysYmd(today, 7)}T10:00` },
              ]}
            />
          </Panel>

          <Panel title="Details" icon={InfoIcon}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {details.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Appointments" icon={CalendarCheckIcon} bodyClassName="p-2">
            {((appointments.data ?? []) as Appointment[]).length === 0 ? (
              <EmptyState className="m-2">No appointments yet.</EmptyState>
            ) : (
              <ul className="divide-y">
                {((appointments.data ?? []) as Appointment[]).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-2 py-2.5 text-sm">
                    <div>
                      <div className="font-medium">{fmt.dateTime(a.scheduled_at, tz)}</div>
                      <div className="text-xs text-muted-foreground">
                        {[find(lookups.branches, a.branch_id), find(lookups.services, a.service_id)].filter(Boolean).join(" · ") || `${a.duration_minutes} min`}
                      </div>
                    </div>
                    <AppointmentStatusMenu slug={slug} id={a.id} status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Tasks"
            icon={ClipboardCheckIcon}
            bodyClassName="p-2"
            action={
              <TaskDialog
                slug={slug}
                projectId={project.id}
                contactLabel={project.contact_label}
                lookups={cl}
                currentUserId={user.id}
                defaultDue={nextHour}
                lead={{ kind: "lead", id: lead.id, name: lead.name, phone: lead.phone }}
                trigger={
                  <Button variant="ghost" size="sm">
                    <PlusIcon /> Add
                  </Button>
                }
              />
            }
          >
            {((tasks.data ?? []) as Task[]).length === 0 ? (
              <EmptyState className="m-2">No tasks.</EmptyState>
            ) : (
              <ul className="divide-y">
                {((tasks.data ?? []) as Task[]).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-2 py-2.5 text-sm">
                    <span className={cn("truncate", t.completed_at && "text-muted-foreground line-through")}>{t.title}</span>
                    <span className={cn("shrink-0 text-xs", !t.completed_at && t.due_at < now.toISOString() ? "text-destructive" : "text-muted-foreground")}>
                      {fmt.dateTime(t.due_at, tz)}
                    </span>
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
