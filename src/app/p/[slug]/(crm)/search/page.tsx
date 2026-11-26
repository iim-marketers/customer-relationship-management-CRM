import { SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StageBadge } from "@/components/crm/badges";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState, Panel } from "@/components/crm/panel";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fmt } from "@/lib/dates";
import { getLookups, getProjectContext } from "@/lib/project";

export const metadata: Metadata = { title: "Search" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> };

export default function SearchPage(props: Props) {
  return (
    <Suspense fallback={<Skeleton className="mt-3 h-64 rounded-lg" />}>
      <Search {...props} />
    </Suspense>
  );
}

async function Search({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q = "" } = await searchParams;
  const { supabase, project, tz, base } = await getProjectContext(slug);
  const lookups = await getLookups(slug);
  const term = q.trim().replace(/[%,()*]/g, " ").slice(0, 80);
  const digits = term.replace(/\D/g, "");

  // Match name/email, or phone by digits so "+91 98450" finds "9845048482".
  const filter = [`name.ilike.%${term}%`, `email.ilike.%${term}%`, digits.length >= 4 ? `phone_key.ilike.%${digits.slice(-10)}%` : null]
    .filter(Boolean)
    .join(",");

  const [leads, contacts] =
    term.length >= 2
      ? await Promise.all([
          supabase.from("leads").select("id, name, phone, email, stage_id, created_at").eq("project_id", project.id).or(filter).order("created_at", { ascending: false }).limit(25),
          supabase.from("contacts").select("id, name, phone, email, created_at").eq("project_id", project.id).or(filter).order("created_at", { ascending: false }).limit(25),
        ])
      : [{ data: [] }, { data: [] }];

  return (
    <>
      <PageHeader title="Search" description={term ? `Results for “${term}”` : "Find leads and records by name, email or phone"} />
      <form className="relative mb-4 max-w-xl">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} autoFocus placeholder="Name, email or phone…" className="h-11 pl-9" />
      </form>
      {term.length < 2 ? (
        <EmptyState>Type at least 2 characters.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={`Leads (${leads.data?.length ?? 0})`} bodyClassName="p-2">
            {(leads.data ?? []).length === 0 ? (
              <EmptyState className="m-2">No leads found.</EmptyState>
            ) : (
              <ul className="divide-y">
                {(leads.data ?? []).map((l) => (
                  <li key={l.id}>
                    <Link href={`${base}/leads/${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{l.name}</div>
                        <div className="truncate text-sm text-muted-foreground">{[l.phone, l.email, fmt.date(l.created_at, tz)].filter(Boolean).join(" · ")}</div>
                      </div>
                      <StageBadge stage={lookups.stages.find((s) => s.id === l.stage_id)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={`${project.contact_label} (${contacts.data?.length ?? 0})`} bodyClassName="p-2">
            {(contacts.data ?? []).length === 0 ? (
              <EmptyState className="m-2">No {project.contact_label.toLowerCase()} found.</EmptyState>
            ) : (
              <ul className="divide-y">
                {(contacts.data ?? []).map((c) => (
                  <li key={c.id}>
                    <Link href={`${base}/contacts/${c.id}`} className="block rounded-lg px-2 py-2.5 hover:bg-muted/50">
                      <div className="truncate font-semibold">{c.name}</div>
                      <div className="truncate text-sm text-muted-foreground">{[c.phone, c.email, fmt.date(c.created_at, tz)].filter(Boolean).join(" · ")}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
