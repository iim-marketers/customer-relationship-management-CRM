import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterBar } from "@/components/crm/filter-bar";
import { PageHeader } from "@/components/crm/page-header";
import { Pager, pageWindow } from "@/components/crm/pager";
import { EmptyState } from "@/components/crm/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt, RANGE_OPTIONS, resolveRange } from "@/lib/dates";
import { clientLookups, getLookups, getProjectContext } from "@/lib/project";
import type { Contact } from "@/lib/types";
import { ContactFormDialog } from "./contact-form-dialog";
import { singularOf } from "./labels";

export const metadata: Metadata = { title: "Records" };

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | undefined>>;

export default function ContactsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 pt-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      }
    >
      <Contacts params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Contacts({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const sp = await searchParams;
  const ctx = await getProjectContext(slug);
  const lookups = await getLookups(slug);
  const range = resolveRange(sp.range, ctx.tz, new Date());
  const { page, from, to } = pageWindow(sp.page);
  const label = ctx.project.contact_label;
  const singular = singularOf(label);

  let query = ctx.supabase
    .from("contacts")
    .select("id, name, phone, email, branch_id, service_id, source_id, assigned_to, notes, created_at, appointments(count)", {
      count: "exact",
    })
    .eq("project_id", ctx.project.id)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (sp.branch) query = query.eq("branch_id", sp.branch);
  if (sp.assigned) query = query.eq("assigned_to", sp.assigned);
  if (sp.service) query = query.eq("service_id", sp.service);
  if (range.from) query = query.gte("created_at", range.from.toISOString());
  if (range.to) query = query.lt("created_at", range.to.toISOString());

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as (Contact & { appointments: { count: number }[] })[];
  const total = count ?? 0;
  const base = `/p/${slug}`;
  const nameOf = <T extends { id: string; name: string }>(list: T[], id: string | null) => list.find((x) => x.id === id)?.name;

  const filters = [
    { key: "branch", label: "Branch", allLabel: "All branches", options: lookups.branches.map((b) => ({ value: b.id, label: b.name })) },
    { key: "assigned", label: "Assigned to", allLabel: "Everyone", options: lookups.members.map((m) => ({ value: m.user_id, label: m.profile?.full_name || m.profile?.email || "Unknown" })) },
    { key: "service", label: "Service", allLabel: "All services", options: lookups.services.map((s) => ({ value: s.id, label: s.name })) },
    { key: "range", label: "Date range", allLabel: "All time", options: RANGE_OPTIONS.filter((o) => o.value !== "all").map((o) => ({ ...o })) },
  ];

  return (
    <>
      <PageHeader
        title={`${singular} Records`}
        description={`${total} ${total === 1 ? singular.toLowerCase() : label.toLowerCase()}`}
        actions={
          <ContactFormDialog
            slug={slug}
            singular={singular}
            lookups={clientLookups(lookups)}
            trigger={
              <Button>
                <PlusIcon /> Add {singular.toLowerCase()}
              </Button>
            }
          />
        }
        search={<FilterBar filters={filters} />}
      />

      {error ? (
        <EmptyState>Couldn&apos;t load {label.toLowerCase()}: {error.message}</EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState>
          No {label.toLowerCase()} here yet. Converting a lead adds them automatically.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px] tracking-wider uppercase">
                <TableHead className="pl-4">{singular}</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Appointments</TableHead>
                <TableHead className="pr-4">Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-56 truncate pl-4 font-medium">
                    <Link href={`${base}/contacts/${c.id}`} className="text-info hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{c.phone ?? "—"}</TableCell>
                  <TableCell className="max-w-44 truncate">{nameOf(lookups.branches, c.branch_id) ?? "—"}</TableCell>
                  <TableCell className="max-w-40 truncate">{lookups.memberName(c.assigned_to)}</TableCell>
                  <TableCell className="max-w-48 truncate">{nameOf(lookups.services, c.service_id) ?? "Not set"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.appointments?.[0]?.count ?? 0}</TableCell>
                  <TableCell className="pr-4 whitespace-nowrap text-muted-foreground">{fmt.date(c.created_at, ctx.tz)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager pathname={`${base}/contacts`} searchParams={sp} page={page} total={total} />
    </>
  );
}
