"use client";

import { AlarmClockIcon, CalendarClockIcon, CheckIcon, ClipboardCheckIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deleteTask, setFollowUp, toggleTask } from "@/app/p/[slug]/(crm)/actions";
import { StageBadge } from "@/components/crm/badges";
import { EmptyState } from "@/components/crm/panel";
import { useAction } from "@/components/crm/use-action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addDaysYmd, toZonedInput } from "@/lib/dates";
import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

export type TodoItem = {
  kind: "follow_up" | "task";
  id: string;
  leadId: string | null;
  title: string;
  subtitle: string;
  time: string;
  meta: string;
  stageId: string | null;
  assignedTo: string | null;
  overdue: boolean;
  done: boolean;
};

export function TodoBoard({
  slug,
  tz,
  userId,
  stages,
  overdue,
  scheduled,
  dayLabel,
  filter,
}: {
  slug: string;
  tz: string;
  userId: string;
  stages: Stage[];
  overdue: TodoItem[];
  scheduled: TodoItem[];
  dayLabel: string;
  filter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const all = [...overdue, ...scheduled];

  const matches = (i: TodoItem, f: string) =>
    f === "all" ||
    (f === "mine" && i.assignedTo === userId) ||
    (f === "tasks" && i.kind === "task") ||
    i.stageId === f;

  const chips = [
    { key: "all", label: "All" },
    { key: "mine", label: "My items" },
    { key: "tasks", label: "Tasks" },
    ...stages.filter((s) => s.kind === "open").map((s) => ({ key: s.id, label: s.name })),
  ];

  const setFilter = (key: string) => {
    const next = new URLSearchParams(params);
    if (key === "all") next.delete("filter");
    else next.set("filter", key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const visibleOverdue = overdue.filter((i) => matches(i, filter));
  const visibleScheduled = scheduled.filter((i) => matches(i, filter));

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {chips.map((c) => {
          const count = all.filter((i) => !i.done && matches(i, c.key)).length;
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={cn(
                "flex items-center gap-2 rounded-full border bg-card/90 px-3.5 py-1.5 text-sm font-medium transition hover:border-primary/50",
                active && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {c.label}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-black/15" : "bg-muted")}>{count}</span>
            </button>
          );
        })}
      </div>

      {visibleOverdue.length > 0 && (
        <Section title="Overdue" count={visibleOverdue.length} danger>
          {visibleOverdue.map((i) => (
            <TodoRow key={`${i.kind}-${i.id}`} item={i} slug={slug} tz={tz} stages={stages} />
          ))}
        </Section>
      )}

      <Section title={dayLabel} count={visibleScheduled.length}>
        {visibleScheduled.length === 0 ? (
          <EmptyState>Nothing scheduled{filter !== "all" ? " for this filter" : ""}.</EmptyState>
        ) : (
          visibleScheduled.map((i) => <TodoRow key={`${i.kind}-${i.id}`} item={i} slug={slug} tz={tz} stages={stages} />)
        )}
      </Section>
    </>
  );
}

function Section({ title, count, danger, children }: { title: string; count: number; danger?: boolean; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className={cn("mb-2 flex items-center gap-2 text-xs font-bold tracking-widest uppercase", danger ? "text-destructive" : "text-muted-foreground")}>
        {title}
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", danger ? "bg-destructive/15" : "bg-muted")}>{count}</span>
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function TodoRow({ item, slug, tz, stages }: { item: TodoItem; slug: string; tz: string; stages: Stage[] }) {
  const { pending, run } = useAction();
  const stage = stages.find((s) => s.id === item.stageId);
  const base = `/p/${slug}`;

  const snooze = (wall: string | null) => run(() => setFollowUp(slug, item.id, wall));
  const inHours = (h: number) => toZonedInput(new Date(Date.now() + h * 3600_000), tz);
  const tomorrowAt = (hh: string) => `${addDaysYmd(toZonedInput(new Date(), tz).slice(0, 10), 1)}T${hh}`;

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border bg-card/90 p-3 sm:p-4", pending && "opacity-60", item.done && "opacity-60")}>
      {item.kind === "task" ? (
        <button
          onClick={() => run(() => toggleTask(slug, item.id, !item.done))}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl border transition hover:border-primary",
            item.done ? "border-success bg-success/15 text-success" : "text-muted-foreground",
          )}
          aria-label={item.done ? "Mark as not done" : "Mark as done"}
        >
          {item.done ? <CheckIcon className="size-5" /> : <ClipboardCheckIcon className="size-5" />}
        </button>
      ) : (
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl border", item.overdue ? "text-destructive" : "text-primary")}>
          <CalendarClockIcon className="size-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("truncate font-semibold", item.done && "line-through")}>{item.title}</span>
          <StageBadge stage={stage} />
        </div>
        <div className={cn("text-sm", item.overdue ? "text-destructive/90" : "text-muted-foreground")}>{item.subtitle}</div>
        <div className="truncate text-xs text-muted-foreground">{[item.time, item.meta].filter(Boolean).join(" · ")}</div>
      </div>

      {item.leadId && (
        <Button variant="outline" asChild>
          <Link href={`${base}/leads/${item.leadId}`}>Open</Link>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {item.kind === "follow_up" ? (
            <>
              <DropdownMenuItem onSelect={() => snooze(inHours(1))}>
                <AlarmClockIcon /> Snooze 1 hour
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => snooze(tomorrowAt("10:00"))}>
                <AlarmClockIcon /> Tomorrow 10:00
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => snooze(`${addDaysYmd(toZonedInput(new Date(), tz).slice(0, 10), 7)}T10:00`)}>
                <AlarmClockIcon /> Next week
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => snooze(null)}>
                <CheckIcon /> Mark follow-up done
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => run(() => toggleTask(slug, item.id, !item.done))}>
                <CheckIcon /> {item.done ? "Reopen" : "Complete"}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => run(() => deleteTask(slug, item.id))}>
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
