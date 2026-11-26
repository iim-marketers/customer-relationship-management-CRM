import {
  CalendarCheckIcon,
  ClipboardCheckIcon,
  MessageSquareIcon,
  PencilIcon,
  PhoneCallIcon,
  PlusIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppointmentStatusMenu } from "@/components/crm/appointment-status-menu";
import { CallBadge } from "@/components/crm/badges";
import { AppointmentDialog } from "@/components/crm/dialogs/appointment-dialog";
import { LeadFormDialog } from "@/components/crm/dialogs/lead-form-dialog";
import { TaskDialog } from "@/components/crm/dialogs/task-dialog";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDaysYmd, fmt, formatDuration, toZonedInput, ymdInTz } from "@/lib/dates";
import { clientLookups, getLookups, getProjectContext } from "@/lib/project";
import type { Activity, Appointment, CallLog, Lead, Task } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { ContactLink, ConvertButton, DeleteLeadButton, FollowUpEditor, NoteComposer, StagePills } from "./lead-widgets";

export const metadata: Metadata = { title: "Lead" };

type Props = { params: Promise<{ slug: string; id: string }> };

export default function LeadPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 pt-3">
          <Skeleton className="h-10 w-72 rounded-md" />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Skeleton className="h-[32rem] rounded-md" />
            <Skeleton className="h-96 rounded-md" />
          </div>
        </div>
      }
    >
      <LeadDetail {...props} />
    </Suspense>
  );
}

