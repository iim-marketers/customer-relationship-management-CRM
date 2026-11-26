"use client";

import { ClockIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteLead, moveLeadStage } from "@/app/p/[slug]/(crm)/actions";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/dates";
import type { ClientLookups } from "@/lib/project";
import type { Lead, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column = { stage: Stage; leads: Lead[]; count: number };

export function LeadsKanban({
  slug,
  tz,
  lookups,
  columns,
  canDelete,
  limit,
}: {
  slug: string;
  tz: string;
  lookups: ClientLookups;
  columns: Column[];
  canDelete: boolean;
  limit: number;
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
    <div className="flex snap-x gap-3 overflow-x-auto pb-4">
      {optimistic.map(({ stage, leads, count }) => (
        <section
          key={stage.id}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(stage.id);
          }}
          onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
          onDrop={(e) => onDrop(stage.id, e)}
          className={cn(
            "flex w-[85vw] max-w-80 shrink-0 snap-start flex-col rounded-2xl border bg-card/70 sm:w-80",
            dragOver === stage.id && "border-primary ring-2 ring-primary/30",
          )}
        >
          <header className="flex items-center justify-between gap-2 border-b px-3 py-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <span className="size-2.5 rounded-full" style={{ background: stage.color }} />
              {stage.name}
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">{count}</span>
          </header>
          <div className="flex max-h-[calc(100svh-19rem)] min-h-40 flex-col gap-2 overflow-y-auto p-2">
            {leads.map((lead) => (
              <LeadCard key={lead.id} slug={slug} tz={tz} lead={lead} lookups={lookups} canDelete={canDelete} />
            ))}
            {leads.length === 0 && <div className="grid flex-1 place-items-center py-8 text-sm text-muted-foreground">Drop leads here</div>}
            {count > limit && (
              <Link
                href={`/p/${slug}/leads?view=list&stage=${stage.id}`}
                className="rounded-lg py-2 text-center text-sm font-medium text-primary hover:bg-muted/50"
              >
                +{count - limit} more in list view
              </Link>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function LeadCard({ slug, tz, lead, lookups, canDelete }: { slug: string; tz: string; lead: Lead; lookups: ClientLookups; canDelete: boolean }) {
  const { pending, run } = useAction();
  const source = lookups.sources.find((s) => s.id === lead.source_id)?.name;
  const service = lookups.services.find((s) => s.id === lead.service_id)?.name;
  const owner = lookups.members.find((m) => m.id === lead.assigned_to)?.name ?? lookups.branches.find((b) => b.id === lead.branch_id)?.name;

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/lead-id", lead.id);
        e.dataTransfer.setData("text/from-stage", lead.stage_id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group cursor-grab rounded-xl border bg-card p-3 shadow-sm transition hover:border-primary/40 active:cursor-grabbing",
        pending && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/p/${slug}/leads/${lead.id}`} className="block truncate font-semibold hover:underline">
            {lead.name}
          </Link>
          <div className="text-sm text-muted-foreground">{lead.phone ?? lead.email ?? "No contact info"}</div>
        </div>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Delete lead" className="opacity-70 group-hover:opacity-100">
                <Trash2Icon />
              </Button>
            </AlertDialogTrigger>
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
      </div>
      <p className="mt-2 line-clamp-2 text-sm">{lead.notes || service || "Not set"}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ClockIcon className="size-3.5" />
        {fmt.dateTime(lead.created_at, tz)}
        {lead.enquiry_count > 1 && <span className="ml-auto rounded bg-warning/15 px-1.5 font-semibold text-warning">×{lead.enquiry_count}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {source && <span className="truncate rounded-md bg-primary/15 px-2 py-0.5 font-medium text-primary">{source}</span>}
        <span className="truncate text-muted-foreground">{owner ?? "Unassigned"}</span>
        <Link href={`/p/${slug}/leads/${lead.id}`} className="ml-auto shrink-0 font-medium text-primary hover:underline">
          Read more →
        </Link>
      </div>
    </article>
  );
}
