"use client";

import { ClockIcon, EllipsisVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteLead, moveLeadStage } from "@/app/p/[slug]/(crm)/actions";
import { LeadFormDialog } from "@/components/crm/dialogs/lead-form-dialog";
import { useAction } from "@/components/crm/use-action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmt } from "@/lib/dates";
import type { ClientLookups } from "@/lib/project";
import type { Lead, Stage } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

type Column = { stage: Stage; leads: Lead[]; count: number };
type ActivityState = "overdue" | "today" | "planned" | "none";

const ACTIVITY: Record<ActivityState, { bar: string; icon: string; label: string }> = {
  overdue: { bar: "bg-destructive", icon: "text-destructive", label: "Overdue" },
  today: { bar: "bg-warning", icon: "text-warning", label: "Today" },
  planned: { bar: "bg-success", icon: "text-success", label: "Planned" },
  none: { bar: "bg-muted-foreground/25", icon: "text-muted-foreground/60", label: "No follow-up" },
};

function activityState(lead: Lead, nowIso: string, todayEndIso: string): ActivityState {
  if (!lead.follow_up_at || lead.contact_id) return "none";
  if (lead.follow_up_at < nowIso) return "overdue";
  if (lead.follow_up_at < todayEndIso) return "today";
  return "planned";
}

