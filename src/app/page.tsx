import {
  ChevronDownIcon,
  ClockIcon,
  FilterIcon,
  KanbanSquareIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Caveat_Brush } from "next/font/google";
import Link from "next/link";
import { FEATURES, featureTile } from "@/components/site/features";
import { ScrollLink } from "@/components/site/scroll-link";
import { SiteHeader, Wordmark } from "@/components/site/site-header";
import { cn } from "@/lib/utils";

const script = Caveat_Brush({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** Odoo-marketing coral used for the highlighted word and sparks. */
const CORAL = "text-[#f2645e]";

export default function Home() {
  return (
    <div className="min-h-svh overflow-x-clip bg-white text-[#374151] dark:bg-background dark:text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 text-center sm:px-6">
        <h1
          className={cn(
            script.className,
            "text-[3.4rem] leading-[0.95] text-[#111827] sm:text-7xl lg:text-[6.5rem] dark:text-foreground",
          )}
        >
          One CRM, <span className={CORAL}>Every Project</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl sm:leading-relaxed">
          <strong className="font-semibold text-[#1f2937] dark:text-foreground">
            Multi-project CRM
          </strong>{" "}
          to capture leads, never miss a follow-up and turn enquiries into
          customers.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg border border-[#5f3f57] bg-[#714b67] px-8 py-4 text-lg font-medium text-white shadow-md transition hover:-translate-y-px hover:bg-[#5f3f57]"
          >
            Start now
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-[#f1f2f4] px-8 py-4 text-lg font-medium text-[#714b67] transition hover:bg-[#e7e9ed] dark:bg-secondary dark:text-foreground"
          >
            Sign in to your CRM
          </Link>
        </div>
        <p className="mt-5 text-[15px]">
          Ready in under a minute, with a branded login page for each project.{" "}
          <ScrollLink
            href="#features"
            className="font-medium text-[#714b67] hover:underline dark:text-primary"
          >
            See why
          </ScrollLink>
        </p>
      </section>

      {/* Product shot on a curved backdrop */}
      <section id="overview" className="relative mt-12 scroll-mt-24">
        <div
          aria-hidden
          className="absolute inset-x-[-30%] top-24 bottom-0 rounded-t-[50%] bg-[#f1f2f4] dark:bg-muted"
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <PipelineMockup />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="-scroll-mt-10 bg-[#f1f2f4] pb-16 dark:bg-muted"
      >
        <div className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-[#111827] sm:text-5xl dark:text-foreground">
            Everything your team needs,{" "}
            <span
              className={cn(
                script.className,
                "relative inline-block text-[1.25em] font-normal text-[#714b67] dark:text-primary",
              )}
            >
              nothing it doesn&apos;t
              <svg
                viewBox="0 0 300 16"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-3 w-full"
                aria-hidden
              >
                <path
                  d="M3 11 Q150 1 297 9"
                  className="fill-none stroke-[#f2645e] stroke-[4]"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg">
            Spin up a separate, fully isolated CRM for each business in under a
            minute — with its own pipeline, team, branches and branded login
            page.
          </p>

          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.id}
                id={f.id}
                className="flex scroll-mt-28 flex-col items-center rounded-xl p-2 text-center target:bg-white target:shadow-md target:ring-1 target:ring-[#714b67]/20 dark:target:bg-card"
              >
                <span
                  className="grid size-16 place-items-center rounded-2xl text-white shadow-md"
                  style={featureTile(f.color)}
                >
                  <f.icon className="size-7" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#111827] dark:text-foreground">
                  {f.title}
                </h3>
                <p className="mt-1 text-[15px] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 py-16 text-center sm:px-6">
        <h2
          className={cn(
            script.className,
            "text-5xl leading-tight text-[#111827] sm:text-7xl dark:text-foreground",
          )}
        >
          Unleash your <span className={CORAL}>growth</span> potential
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg border border-[#5f3f57] bg-[#714b67] px-8 py-4 text-lg font-medium text-white shadow-md transition hover:-translate-y-px hover:bg-[#5f3f57]"
          >
            Create your first project
          </Link>
        </div>
        <p className="mt-5 text-[15px]">
          Leads, follow-ups, appointments and reports — for every business you
          run.
        </p>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm sm:px-6">
          <Wordmark className="text-2xl" />
          <span className="text-muted-foreground">
            One CRM for all your projects
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Static picture of the app's real Pipeline screen (leads kanban).    */
/* Mirrors app-shell.tsx, page-header.tsx, filter-bar.tsx and          */
/* leads-kanban.tsx, filled with sample data from a clinic project     */
/* using the default stages a new project starts with.                */
/* ------------------------------------------------------------------ */

type FollowUp = "overdue" | "today" | "planned" | "none";
type SampleLead = {
  name: string;
  service: string;
  phone: string;
  source: string;
  repeat?: number;
  followUp: FollowUp;
  branch: string;
  owner: keyof typeof OWNERS;
};

/** Same colour families the app uses for follow-up state (bar + clock icon). */
const FOLLOW_UP: Record<FollowUp, { bar: string; icon: string }> = {
  planned: { bar: "bg-[#28a745]", icon: "text-[#28a745]" },
  today: { bar: "bg-[#e99d00]", icon: "text-[#e99d00]" },
  overdue: { bar: "bg-[#d44c59]", icon: "text-[#d44c59]" },
  none: { bar: "bg-[#6b7280]/25", icon: "text-[#6b7280]/60" },
};

/** Source tags and assignee avatars are tinted from the app's palette. */
const SOURCE_COLOR: Record<string, string> = {
  Website: "#d6145f",
  "Meta Ads": "#9365b8",
  Instagram: "#f06050",
  "Google Ads": "#f4a460",
  WhatsApp: "#30c381",
  Referral: "#2c8397",
  "Walk-in": "#475577",
  "Inbound Call": "#6cc1ed",
};
const OWNERS = { AK: "#9365b8", SN: "#2c8397", RV: "#eb7e7f", MJ: "#475577" } as const;

const STAGES: { name: string; count: number; bar: [number, number, number, number]; leads: SampleLead[] }[] = [
  {
    name: "New Lead",
    count: 14,
    bar: [5, 3, 2, 4],
    leads: [
      { name: "Priya Sharma", service: "General Consultation", phone: "+91 98201 44512", source: "Website", followUp: "planned", branch: "City Centre", owner: "AK" },
      { name: "Rahul Mehta", service: "Full Body Therapy", phone: "+91 99870 21455", source: "Meta Ads", repeat: 2, followUp: "today", branch: "Main Branch", owner: "SN" },
      { name: "Kavya Reddy", service: "Premium Package", phone: "+91 90080 67321", source: "Instagram", followUp: "none", branch: "Lakeside", owner: "RV" },
    ],
  },
  {
    name: "Follow-up",
    count: 9,
    bar: [3, 2, 4, 0],
    leads: [
      { name: "Neha Kapoor", service: "Follow-up Visit", phone: "+91 98450 11873", source: "Google Ads", followUp: "overdue", branch: "Main Branch", owner: "RV" },
      { name: "Vikram Rao", service: "General Consultation", phone: "+91 97411 50926", source: "WhatsApp", followUp: "planned", branch: "City Centre", owner: "AK" },
      { name: "Ananya Iyer", service: "Full Body Therapy", phone: "+91 96860 33410", source: "Referral", followUp: "today", branch: "Lakeside", owner: "MJ" },
    ],
  },
  {
    name: "Contacted",
    count: 7,
    bar: [3, 1, 2, 1],
    leads: [
      { name: "Karan Singh", service: "Premium Package", phone: "+91 98863 72045", source: "Inbound Call", followUp: "overdue", branch: "City Centre", owner: "SN" },
      { name: "Isha Patel", service: "General Consultation", phone: "+91 99011 48266", source: "Walk-in", repeat: 3, followUp: "planned", branch: "Main Branch", owner: "MJ" },
    ],
  },
  {
    name: "Appointment Booked",
    count: 5,
    bar: [4, 1, 0, 0],
    leads: [
      { name: "Meera Joshi", service: "Follow-up Visit", phone: "+91 97399 20584", source: "Google Ads", followUp: "planned", branch: "Lakeside", owner: "AK" },
      { name: "Arjun Das", service: "Full Body Therapy", phone: "+91 98804 66132", source: "Website", followUp: "today", branch: "City Centre", owner: "RV" },
    ],
  },
  {
    name: "No Show",
    count: 3,
    bar: [0, 1, 2, 0],
    leads: [
      { name: "Sneha Kulkarni", service: "General Consultation", phone: "+91 96635 18890", source: "Meta Ads", followUp: "overdue", branch: "Main Branch", owner: "SN" },
    ],
  },
];

const NAV = ["Dashboard", "To-Do", "Leads", "Appointments", "Patients", "Call Logs", "Reports", "Settings"];

function PipelineMockup() {
  const total = STAGES.reduce((n, s) => n + s.count, 0);
  return (
    <div
      aria-hidden
      className="pointer-events-none overflow-hidden rounded-xl border border-black/5 bg-[#f9fafb] text-[#1f2937] shadow-[0_30px_80px_-20px_rgba(17,24,39,0.35)] select-none"
    >
      {/* navbar — app-shell.tsx */}
      <div className="flex h-11 items-center gap-1 border-b border-[#dee2e6] bg-white px-2.5 text-[12px] text-[#374151]">
        <span className="grid size-7 place-items-center">
          <LayoutGridIcon className="size-3.5" />
        </span>
        <span className="flex items-center gap-1.5 px-1.5">
          <span className="grid size-5 place-items-center rounded-md bg-[#714b67] text-[8px] font-bold text-white">SC</span>
          <span className="text-[13px] font-semibold text-[#1f2937]">Sunrise Clinic</span>
        </span>
        <span className="hidden items-center md:flex">
          {NAV.map((n) => (
            <span key={n} className={cn("rounded-md px-2 py-1 whitespace-nowrap", n === "Leads" && "bg-[#f3f4f6] font-medium text-[#1f2937]")}>
              {n}
            </span>
          ))}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className="grid size-7 place-items-center">
            <SearchIcon className="size-3.5" />
          </span>
          <span className="relative grid size-7 place-items-center">
            <ClockIcon className="size-3.5" />
            <span className="absolute top-0 right-0 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#d44c59] px-0.5 text-[8px] font-bold text-white">
              4
            </span>
          </span>
          <span className="ml-1 grid size-6 place-items-center rounded-md bg-[#714b67] text-[9px] font-bold text-white">AK</span>
        </span>
      </div>

      {/* control panel — page-header.tsx + filter-bar.tsx */}
      <div className="flex items-center gap-3 border-b border-[#dee2e6] bg-white px-4 py-2 text-[12px]">
        <span className="rounded-md bg-[#714b67] px-2.5 py-1 font-medium text-white">New</span>
        <span className="leading-tight">
          <span className="block text-[14px] font-semibold">Pipeline</span>
          <span className="block text-[10px] text-[#6b7280]">{total} last 30 days · leads</span>
        </span>
        <span className="mx-auto hidden w-[22rem] items-stretch rounded-md border border-[#dee2e6] sm:flex">
          <span className="flex flex-1 items-center gap-1.5 py-1 pl-2">
            <SearchIcon className="size-3 text-[#6b7280]" />
            <span className="flex items-center overflow-hidden rounded-sm bg-[#f3f4f6] text-[10px]">
              <span className="grid self-stretch place-items-center bg-[#714b67] px-1 text-white">
                <FilterIcon className="size-2.5" />
              </span>
              <span className="px-1.5 py-0.5">
                <span className="text-[#6b7280]">Date range:</span> Last 30 days
              </span>
              <XIcon className="mr-1 size-2.5 text-[#6b7280]" />
            </span>
            <span className="text-[#9ca3af]">Search…</span>
          </span>
          <span className="flex items-center border-l border-[#dee2e6] px-1.5 text-[#6b7280]">
            <ChevronDownIcon className="size-3" />
          </span>
        </span>
        <span className="ml-auto flex items-center gap-2 sm:ml-0">
          <RefreshCwIcon className="size-3.5 text-[#374151]" />
          <span className="flex overflow-hidden rounded-md border border-[#dee2e6]">
            <span className="grid h-6 w-7 place-items-center bg-[#e7e9ed]">
              <KanbanSquareIcon className="size-3" />
            </span>
            <span className="grid h-6 w-7 place-items-center border-l border-[#dee2e6] text-[#6b7280]">
              <ListIcon className="size-3" />
            </span>
          </span>
        </span>
      </div>

      {/* kanban — leads-kanban.tsx */}
      <div className="flex gap-3 px-4 pt-3 pb-5">
        {STAGES.map((stage) => {
          const sum = stage.bar.reduce((a, b) => a + b, 0) || 1;
          return (
            <div key={stage.name} className="w-[220px] shrink-0">
              <div className="flex items-center justify-between px-0.5">
                <span className="truncate text-[13px] font-semibold">{stage.name}</span>
                <PlusIcon className="size-3.5 text-[#6b7280]" />
              </div>
              <div className="mt-1.5 flex items-center gap-2 px-0.5">
                <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-[#f3f4f6]">
                  {(["planned", "today", "overdue", "none"] as const).map((k, i) => (
                    <span key={k} className={cn("h-full", FOLLOW_UP[k].bar)} style={{ width: `${(stage.bar[i] / sum) * 100}%` }} />
                  ))}
                </div>
                <span className="text-[12px] font-semibold text-[#6b7280] tabular-nums">{stage.count}</span>
              </div>
              <div className="mt-2.5 flex flex-col gap-2">
                {stage.leads.map((l) => {
                  const tag = SOURCE_COLOR[l.source];
                  return (
                    <div key={l.name} className="rounded-md border border-[#dee2e6] bg-white p-2 text-[11px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                      <div className="truncate text-[12px] font-semibold">{l.name}</div>
                      <div className="truncate text-[#1f2937]/80">{l.service}</div>
                      <div className="truncate text-[#6b7280]">{l.phone}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span
                          className="rounded-full px-1.5 py-px text-[9.5px] font-medium"
                          style={{ color: tag, backgroundColor: `color-mix(in oklch, ${tag} 15%, white)` }}
                        >
                          {l.source}
                        </span>
                        {l.repeat && (
                          <span className="rounded-full bg-[#e99d00]/15 px-1.5 py-px text-[9.5px] font-medium text-[#b37800]">
                            Repeat ×{l.repeat}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#6b7280]">
                        <ClockIcon className={cn("size-3.5", FOLLOW_UP[l.followUp].icon)} />
                        <span className="truncate">{l.branch}</span>
                        <span
                          className="ml-auto grid size-5 shrink-0 place-items-center rounded-full text-[8px] font-bold text-white"
                          style={{ background: OWNERS[l.owner] }}
                        >
                          {l.owner}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