const ACTIVITY_LABEL: Partial<Record<Activity["type"], { label: string; className: string }>> = {
  stage_change: { label: "Stage changed", className: "text-info" },
  enquiry: { label: "Repeat enquiry", className: "text-warning" },
  call: { label: "Call", className: "text-success" },
  appointment: { label: "Appointment", className: "text-chart-5" },
  system: { label: "System", className: "text-muted-foreground" },
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
  const singular = project.contact_label.replace(/s$/, "");
  const now = new Date();
  const today = ymdInTz(now, tz);
  const nextHour = toZonedInput(new Date(now.getTime() + 3600_000), tz).slice(0, 14) + "00";
  const overdue = lead.follow_up_at && !lead.contact_id && lead.follow_up_at < now.toISOString();
  const find = <T extends { id: string; name: string }>(rows: T[], v: string | null) => rows.find((r) => r.id === v)?.name;

  const callRows = (calls.data ?? []) as CallLog[];
  const apptRows = (appointments.data ?? []) as Appointment[];
  const taskRows = (tasks.data ?? []) as Task[];
  const activityRows = (activities.data ?? []) as unknown as Activity[];
  const openTasks = taskRows.filter((t) => !t.completed_at).length;
  const owner = cl.members.find((m) => m.id === lead.assigned_to);

  const left: [string, React.ReactNode][] = [
    ["Phone", lead.phone ? <a href={`tel:${lead.phone}`} className="text-info hover:underline">{lead.phone}</a> : "—"],
    ["Email", lead.email ? <a href={`mailto:${lead.email}`} className="truncate text-info hover:underline">{lead.email}</a> : "—"],
    ["Source", find(lookups.sources, lead.source_id) ?? "—"],
    ["Service", find(lookups.services, lead.service_id) ?? "Not set"],
  ];
  const right: [string, React.ReactNode][] = [
    [
      "Salesperson",
      owner ? (
        <span className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{initials(owner.name)}</span>
          {owner.name}
        </span>
      ) : (
        "Unassigned"
      ),
    ],
    ["Branch", find(lookups.branches, lead.branch_id) ?? "—"],
    [
      "Follow-up",
      lead.follow_up_at ? (
        <span className={cn(overdue && "font-medium text-destructive")}>{fmt.dateTime(lead.follow_up_at, tz)}</span>
      ) : (
        "—"
      ),
    ],
    ["Enquiries", lead.enquiry_count > 1 ? <span className="font-semibold text-warning">{lead.enquiry_count} (repeat)</span> : "1"],
    ["Created on", fmt.dateTime(lead.created_at, tz)],
  ];

  const smart = [
    { icon: PhoneCallIcon, n: callRows.length, label: "Calls" },
    { icon: CalendarCheckIcon, n: apptRows.length, label: "Meetings" },
    { icon: ClipboardCheckIcon, n: openTasks, label: "Tasks" },
  ];

  const messages = [
    ...activityRows.map((a) => ({
      id: a.id,
      author: a.author?.full_name ?? a.author?.email ?? "System",
      at: a.created_at,
      body: a.body,
      type: a.type,
    })),
    ...(lead.notes ? [{ id: "enquiry", author: "Original enquiry", at: lead.created_at, body: lead.notes, type: "enquiry" as const }] : []),
  ];
  const byDay = new Map<string, typeof messages>();
  for (const m of messages) {
    const day = fmt.date(m.at, tz);
    byDay.set(day, [...(byDay.get(day) ?? []), m]);
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Pipeline", href: `${base}/leads` }]}
        title={lead.name}
        actions={ctx.canDelete && <DeleteLeadButton slug={slug} leadId={lead.id} name={lead.name} />}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {lead.contact_id ? (
                <ContactLink href={`${base}/contacts/${lead.contact_id}`} label={singular.toLowerCase()} />
              ) : (
                <ConvertButton slug={slug} leadId={lead.id} label={singular.toLowerCase()} />
              )}
              <AppointmentDialog
                slug={slug}
                projectId={project.id}
                contactLabel={project.contact_label}
                lookups={cl}
                defaultWhen={nextHour}
                record={{ kind: "lead", id: lead.id, name: lead.name, phone: lead.phone }}
                defaults={{ branch_id: lead.branch_id, service_id: lead.service_id, assigned_to: lead.assigned_to }}
                trigger={<Button variant="secondary">Book appointment</Button>}
              />
              <LeadFormDialog
                slug={slug}
                tz={tz}
                lookups={cl}
                lead={lead}
                trigger={
                  <Button variant="secondary">
                    <PencilIcon /> Edit
                  </Button>
                }
              />
            </div>
            <div className="max-w-full">
              <StagePills slug={slug} leadId={lead.id} stages={lookups.stages} current={lead.stage_id} />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-md border bg-card shadow-sm">
            {lead.contact_id && (
              <div className="pointer-events-none absolute top-0 right-0 z-10 size-28 overflow-hidden">
                <div className="absolute top-6 -right-10 w-40 rotate-45 bg-success py-1 text-center text-xs font-bold tracking-wider text-white uppercase shadow">
                  Converted
                </div>
              </div>
            )}

            <div className={cn("flex flex-wrap justify-end border-b", lead.contact_id && "sm:pr-20")}>
              {smart.map((b) => (
                <div key={b.label} className="flex min-w-32 items-center gap-2.5 border-l px-4 py-2 first:border-l-0 sm:first:border-l">
                  <b.icon className="size-5 text-muted-foreground" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold tabular-nums text-info">{b.n}</div>
                    <div className="text-xs text-muted-foreground">{b.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 sm:px-8 sm:py-6">
              <div className="text-xs font-medium text-muted-foreground">Lead</div>
              <h2 className="mb-6 text-2xl font-semibold tracking-tight break-words sm:text-3xl">{lead.name}</h2>

              <div className="grid gap-x-12 gap-y-2 md:grid-cols-2">
                {[left, right].map((group, i) => (
                  <dl key={i} className="grid grid-cols-[7.5rem_minmax(0,1fr)] content-start gap-y-2.5 text-sm">
                    {group.map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="font-semibold">{k}</dt>
                        <dd className="min-w-0 truncate border-b border-transparent">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ))}
              </div>

              <Tabs defaultValue="follow-up" className="mt-8">
                <TabsList variant="line" className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b p-0">
                  {[
                    ["follow-up", "Follow-up"],
                    ["calls", `Calls (${callRows.length})`],
                    ["appointments", `Appointments (${apptRows.length})`],
                    ["tasks", `Tasks (${taskRows.length})`],
                  ].map(([v, label]) => (
                    <TabsTrigger
                      key={v}
                      value={v}
                      className="-mb-px h-auto flex-none rounded-none rounded-t-md border border-transparent px-4 py-2 after:hidden data-active:border-border data-active:border-b-card data-active:bg-card data-active:text-foreground"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="follow-up" className="pt-4">
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
                </TabsContent>

                <TabsContent value="calls" className="pt-2">
                  {callRows.length === 0 ? (
                    <EmptyState className="mt-2">No calls logged for this number.</EmptyState>
                  ) : (
                    <ul className="divide-y">
                      {callRows.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
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
                </TabsContent>

                <TabsContent value="appointments" className="pt-2">
                  {apptRows.length === 0 ? (
                    <EmptyState className="mt-2">No appointments yet.</EmptyState>
                  ) : (
                    <ul className="divide-y">
                      {apptRows.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <div>
                            <div className="font-medium">{fmt.dateTime(a.scheduled_at, tz)}</div>
                            <div className="text-xs text-muted-foreground">
                              {[find(lookups.branches, a.branch_id), find(lookups.services, a.service_id)].filter(Boolean).join(" · ") ||
                                `${a.duration_minutes} min`}
                            </div>
                          </div>
                          <AppointmentStatusMenu slug={slug} id={a.id} status={a.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="pt-2">
                  {taskRows.length === 0 ? (
                    <EmptyState className="mt-2">No tasks.</EmptyState>
                  ) : (
                    <ul className="divide-y">
                      {taskRows.map((t) => (
                        <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <span className={cn("truncate", t.completed_at && "text-muted-foreground line-through")}>{t.title}</span>
                          <span
                            className={cn(
                              "shrink-0 text-xs",
                              !t.completed_at && t.due_at < now.toISOString() ? "text-destructive" : "text-muted-foreground",
                            )}
                          >
                            {fmt.dateTime(t.due_at, tz)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-16">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
              <MessageSquareIcon className="size-4" /> Log note
            </span>
            <TaskDialog
              slug={slug}
              projectId={project.id}
              contactLabel={project.contact_label}
              lookups={cl}
              currentUserId={user.id}
              defaultDue={nextHour}
              lead={{ kind: "lead", id: lead.id, name: lead.name, phone: lead.phone }}
              trigger={
                <Button variant="secondary">
                  <PlusIcon /> Activity
                </Button>
              }
            />
            <span className="ml-auto text-xs text-muted-foreground">{messages.length} messages</span>
          </div>
          <NoteComposer slug={slug} leadId={lead.id} />

          <div className="mt-4">
            {messages.length === 0 && <EmptyState>No activity yet.</EmptyState>}
            {[...byDay.entries()].map(([day, rows]) => (
              <section key={day}>
                <div className="my-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  {day}
                  <span className="h-px flex-1 bg-border" />
                </div>
                <ol className="space-y-3">
                  {rows.map((m) => {
                    const meta = ACTIVITY_LABEL[m.type];
                    return (
                      <li key={m.id} className="flex gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-xs font-bold text-secondary-foreground">
                          {initials(m.author)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                            <span className="font-semibold">{m.author}</span>
                            <span className="text-xs text-muted-foreground">{fmt.time(m.at, tz)}</span>
                            {meta && <span className={cn("text-xs font-medium", meta.className)}>· {meta.label}</span>}
                          </div>
                          <p className={cn("mt-0.5 text-sm whitespace-pre-wrap break-words", m.type !== "note" && m.type !== "enquiry" && "text-muted-foreground")}>
                            {m.body}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
