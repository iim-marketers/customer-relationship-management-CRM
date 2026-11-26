import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { DayStrip } from "@/components/crm/day-strip";
import { TaskDialog } from "@/components/crm/dialogs/task-dialog";
import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addDaysYmd, dayBounds, fmt, isYmd, weekStart, ymdInTz } from "@/lib/dates";
import { clientLookups, getLookups, getProjectContext } from "@/lib/project";
import { TodoBoard, type TodoItem } from "./todo-board";

export const metadata: Metadata = { title: "To-Do" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string; filter?: string }> };

export default function TodoPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 pt-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-20 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      }
    >
      <Todo {...props} />
    </Suspense>
  );
}

const LEAD_COLS = "id, name, phone, stage_id, branch_id, assigned_to, follow_up_at";
const TASK_COLS = "id, title, notes, due_at, completed_at, assigned_to, lead:leads(id, name, phone)";

async function Todo({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const ctx = await getProjectContext(slug);
  const { supabase, project, tz, user } = ctx;
  const lookups = await getLookups(slug);

  const now = new Date();
  const today = ymdInTz(now, tz);
  const selected = isYmd(sp.date) ? sp.date : today;
  const day = dayBounds(selected, tz);
  const todayStart = dayBounds(today, tz).from;
  const week = { from: dayBounds(weekStart(selected), tz).from, to: dayBounds(addDaysYmd(weekStart(selected), 6), tz).to };
  const showOverdue = selected === today;
  const pid = project.id;

  const [dayLeads, overdueLeads, dayTasks, overdueTasks, weekLeads, weekTasks] = await Promise.all([
    supabase.from("leads").select(LEAD_COLS).eq("project_id", pid).is("contact_id", null)
      .gte("follow_up_at", day.from.toISOString()).lt("follow_up_at", day.to.toISOString()).order("follow_up_at"),
    showOverdue
      ? supabase.from("leads").select(LEAD_COLS).eq("project_id", pid).is("contact_id", null)
          .lt("follow_up_at", todayStart.toISOString()).order("follow_up_at", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] }),
    supabase.from("tasks").select(TASK_COLS).eq("project_id", pid)
      .gte("due_at", day.from.toISOString()).lt("due_at", day.to.toISOString()).order("due_at"),
    showOverdue
      ? supabase.from("tasks").select(TASK_COLS).eq("project_id", pid).is("completed_at", null)
          .lt("due_at", todayStart.toISOString()).order("due_at", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] }),
    supabase.from("leads").select("follow_up_at").eq("project_id", pid).is("contact_id", null)
      .gte("follow_up_at", week.from.toISOString()).lt("follow_up_at", week.to.toISOString()),
    supabase.from("tasks").select("due_at").eq("project_id", pid).is("completed_at", null)
      .gte("due_at", week.from.toISOString()).lt("due_at", week.to.toISOString()),
  ]);

  const branchName = (id: string | null) => lookups.branches.find((b) => b.id === id)?.name ?? null;

  type LeadRow = { id: string; name: string; phone: string | null; stage_id: string; branch_id: string | null; assigned_to: string | null; follow_up_at: string };
  type TaskRow = { id: string; title: string; notes: string | null; due_at: string; completed_at: string | null; assigned_to: string | null; lead: { id: string; name: string; phone: string | null } | null };

  const fromLead = (l: LeadRow, overdue: boolean): TodoItem => ({
    kind: "follow_up",
    id: l.id,
    leadId: l.id,
    title: l.name,
    subtitle: overdue ? "Follow-up overdue" : l.follow_up_at < now.toISOString() ? "Follow-up due (missed time)" : "Follow-up due",
    time: overdue ? fmt.dateTime(l.follow_up_at, tz) : fmt.time(l.follow_up_at, tz),
    meta: [branchName(l.branch_id), l.phone].filter(Boolean).join(" · "),
    stageId: l.stage_id,
    assignedTo: l.assigned_to,
    overdue,
    done: false,
  });
  const fromTask = (t: TaskRow, overdue: boolean): TodoItem => ({
    kind: "task",
    id: t.id,
    leadId: t.lead?.id ?? null,
    title: t.title,
    subtitle: t.lead ? `Task · ${t.lead.name}` : t.notes || "Task",
    time: overdue ? fmt.dateTime(t.due_at, tz) : fmt.time(t.due_at, tz),
    meta: [lookups.memberName(t.assigned_to), t.lead?.phone].filter(Boolean).join(" · "),
    stageId: null,
    assignedTo: t.assigned_to,
    overdue,
    done: Boolean(t.completed_at),
  });

  const overdue = [
    ...((overdueLeads.data ?? []) as LeadRow[]).map((l) => fromLead(l, true)),
    ...((overdueTasks.data ?? []) as unknown as TaskRow[]).map((t) => fromTask(t, true)),
  ];
  const scheduled = [
    ...((dayLeads.data ?? []) as LeadRow[]).map((l) => fromLead(l, false)),
    ...((dayTasks.data ?? []) as unknown as TaskRow[]).map((t) => fromTask(t, false)),
  ];

  const marked = new Set<string>();
  for (const r of (weekLeads.data ?? []) as { follow_up_at: string }[]) marked.add(ymdInTz(new Date(r.follow_up_at), tz));
  for (const r of (weekTasks.data ?? []) as { due_at: string }[]) marked.add(ymdInTz(new Date(r.due_at), tz));

  const open = [...overdue, ...scheduled].filter((i) => !i.done).length;
  const cl = clientLookups(lookups);

  return (
    <>
      <PageHeader
        title="To-Do"
        description={`${fmt.longDay(selected)} · ${open} open${overdue.length ? ` · ${overdue.length} overdue` : ""}`}
        actions={
          <TaskDialog
            slug={slug}
            projectId={pid}
            contactLabel={project.contact_label}
            lookups={cl}
            currentUserId={user.id}
            defaultDue={`${selected}T${selected === today ? String(Math.min(23, Number(fmt.time(now.toISOString(), tz).slice(0, 2)) + 1)).padStart(2, "0") : "10"}:00`}
            trigger={
              <Button>
                <PlusIcon /> Add task
              </Button>
            }
          />
        }
      />
      <DayStrip selected={selected} today={today} marked={[...marked]} />
      <TodoBoard
        slug={slug}
        tz={tz}
        userId={user.id}
        stages={lookups.stages}
        overdue={overdue}
        scheduled={scheduled}
        dayLabel={selected === today ? "Today" : fmt.longDay(selected)}
        filter={sp.filter ?? "all"}
      />
    </>
  );
}
