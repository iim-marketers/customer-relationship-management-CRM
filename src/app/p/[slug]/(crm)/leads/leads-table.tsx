"use client";

import Link from "next/link";
import { StageBadge } from "@/components/crm/badges";
import { EmptyState } from "@/components/crm/panel";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt } from "@/lib/dates";
import type { ClientLookups } from "@/lib/project";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LeadsTable({
  slug,
  tz,
  lookups,
  leads,
  page,
  pages,
  prevHref,
  nextHref,
  nowIso,
}: {
  slug: string;
  tz: string;
  lookups: ClientLookups;
  leads: Lead[];
  page: number;
  pages: number;
  prevHref: string;
  nextHref: string;
  nowIso: string;
}) {
  if (leads.length === 0) return <EmptyState>No leads match these filters.</EmptyState>;
  const name = (rows: { id: string; name: string }[], id: string | null, fallback = "—") => rows.find((r) => r.id === id)?.name ?? fallback;

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Lead</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="max-w-48">
                <Link href={`/p/${slug}/leads/${l.id}`} className="block truncate font-medium hover:text-info hover:underline">
                  {l.name}
                </Link>
                {l.enquiry_count > 1 && <span className="text-xs text-warning">{l.enquiry_count} enquiries</span>}
              </TableCell>
              <TableCell className="tabular-nums">{l.phone ?? "—"}</TableCell>
              <TableCell>
                <StageBadge stage={lookups.stages.find((s) => s.id === l.stage_id)} />
              </TableCell>
              <TableCell>{name(lookups.sources, l.source_id)}</TableCell>
              <TableCell className="max-w-40 truncate">{name(lookups.services, l.service_id, "Not set")}</TableCell>
              <TableCell className="max-w-40 truncate">{name(lookups.branches, l.branch_id)}</TableCell>
              <TableCell>{name(lookups.members, l.assigned_to, "Unassigned")}</TableCell>
              <TableCell className={cn(l.follow_up_at && !l.contact_id && l.follow_up_at < nowIso && "text-destructive")}>
                {l.follow_up_at ? fmt.dateTime(l.follow_up_at, tz) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{fmt.date(l.created_at, tz)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Page {page} of {pages}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={prevHref}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          {page < pages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={nextHref}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
