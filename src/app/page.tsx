import {
  ActivityIcon,
  BarChart3Icon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  CalendarXIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  ClockIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  ListTodoIcon,
  LogOutIcon,
  MoonIcon,
  PanelLeftIcon,
  PhoneCallIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { FEATURES, featureTile } from "@/components/site/features";
import { ScrollLink } from "@/components/site/scroll-link";
import { SiteHeader, Wordmark } from "@/components/site/site-header";
import { scriptFont as script } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const CORAL = "text-[#f2645e]";

export default function Home() {
  return (
    <div className="min-h-svh overflow-x-clip bg-white text-[#374151] dark:bg-background dark:text-foreground">
      <SiteHeader />

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
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl border border-[#115e59] bg-[#0f766e] px-6 py-3 text-lg font-medium text-white shadow-md transition hover:-translate-y-px hover:bg-[#115e59]"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-[#f1f2f4] px-6 py-3 text-lg font-medium text-[#0f766e] transition hover:bg-[#e7e9ed] dark:bg-secondary dark:text-foreground"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-5 text-[15px]">
          Ready in under a minute, with a branded login page for each project.{" "}
          <ScrollLink
            href="#features"
            className="font-medium text-[#0f766e] hover:underline dark:text-primary"
          >
            See why
          </ScrollLink>
        </p>
      </section>

      <section id="overview" className="relative mt-12 scroll-mt-24">
        <div
          aria-hidden
          className="absolute inset-x-[-30%] top-24 bottom-0 rounded-t-[50%] bg-[#f1f2f4] dark:bg-muted"
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <DashboardMockup />
        </div>
      </section>

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
                "relative inline-block text-[1.25em] font-normal text-[#0f766e] dark:text-primary",
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
                className="flex scroll-mt-28 flex-col items-center rounded-xl p-2 text-center target:bg-white target:shadow-md target:ring-1 target:ring-[#0f766e]/20 dark:target:bg-card"
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
            className="rounded-lg border border-[#115e59] bg-[#0f766e] px-8 py-4 text-lg font-medium text-white shadow-md transition hover:-translate-y-px hover:bg-[#115e59]"
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

const TEAL = "#0f766e";

const MOCK_NAV = [
  { group: "Overview", items: [{ label: "Dashboard", icon: LayoutDashboardIcon, active: true }, { label: "To-Do", icon: ListTodoIcon, count: 4 }] },
  {
    group: "Sales",
    items: [
      { label: "Leads", icon: ClipboardListIcon },
      { label: "Appointments", icon: CalendarCheckIcon, count: 3 },
      { label: "Patients", icon: UsersIcon },
      { label: "Call Logs", icon: PhoneCallIcon },
    ],
  },
  { group: "Insights", items: [{ label: "Reports", icon: BarChart3Icon }, { label: "Settings", icon: SettingsIcon }] },
] as const;

const MOCK_STATS = [
  { label: "Total leads", value: "38", hint: "12 with repeat enquiries", icon: ClipboardListIcon, chip: "bg-[#f3f4f6] text-[#6b7280]" },
  { label: "Booked appointments", value: "11", hint: "Scheduled or confirmed", icon: CalendarCheckIcon, chip: "bg-[#017e84]/12 text-[#017e84]" },
  { label: "No-show appointments", value: "3", hint: "Needs recovery follow-up", icon: CalendarXIcon, chip: "bg-[#ea580c]/12 text-[#ea580c]" },
  { label: "Patient conversion", value: "24%", hint: "9 converted leads", icon: TrendingUpIcon, chip: "bg-[#28a745]/12 text-[#28a745]" },
];

const MOCK_STAGES = [
  { name: "New Lead", color: "#0ea5e9", count: 6 },
  { name: "Follow-up", color: "#6b8afd", count: 8 },
  { name: "Contacted", color: "#f97316", count: 6 },
  { name: "Appointment Booked", color: "#14b8a6", count: 5 },
  { name: "No Show", color: "#ef4444", count: 3 },
  { name: "Lost", color: "#78716c", count: 1 },
  { name: "Converted", color: "#22c55e", count: 9 },
];

const MOCK_FOLLOW_UPS = [
  { name: "Neha Kapoor", detail: "Google Ads / Follow-up Visit", when: "26 Nov, 10:00 · overdue", overdue: true, stage: 1 },
  { name: "Karan Singh", detail: "Inbound Call / Premium Package", when: "26 Nov, 16:30", overdue: false, stage: 2 },
  { name: "Vikram Rao", detail: "WhatsApp / General Consultation", when: "27 Nov, 11:15", overdue: false, stage: 0 },
];

const MOCK_APPOINTMENTS = [
  { day: "26 Nov", time: "14:30", name: "Meera Joshi", where: "Lakeside", status: "Confirmed", tone: "#14b8a6" },
  { day: "27 Nov", time: "10:00", name: "Arjun Das", where: "City Centre", status: "Scheduled", tone: "#6b8afd" },
  { day: "27 Nov", time: "17:45", name: "Isha Patel", where: "Main Branch", status: "Rescheduled", tone: "#a78bfa" },
];

const MOCK_NEWEST = [
  { name: "Rohit Mehra", detail: "Website Form · 98201 44310", when: "26 Nov, 09:12", stage: 0 },
  { name: "Sana Sheikh", detail: "Google Ads · 99870 21543", when: "25 Nov, 18:40", stage: 1 },
  { name: "Ankit Verma", detail: "WhatsApp · 91672 80915", when: "25 Nov, 12:05", stage: 3 },
];

const MOCK_REPEATS = [
  { name: "Priya Nair", detail: "3 enquiries · latest via Google Ads", when: "26 Nov, 08:45" },
  { name: "Dev Malhotra", detail: "2 enquiries · latest via Inbound Call", when: "25 Nov, 15:20" },
  { name: "Kavya Iyer", detail: "2 enquiries · latest via WhatsApp", when: "24 Nov, 11:30" },
];

function MockBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="shrink-0 rounded-md px-1.5 py-px text-[9.5px] font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)` }}
    >
      {children}
    </span>
  );
}

function MockPanel({
  title,
  icon: Icon,
  action,
  className,
  children,
}: {
  title: string;
  icon: typeof ClockIcon;
  action?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-[#dee2e6] bg-white shadow-xs", className)}>
      <div className="flex items-center justify-between border-b border-[#dee2e6] px-3.5 py-2">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold">
          <Icon className="size-3.5" style={{ color: TEAL }} />
          {title}
        </span>
        {action && (
          <span className="text-[11px] font-medium" style={{ color: TEAL }}>
            {action}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function StageDot({ color }: { color: string }) {
  return <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />;
}

function StagePill({ stage }: { stage: (typeof MOCK_STAGES)[number] }) {
  return <MockBadge color={stage.color}>{stage.name}</MockBadge>;
}

function DashboardMockup() {
  const total = MOCK_STAGES.reduce((n, s) => n + s.count, 0);
  return (
    <div
      aria-hidden
      className="pointer-events-none flex overflow-hidden rounded-xl border border-black/5 bg-[#f9fafb] text-left text-[#1f2937] shadow-[0_30px_80px_-20px_rgba(17,24,39,0.35)] select-none"
    >
      <div className="hidden w-[184px] shrink-0 flex-col border-r border-[#dee2e6] bg-white md:flex">
        <div className="flex h-11 items-center gap-2 border-b border-[#dee2e6] px-3">
          <span className="grid size-6 place-items-center rounded-lg text-[9px] font-bold text-white" style={{ background: TEAL }}>
            SC
          </span>
          <span className="leading-tight">
            <span className="block text-[12px] font-semibold">Sunrise Clinic</span>
            <span className="block text-[9.5px] text-[#6b7280]">CRM workspace</span>
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          <span className="flex h-7 items-center gap-1.5 rounded-md border border-[#dee2e6] px-2 text-[11px] text-[#6b7280]">
            <SearchIcon className="size-3" /> Search…
          </span>
          {MOCK_NAV.map((section) => (
            <div key={section.group}>
              <div className="px-2 pt-1 pb-1 text-[9px] font-semibold tracking-wider text-[#374151]/45 uppercase">{section.group}</div>
              {section.items.map((item) => {
                const active = "active" in item && item.active;
                return (
                  <span
                    key={item.label}
                    className={cn("flex h-7 items-center gap-2 rounded-md px-2 text-[11.5px]", active ? "font-medium" : "text-[#374151]/80")}
                    style={active ? { background: `${TEAL}1a`, color: TEAL } : undefined}
                  >
                    <item.icon className="size-3.5" style={{ color: active ? TEAL : "rgba(55,65,81,0.55)" }} />
                    {item.label}
                    {"count" in item && (
                      <span
                        className={cn(
                          "ml-auto rounded-full px-1.5 text-[9px] leading-4 font-semibold",
                          item.label === "To-Do" ? "bg-[#d44c59]/12 text-[#d44c59]" : "",
                        )}
                        style={item.label === "To-Do" ? undefined : { background: `${TEAL}1f`, color: TEAL }}
                      >
                        {item.count}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-[#dee2e6] p-2.5">
          <span className="grid size-6 place-items-center rounded-full text-[9px] font-semibold" style={{ background: `${TEAL}1f`, color: TEAL }}>
            AK
          </span>
          <span className="leading-tight">
            <span className="block text-[11px] font-medium">Aditi Kumar</span>
            <span className="block text-[9.5px] text-[#6b7280]">Owner</span>
          </span>
          <ChevronsUpDownIcon className="ml-auto size-3 text-[#6b7280]" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex h-11 items-center gap-2 border-b border-[#dee2e6] bg-white px-3 text-[12px]">
          <PanelLeftIcon className="size-3.5 text-[#374151]" />
          <span className="h-3.5 w-px bg-[#dee2e6]" />
          <span className="font-semibold">Sunrise Clinic</span>
          <span className="text-[#6b7280]">/</span>
          <span className="font-medium">Dashboard</span>
          <span className="ml-auto flex items-center gap-2.5 text-[#374151]">
            <span className="hidden items-center gap-1 rounded-md border border-[#dee2e6] bg-[#f3f4f6]/60 px-2 py-0.5 text-[10px] font-medium text-[#6b7280] sm:flex">
              <CalendarDaysIcon className="size-3" /> Thu, 26 Nov
            </span>
            <MoonIcon className="size-3.5" />
            <span className="relative">
              <ClockIcon className="size-3.5" />
              <span className="absolute -top-1.5 -right-1.5 grid h-3 min-w-3 place-items-center rounded-full bg-[#d44c59] px-0.5 text-[7px] font-bold text-white">
                4
              </span>
            </span>
            <LogOutIcon className="size-3.5" />
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[#dee2e6] bg-white px-4 py-2">
          <span className="leading-tight">
            <span className="block text-[14px] font-semibold">Dashboard</span>
            <span className="block text-[10px] text-[#6b7280]">Last 30 days · Sunrise Clinic</span>
          </span>
          <span className="flex h-7 items-center gap-1.5 rounded-md border border-[#dee2e6] bg-white px-2 text-[11px]">
            <CalendarRangeIcon className="size-3 text-[#6b7280]" /> Last 30 days
            <ChevronDownIcon className="size-3 text-[#6b7280]" />
          </span>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {MOCK_STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-[#dee2e6] bg-white p-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10.5px] font-medium text-[#6b7280]">{s.label}</span>
                  <span className={cn("grid size-6 place-items-center rounded-md", s.chip)}>
                    <s.icon className="size-3.5" />
                  </span>
                </div>
                <div className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">{s.value}</div>
                <div className="truncate text-[10px] text-[#6b7280]">{s.hint}</div>
              </div>
            ))}
          </div>

          <MockPanel title="Lead Pipeline" icon={ActivityIcon} action="Open pipeline">
            <div className="flex flex-col gap-2.5 p-3">
              <div className="flex h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                {MOCK_STAGES.map((st) => (
                  <span key={st.name} style={{ width: `${(st.count / total) * 100}%`, background: st.color }} />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 lg:grid-cols-7">
                {MOCK_STAGES.map((st, i) => (
                  <div key={st.name} className={cn("rounded-md border border-[#dee2e6] bg-[#f9fafb]/60 px-2 py-1.5", i > 3 && "hidden lg:block")}>
                    <span className="flex items-center gap-1 text-[9.5px] text-[#6b7280]">
                      <StageDot color={st.color} />
                      <span className="truncate">{st.name}</span>
                    </span>
                    <span className="mt-0.5 flex items-baseline justify-between">
                      <span className="text-[15px] font-semibold tabular-nums">{st.count}</span>
                      <span className="text-[9px] text-[#6b7280] tabular-nums">{Math.round((st.count / total) * 100)}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </MockPanel>

          <div className="grid gap-3 sm:grid-cols-2">
            <MockPanel title="Follow-up Queue" icon={ListChecksIcon} action="Open To-Do">
              <ul className="divide-y divide-[#dee2e6] px-1">
                {MOCK_FOLLOW_UPS.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 px-2.5 py-2">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: f.overdue ? "#d44c59" : TEAL }} />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[11.5px] font-medium">{f.name}</span>
                      <span className="block truncate text-[10px] text-[#6b7280]">{f.detail}</span>
                      <span className={cn("block text-[9.5px]", f.overdue ? "text-[#d44c59]" : "text-[#6b7280]")}>{f.when}</span>
                    </span>
                    <StagePill stage={MOCK_STAGES[f.stage]} />
                  </li>
                ))}
              </ul>
            </MockPanel>

            <MockPanel title="Upcoming Appointments" icon={CalendarCheckIcon} action="Calendar">
              <ul className="divide-y divide-[#dee2e6] px-1">
                {MOCK_APPOINTMENTS.map((a) => (
                  <li key={a.name} className="flex items-center gap-2.5 px-2.5 py-2">
                    <span className="w-11 shrink-0 rounded-md bg-[#f3f4f6] py-0.5 text-center leading-tight">
                      <span className="block text-[8.5px] text-[#6b7280] uppercase">{a.day}</span>
                      <span className="block text-[11px] font-semibold tabular-nums">{a.time}</span>
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[11.5px] font-medium">{a.name}</span>
                      <span className="block truncate text-[10px] text-[#6b7280]">{a.where}</span>
                    </span>
                    <MockBadge color={a.tone}>{a.status}</MockBadge>
                  </li>
                ))}
              </ul>
            </MockPanel>

            <MockPanel title="Newest Leads" icon={SparklesIcon} action="View all" className="hidden sm:block">
                <ul className="divide-y divide-[#dee2e6] px-1">
                  {MOCK_NEWEST.map((l) => (
                    <li key={l.name} className="flex items-center gap-2 px-2.5 py-2">
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[11.5px] font-medium">{l.name}</span>
                        <span className="block truncate text-[10px] text-[#6b7280]">{l.detail}</span>
                        <span className="block text-[9.5px] text-[#6b7280]">{l.when}</span>
                      </span>
                      <StagePill stage={MOCK_STAGES[l.stage]} />
                    </li>
                  ))}
                </ul>
            </MockPanel>

            <MockPanel title="Recent Repeat Enquiries" icon={RefreshCwIcon} className="hidden sm:block">
                <ul className="divide-y divide-[#dee2e6] px-1">
                  {MOCK_REPEATS.map((r) => (
                    <li key={r.name} className="flex items-center gap-2 px-2.5 py-2">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: TEAL }} />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[11.5px] font-medium">{r.name}</span>
                        <span className="block truncate text-[10px] text-[#6b7280]">{r.detail}</span>
                        <span className="block text-[9.5px] text-[#6b7280]">{r.when}</span>
                      </span>
                      <MockBadge color="#f97316">Re-enquiry</MockBadge>
                    </li>
                  ))}
                </ul>
            </MockPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
