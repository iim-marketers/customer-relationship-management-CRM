import {
  BuildingIcon,
  KanbanSquareIcon,
  MegaphoneIcon,
  PackageIcon,
  SlidersHorizontalIcon,
  UsersRoundIcon,
  WebhookIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Panel } from "@/components/crm/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getLookups, getProjectContext } from "@/lib/project";
import { cn } from "@/lib/utils";
import { ApiSection } from "./api-section";
import { MasterList, type MasterRow } from "./master-list";
import { MembersSection, type MemberRow } from "./members-section";
import { ProfileSection } from "./profile-section";

export const metadata: Metadata = { title: "Settings" };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const SECTIONS = [
  { key: "users", title: "Users & roles", icon: UsersRoundIcon, blurb: "Create CRM logins and control Owner, Admin, Manager and Agent access." },
  { key: "branches", title: "Branches", icon: BuildingIcon, blurb: "Manage branch name, code, city, address, phone and activation." },
  { key: "stages", title: "Pipeline stages", icon: KanbanSquareIcon, blurb: "The columns of your lead pipeline, their order and colour." },
  { key: "sources", title: "Lead sources", icon: MegaphoneIcon, blurb: "Website, WhatsApp, Meta, Google Ads, IVR, walk-in and custom sources." },
  { key: "services", title: "Services", icon: PackageIcon, blurb: "What you offer — used on leads, appointments and reports." },
  { key: "api", title: "Integrations / API", icon: WebhookIcon, blurb: "API key and webhook to send leads in from forms and ad platforms." },
  { key: "profile", title: "Project profile", icon: SlidersHorizontalIcon, blurb: "Name, branding, timezone and what contacts are called." },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function SettingsPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Settings params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Settings({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const ctx = await getProjectContext(slug);
  const lookups = await getLookups(slug);
  const active: SectionKey = SECTIONS.some((s) => s.key === tab) ? (tab as SectionKey) : "users";

  const { data: secret } = ctx.isAdmin
    ? await ctx.supabase.from("project_secrets").select("api_key").eq("project_id", ctx.project.id).maybeSingle()
    : { data: null };

  const counts: Record<SectionKey, React.ReactNode> = {
    users: lookups.members.length,
    branches: lookups.branches.length,
    stages: lookups.stages.length,
    sources: lookups.sources.length,
    services: lookups.services.length,
    api: ctx.isAdmin ? "Webhook" : "—",
    profile: ctx.project.contact_label,
  };

  const members: MemberRow[] = lookups.members.map((m) => ({
    user_id: m.user_id,
    name: m.profile?.full_name || m.profile?.email || "Unknown",
    email: m.profile?.email ?? null,
    role: m.role,
    branch_id: m.branch_id,
    is_active: m.is_active,
  }));

  const section = SECTIONS.find((s) => s.key === active)!;
  const href = (key: string) => `${ctx.base}/settings?tab=${key}`;

  return (
    <div>
      <PageHeader
        title={ctx.isAdmin ? "Admin Settings" : "Settings"}
        description={
          ctx.isAdmin
            ? "Master data, team, integrations and project configuration."
            : "You can view settings. Ask a project admin to make changes."
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.key}
            href={href(s.key)}
            scroll={false}
            className={cn(
              "group rounded-2xl border bg-card/90 p-4 transition hover:border-primary/50",
              s.key === active && "border-primary/70 ring-1 ring-primary/30",
            )}
          >
            <span className="mb-3 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="size-4.5" />
            </span>
            <div className="font-semibold">{s.title}</div>
            <div className="mt-1 truncate text-2xl font-bold tabular-nums">{counts[s.key]}</div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.blurb}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={href(s.key)}
              scroll={false}
              aria-current={s.key === active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-xl border bg-card/90 px-4 py-3 text-sm transition hover:border-primary/50",
                s.key === active && "border-primary bg-primary/10",
              )}
            >
              <div className="font-semibold">{s.title}</div>
              <div className="text-xs text-muted-foreground">
                {typeof counts[s.key] === "number" ? `${counts[s.key]} records` : counts[s.key]}
              </div>
            </Link>
          ))}
        </nav>

        <Panel title={section.title} icon={section.icon} className="min-w-0">
          {active === "users" && (
            <MembersSection
              slug={slug}
              members={members}
              branches={lookups.branches}
              isAdmin={ctx.isAdmin}
              viewerRole={ctx.role}
              currentUserId={ctx.user.id}
            />
          )}
          {active === "branches" && (
            <MasterList slug={slug} table="branches" rows={lookups.branches as unknown as MasterRow[]} isAdmin={ctx.isAdmin} />
          )}
          {active === "stages" && (
            <MasterList slug={slug} table="lead_stages" rows={lookups.stages as unknown as MasterRow[]} isAdmin={ctx.isAdmin} />
          )}
          {active === "sources" && (
            <MasterList slug={slug} table="lead_sources" rows={lookups.sources as unknown as MasterRow[]} isAdmin={ctx.isAdmin} />
          )}
          {active === "services" && (
            <MasterList slug={slug} table="services" rows={lookups.services as unknown as MasterRow[]} isAdmin={ctx.isAdmin} />
          )}
          {active === "api" && <ApiSection slug={slug} apiKey={secret?.api_key ?? null} isAdmin={ctx.isAdmin} />}
          {active === "profile" && <ProfileSection project={ctx.project} isAdmin={ctx.isAdmin} isOwner={ctx.role === "owner"} />}
        </Panel>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4 pt-3">
      <Skeleton className="h-10 w-56" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