/** Stable pastel colour per id — Odoo tints tags and avatars this way. */
const PALETTE = ["#f06050", "#f4a460", "#f7cd1f", "#6cc1ed", "#814968", "#eb7e7f", "#2c8397", "#475577", "#d6145f", "#30c381", "#9365b8"];
function tint(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function LeadsKanban({
  slug,
  tz,
  lookups,
  columns,
  canDelete,
  limit,
  nowIso,
  todayEndIso,
}: {
  slug: string;
  tz: string;
  lookups: ClientLookups;
  columns: Column[];
  canDelete: boolean;
  limit: number;
  nowIso: string;
  todayEndIso: string;
}) {
  const [, start] = useTransition();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [optimistic, move] = useOptimistic(columns, (cols, { leadId, to }: { leadId: string; to: string }) => {
    const lead = cols.flatMap((c) => c.leads).find((l) => l.id === leadId);
    if (!lead) return cols;
    return cols.map((c) => {
      if (c.stage.id === lead.stage_id) return { ...c, leads: c.leads.filter((l) => l.id !== leadId), count: c.count - 1 };
      if (c.stage.id === to) return { ...c, leads: [{ ...lead, stage_id: to }, ...c.leads], count: c.count + 1 };
      return c;
    });
  });

  const onDrop = (stageId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const leadId = e.dataTransfer.getData("text/lead-id");
    const from = e.dataTransfer.getData("text/from-stage");
    if (!leadId || from === stageId) return;
    start(async () => {
      move({ leadId, to: stageId });
      const r = await moveLeadStage(slug, leadId, stageId);
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });
  };

  return (
    <div className="-mx-3 flex snap-x gap-4 overflow-x-auto px-3 pb-4 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
      {optimistic.map(({ stage, leads, count }) => {
        const states = leads.map((l) => activityState(l, nowIso, todayEndIso));
        const tally = (["planned", "today", "overdue", "none"] as const).map((k) => ({ k, n: states.filter((s) => s === k).length }));
        return (
          <section
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(stage.id);
            }}
            onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
            onDrop={(e) => onDrop(stage.id, e)}
            className={cn(
              "group/col flex w-[85vw] max-w-75 shrink-0 snap-start flex-col rounded-md transition-colors sm:w-75",
              dragOver === stage.id && "bg-accent/60 ring-1 ring-info/40",
            )}
          >
            <header className="px-1 pt-1 pb-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="truncate text-base font-semibold">{stage.name}</h2>
                <LeadFormDialog
                  slug={slug}
                  tz={tz}
                  lookups={lookups}
                  defaultStageId={stage.id}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Add lead to ${stage.name}`} className="opacity-60 group-hover/col:opacity-100">
                      <PlusIcon />
                    </Button>
                  }
                />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  {leads.length > 0 &&
                    tally.map(({ k, n }) =>
                      n > 0 ? (
                        <Tooltip key={k}>
                          <TooltipTrigger asChild>
                            <span className={cn("h-full", ACTIVITY[k].bar)} style={{ width: `${(n / leads.length) * 100}%` }} />
                          </TooltipTrigger>
                          <TooltipContent>
                            {ACTIVITY[k].label}: {n}
                          </TooltipContent>
                        </Tooltip>
                      ) : null,
                    )}
                </div>
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">{count}</span>
              </div>
            </header>
            <div className="flex max-h-[calc(100svh-12rem)] min-h-40 flex-col gap-2 overflow-y-auto px-px pb-2">
              {leads.map((lead, i) => (
                <LeadCard key={lead.id} slug={slug} tz={tz} lead={lead} lookups={lookups} canDelete={canDelete} state={states[i]} />
              ))}
              {leads.length === 0 && (
                <div className="grid flex-1 place-items-center rounded-md border border-dashed py-8 text-sm text-muted-foreground">Drop leads here</div>
              )}
              {count > limit && (
                <Link
                  href={`/p/${slug}/leads?view=list&stage=${stage.id}`}
                  className="rounded-md py-2 text-center text-sm font-medium text-info hover:bg-muted"
                >
                  Load more ({count - limit})
                </Link>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function LeadCard({
  slug,
  tz,
  lead,
  lookups,
  canDelete,
  state,
}: {
  slug: string;
  tz: string;
  lead: Lead;
  lookups: ClientLookups;
  canDelete: boolean;
  state: ActivityState;
}) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [confirm, setConfirm] = useState(false);
  const href = `/p/${slug}/leads/${lead.id}`;
  const source = lookups.sources.find((s) => s.id === lead.source_id);
  const service = lookups.services.find((s) => s.id === lead.service_id)?.name;
  const member = lookups.members.find((m) => m.id === lead.assigned_to);
  const branch = lookups.branches.find((b) => b.id === lead.branch_id)?.name;

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/lead-id", lead.id);
        e.dataTransfer.setData("text/from-stage", lead.stage_id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={(e) => {
        // Ignore clicks on controls and on portalled menus/dialogs (React bubbles those through the card).
        if (!e.currentTarget.contains(e.target as Node) || (e.target as HTMLElement).closest("a,button")) return;
        router.push(href);
      }}
      className={cn(
        "group relative cursor-pointer rounded-md border bg-card p-2.5 shadow-xs transition hover:shadow-md active:cursor-grabbing",
        pending && "opacity-50",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate font-semibold hover:text-info">
            {lead.name}
          </Link>
          {service && <div className="truncate text-sm text-foreground/80">{service}</div>}
          <div className="truncate text-sm text-muted-foreground">{lead.phone ?? lead.email ?? "No contact info"}</div>
        </div>
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="Lead options" className="-mt-0.5 -mr-1 opacity-0 group-hover:opacity-100 aria-expanded:opacity-100">
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={href}>Open</Link>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {(source || lead.enquiry_count > 1) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {source && (
            <span
              className="max-w-full truncate rounded-full px-2 py-px text-xs font-medium"
              style={{ color: tint(source.id), backgroundColor: `color-mix(in oklch, ${tint(source.id)} 15%, transparent)` }}
            >
              {source.name}
            </span>
          )}
          {lead.enquiry_count > 1 && (
            <span className="rounded-full bg-warning/15 px-2 py-px text-xs font-medium text-warning">Repeat ×{lead.enquiry_count}</span>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("inline-flex", ACTIVITY[state].icon)}>
              <ClockIcon className="size-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{lead.follow_up_at && state !== "none" ? `Follow-up ${fmt.dateTime(lead.follow_up_at, tz)}` : "No follow-up scheduled"}</TooltipContent>
        </Tooltip>
        <span className="truncate">{branch ?? fmt.date(lead.created_at, tz)}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="ml-auto grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
              style={{ background: member ? tint(member.id) : "var(--muted-foreground)" }}
            >
              {member ? initials(member.name) : "?"}
            </span>
          </TooltipTrigger>
          <TooltipContent>{member?.name ?? "Unassigned"}</TooltipContent>
        </Tooltip>
      </div>

      {canDelete && (
        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {lead.name}?</AlertDialogTitle>
              <AlertDialogDescription>This removes the lead and its activity history. It can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => run(() => deleteLead(slug, lead.id))}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </article>
  );
}
