import { io } from "next/cache";
import {
  CalendarCheckIcon,
  CalendarPlusIcon,
  ClipboardListIcon,
  InfoIcon,
  MailIcon,
  PencilIcon,
  PhoneCallIcon,
  PhoneIcon,
  PlayCircleIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppointmentBadge, CallBadge, StageBadge } from "@/components/crm/badges";
import { AppointmentDialog } from "@/components/crm/dialogs/appointment-dialog";
import { EmptyState, Panel } from "@/components/crm/panel";
import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmt, formatDuration, toZonedInput } from "@/lib/dates";
import { clientLookups, getLookups, getProjectContext } from "@/lib/project";
import type { Appointment, CallLog, Contact } from "@/lib/types";
import { ContactFormDialog } from "../contact-form-dialog";
import { singularOf } from "../labels";
import { DeleteContactButton } from "./delete-contact-button";

export const metadata: Metadata = { title: "Record" };

type Params = Promise<{ slug: string; id: string }>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ContactDetailPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 pt-3">
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg lg:col-span-2" />
          </div>
        </div>
      }
    >
      <ContactDetail params={params} />
    </Suspense>
  );
}

async function ContactDetail({ params }: { params: Params }) {
  const { slug, id } = await params;
  if (!UUID.test(id)) notFound();
  const ctx = await getProjectContext(slug);
  await io();
  const now = new Date();
  const lookups = await getLookups(slug);
  const base = `/p/${slug}`;

  const { data: contact } = await ctx.supabase
    .from("contacts")
    .select("id, name, phone, email, branch_id, service_id, source_id, assigned_to, notes, created_at")
    .eq("id", id)
    .eq("project_id", ctx.project.id)
    .maybeSingle<Contact>();
  if (!contact) notFound();

  const { data: leadRows } = await ctx.supabase
    .from("leads")
    .select("id, name, stage_id, created_at, enquiry_count")
    .eq("project_id", ctx.project.id)
    .eq("contact_id", id)
    .order("created_at", { ascending: false });
  const leads = leadRows ?? [];
  const leadIds = leads.map((l) => l.id);

  const apptFilter = [`contact_id.eq.${id}`, ...(leadIds.length ? [`lead_id.in.(${leadIds.join(",")})`] : [])].join(",");
  const phoneKey = (contact.phone ?? "").replace(/\D/g, "").slice(-10);
  const callFilter = [
    `contact_id.eq.${id}`,
    ...(leadIds.length ? [`lead_id.in.(${leadIds.join(",")})`] : []),
    ...(phoneKey.length >= 7 ? [`phone.ilike.%${phoneKey}`] : []),
  ].join(",");

  const [{ data: apptRows }, { data: callRows }] = await Promise.all([
    ctx.supabase
      .from("appointments")
      .select("id, lead_id, contact_id, branch_id, service_id, assigned_to, scheduled_at, duration_minutes, status, notes")
      .eq("project_id", ctx.project.id)
      .or(apptFilter)
      .order("scheduled_at", { ascending: false })
      .limit(50),
    ctx.supabase
      .from("call_logs")
      .select("id, lead_id, contact_id, contact_name, phone, direction, status, agent_status, handled_by, branch_id, duration_seconds, recording_url, called_at")
      .eq("project_id", ctx.project.id)
      .or(callFilter)
      .order("called_at", { ascending: false })
      .limit(50),
  ]);
  const appointments = (apptRows ?? []) as Appointment[];
  const calls = (callRows ?? []) as CallLog[];

  const singular = singularOf(ctx.project.contact_label);
  const nameOf = <T extends { id: string; name: string }>(list: T[], v: string | null) => list.find((x) => x.id === v)?.name;
  const client = clientLookups(lookups);

  const info: [string, React.ReactNode][] = [
    ["Branch", nameOf(lookups.branches, contact.branch_id) ?? "—"],
    ["Service", nameOf(lookups.services, contact.service_id) ?? "Not set"],
    ["Source", nameOf(lookups.sources, contact.source_id) ?? "—"],
    ["Assigned to", lookups.memberName(contact.assigned_to)],
    [`${singular} since`, fmt.date(contact.created_at, ctx.tz)],
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: ctx.project.contact_label, href: `${base}/contacts` }]}
        title={contact.name}
        description={
          <span className="flex flex-wrap gap-x-4">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <PhoneIcon className="size-3" /> {contact.phone}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <MailIcon className="size-3" /> {contact.email}
              </a>
            )}
          </span>
        }
        actions={
          <>
              <AppointmentDialog
                slug={slug}
                projectId={ctx.project.id}
                contactLabel={ctx.project.contact_label}
                lookups={client}
                defaultWhen={toZonedInput(now, ctx.tz).slice(0, 11) + "10:00"}
                record={{ kind: "contact", id: contact.id, name: contact.name, phone: contact.phone }}
                defaults={{ branch_id: contact.branch_id, service_id: contact.service_id, assigned_to: contact.assigned_to }}
                trigger={
                  <Button>
                    <CalendarPlusIcon /> Book appointment
                  </Button>
                }
              />
              <ContactFormDialog
                slug={slug}
                singular={singular}
                lookups={client}
                contact={contact}
                trigger={
                  <Button variant="outline">
                    <PencilIcon /> Edit
                  </Button>
                }
              />
              {ctx.canDelete && <DeleteContactButton slug={slug} contactId={contact.id} name={contact.name} />}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Panel title="Details" icon={InfoIcon}>
            <dl className="space-y-3 text-sm">
              {info.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {contact.notes && (
              <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{contact.notes}</p>
            )}
          </Panel>

          <Panel title="Originating leads" icon={ClipboardListIcon}>
            {leads.length === 0 ? (
              <EmptyState className="py-5">Added directly, not converted from a lead.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link href={`${base}/leads/${l.id}`} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-muted/50">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{l.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {fmt.date(l.created_at, ctx.tz)}
                          {l.enquiry_count > 1 && ` · ${l.enquiry_count} enquiries`}
                        </span>
                      </span>
                      <StageBadge stage={lookups.stages.find((s) => s.id === l.stage_id)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Appointments" icon={CalendarCheckIcon} action={<span className="text-sm text-muted-foreground">{appointments.length}</span>}>
            {appointments.length === 0 ? (
              <EmptyState className="py-5">No appointments yet.</EmptyState>
            ) : (
              <ul className="divide-y">
                {appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{fmt.dateTime(a.scheduled_at, ctx.tz)}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[nameOf(lookups.services, a.service_id), nameOf(lookups.branches, a.branch_id), a.assigned_to && `with ${lookups.memberName(a.assigned_to)}`, `${a.duration_minutes} min`]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <AppointmentBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Call history" icon={PhoneCallIcon} action={<span className="text-sm text-muted-foreground">{calls.length}</span>}>
            {calls.length === 0 ? (
              <EmptyState className="py-5">No calls logged for this number.</EmptyState>
            ) : (
              <ul className="divide-y">
                {calls.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {fmt.dateTime(c.called_at, ctx.tz)} <span className="font-normal text-muted-foreground capitalize">· {c.direction}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[formatDuration(c.duration_seconds), c.handled_by].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.recording_url && /^https?:\/\//i.test(c.recording_url) && (
                        <a href={c.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-info hover:underline">
                          <PlayCircleIcon className="size-4" /> Play
                        </a>
                      )}
                      <CallBadge status={c.status} />
                    </div>
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
