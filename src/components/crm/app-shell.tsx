"use client";

import { BellIcon, ChevronsUpDownIcon, LogOutIcon, MenuIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { ProjectLogo } from "@/components/crm/project-logo";
import { navItems } from "@/components/crm/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, initials } from "@/lib/utils";

type ShellProps = {
  project: { name: string; slug: string; logo_url: string | null; brand_color: string | null; contact_label: string };
  user: { name: string; roleLabel: string };
  alerts: { overdueFollowUps: number; overdueTasks: number; todayAppointments: number };
  children: React.ReactNode;
};

function Sidebar({ project, onNavigate }: { project: ShellProps["project"]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const base = `/p/${project.slug}`;

  return (
    <div className="flex h-full flex-col gap-4 p-3 text-sidebar-foreground">
      <Link
        href="/projects"
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-sidebar-accent"
        title="Switch project"
      >
        <ProjectLogo project={project} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{project.name}</div>
          <div className="text-xs opacity-75">Switch project</div>
        </div>
        <ChevronsUpDownIcon className="size-4 opacity-60 group-hover:opacity-100" />
      </Link>
      <nav className="flex flex-col gap-1">
        {navItems(project.contact_label).map((item) => {
          const href = `${base}/${item.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "opacity-85 hover:bg-sidebar-accent/60 hover:opacity-100",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AppShell({ project, user, alerts, children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const base = `/p/${project.slug}`;
  const current = navItems(project.contact_label).find((i) => pathname.startsWith(`${base}/${i.href}`));
  const title = current?.label ?? (pathname.startsWith(`${base}/search`) ? "Search" : "CRM");
  const alertCount = alerts.overdueFollowUps + alerts.overdueTasks;

  const sidebarClass = "bg-gradient-to-b from-[var(--sidebar-from)] to-[var(--sidebar-to)]";

  return (
    <div className="flex min-h-svh gap-3 p-0 lg:p-3">
      <aside
        className={cn(
          "sticky top-3 hidden h-[calc(100svh-1.5rem)] w-60 shrink-0 overflow-y-auto rounded-2xl border border-sidebar-border lg:block",
          sidebarClass,
        )}
      >
        <Sidebar project={project} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/85 px-3 py-2.5 backdrop-blur lg:top-3 lg:rounded-2xl lg:border">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={cn("w-64 border-sidebar-border p-0", sidebarClass)}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Sidebar project={project} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{user.roleLabel}</div>
            <div className="truncate text-lg leading-tight font-bold">{title}</div>
          </div>

          <form
            className="relative ml-auto hidden w-full max-w-xs md:block"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q")?.toString().trim();
              if (q) router.push(`${base}/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" placeholder={`Search leads, ${project.contact_label.toLowerCase()}, phone…`} className="h-9 pl-9" />
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Search" asChild>
              <Link href={`${base}/search`}>
                <SearchIcon />
              </Link>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
                  <BellIcon />
                  {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                      {alertCount > 99 ? "99+" : alertCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-2">
                <div className="px-2 py-1.5 text-sm font-semibold">Needs attention</div>
                {[
                  { n: alerts.overdueFollowUps, label: "overdue follow-ups", href: `${base}/todo` },
                  { n: alerts.overdueTasks, label: "overdue tasks", href: `${base}/todo?filter=tasks` },
                  { n: alerts.todayAppointments, label: "appointments today", href: `${base}/appointments` },
                ].map((a) => (
                  <Link key={a.label} href={a.href} className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted">
                    <span className="text-muted-foreground">{a.label}</span>
                    <span className={cn("font-semibold", a.n > 0 && a.label.startsWith("overdue") && "text-destructive")}>{a.n}</span>
                  </Link>
                ))}
              </PopoverContent>
            </Popover>
            <ThemeToggle />
            <div className="hidden items-center gap-2 pl-1 sm:flex">
              <span className="grid size-8 place-items-center rounded-lg bg-secondary text-sm font-bold text-primary">
                {initials(user.name)}
              </span>
              <div className="max-w-32 leading-tight">
                <div className="truncate text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.roleLabel}</div>
              </div>
            </div>
            <form action={signOut}>
              <input type="hidden" name="project" value={project.slug} />
              <Button variant="outline" size="icon" aria-label="Sign out">
                <LogOutIcon />
              </Button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 pb-10 lg:px-1">{children}</main>
      </div>
    </div>
  );
}
