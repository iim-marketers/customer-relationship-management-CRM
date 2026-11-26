"use client";

import { ClockIcon, LogOutIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, use, useRef, useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { ProjectLogo } from "@/components/crm/project-logo";
import { navItems } from "@/components/crm/nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, initials } from "@/lib/utils";

type Alerts = { overdueFollowUps: number; overdueTasks: number; todayAppointments: number };

type ShellProps = {
  project: { name: string; slug: string; logo_url: string | null; brand_color: string | null; contact_label: string };
  user: { name: string; roleLabel: string };
  alerts: Promise<Alerts>;
  children: React.ReactNode;
};

function useActive(base: string) {
  const pathname = usePathname();
  return (href: string) => pathname === `${base}/${href}` || pathname.startsWith(`${base}/${href}/`);
}

function ActivityMenu({ base, alerts }: { base: string; alerts: Promise<Alerts> }) {
  return (
    <Suspense
      fallback={
        <Button variant="ghost" size="icon" aria-label="Activities" disabled>
          <ClockIcon />
        </Button>
      }
    >
      <ActivityMenuContent base={base} alerts={alerts} />
    </Suspense>
  );
}

function ActivityMenuContent({ base, alerts: alertsPromise }: { base: string; alerts: Promise<Alerts> }) {
  const alerts = use(alertsPromise);
  const count = alerts.overdueFollowUps + alerts.overdueTasks;
  const rows = [
    { n: alerts.overdueFollowUps, label: "Overdue follow-ups", href: `${base}/todo`, tone: "late" },
    { n: alerts.overdueTasks, label: "Overdue tasks", href: `${base}/todo?filter=tasks`, tone: "late" },
    { n: alerts.todayAppointments, label: "Appointments today", href: `${base}/appointments`, tone: "today" },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Activities">
          <ClockIcon />
          {count > 0 && (
            <span className="absolute top-0 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-3 py-2 text-sm font-semibold">Activities</div>
        <div className="py-1">
          {rows.map((a) => (
            <Link key={a.label} href={a.href} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full",
                  a.n === 0 ? "bg-muted text-muted-foreground" : a.tone === "late" ? "bg-destructive/12 text-destructive" : "bg-warning/15 text-warning",
                )}
              >
                <ClockIcon className="size-4" />
              </span>
              <span className="flex-1">{a.label}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", a.n > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {a.n}
              </span>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu({ user, slug }: { user: ShellProps["user"]; slug: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md p-1 hover:bg-muted" aria-label="User menu">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">{initials(user.name)}</span>
          <span className="hidden max-w-32 truncate text-sm xl:block">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.roleLabel}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/p/${slug}/settings`}>Preferences</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => formRef.current?.requestSubmit()}>
          <LogOutIcon /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
      <form ref={formRef} action={signOut} className="hidden">
        <input type="hidden" name="project" value={slug} />
      </form>
    </DropdownMenu>
  );
}

export function AppShell({ project, user, alerts, children }: ShellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const base = `/p/${project.slug}`;
  const isActive = useActive(base);
  const items = navItems(project.contact_label);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-1 border-b bg-navbar px-2 text-navbar-foreground shadow-xs sm:px-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="flex items-center gap-3 border-b px-4 py-3 text-base">
              <ProjectLogo project={project} className="size-8 rounded-md" />
              <span className="truncate">{project.name}</span>
            </SheetTitle>
            <nav className="flex flex-col p-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={`${base}/${item.href}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                    isActive(item.href) ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href={`${base}/dashboard`} className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 hover:bg-muted">
          <ProjectLogo project={project} className="size-6 rounded-md text-[10px]" />
          <span className="truncate text-base font-semibold">{project.name}</span>
        </Link>

        <nav className="hidden min-w-0 items-center lg:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={`${base}/${item.href}`}
              className={cn(
                "relative rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-muted",
                isActive(item.href) && "bg-muted font-medium text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <form
            className="relative hidden xl:block"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q")?.toString().trim();
              if (q) router.push(`${base}/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" placeholder="Search…" className="h-8 w-48 bg-muted/60 pl-8 text-sm" />
          </form>
          <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Search" asChild>
            <Link href={`${base}/search`}>
              <SearchIcon />
            </Link>
          </Button>
          <ActivityMenu base={base} alerts={alerts} />
          <UserMenu user={user} slug={project.slug} />
        </div>
      </header>

      <main className="min-w-0 flex-1 px-3 pb-10 sm:px-4 lg:px-6">{children}</main>
    </div>
  );
}
