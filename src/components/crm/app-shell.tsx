"use client";

import {
  CalendarDaysIcon,
  ChevronsUpDownIcon,
  ClockIcon,
  LogOutIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, use, useState } from "react";
import { ProjectLogo } from "@/components/crm/project-logo";
import { NAV_GROUPS, navItems } from "@/components/crm/nav";
import { SignOutButton, SignOutDialog } from "@/components/crm/sign-out-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn, initials } from "@/lib/utils";

type Alerts = {
  overdueFollowUps: number;
  overdueTasks: number;
  todayAppointments: number;
};

type ShellProps = {
  project: {
    name: string;
    slug: string;
    logo_url: string | null;
    contact_label: string;
  };
  user: { name: string; roleLabel: string };
  alerts: Promise<Alerts>;
  defaultOpen?: boolean;
  today: string;
  children: React.ReactNode;
};

function useActive(base: string) {
  const pathname = usePathname();
  return (href: string) =>
    pathname === `${base}/${href}` || pathname.startsWith(`${base}/${href}/`);
}

function ActivityMenu({
  base,
  alerts,
}: {
  base: string;
  alerts: Promise<Alerts>;
}) {
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

function ActivityMenuContent({
  base,
  alerts: alertsPromise,
}: {
  base: string;
  alerts: Promise<Alerts>;
}) {
  const alerts = use(alertsPromise);
  const count = alerts.overdueFollowUps + alerts.overdueTasks;
  const rows = [
    {
      n: alerts.overdueFollowUps,
      label: "Overdue follow-ups",
      href: `${base}/todo`,
      tone: "late",
    },
    {
      n: alerts.overdueTasks,
      label: "Overdue tasks",
      href: `${base}/todo?filter=tasks`,
      tone: "late",
    },
    {
      n: alerts.todayAppointments,
      label: "Appointments today",
      href: `${base}/appointments`,
      tone: "today",
    },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Activities"
        >
          <ClockIcon />
          {count > 0 && (
            <span className="absolute top-0 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-3 py-2 text-sm font-semibold">
          Activities
        </div>
        <div className="py-1">
          {rows.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted"
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full",
                  a.n === 0
                    ? "bg-muted text-muted-foreground"
                    : a.tone === "late"
                      ? "bg-destructive/12 text-destructive"
                      : "bg-warning/15 text-warning",
                )}
              >
                <ClockIcon className="size-4" />
              </span>
              <span className="flex-1">{a.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  a.n > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
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
  const { isMobile } = useSidebar();
  const [signOutOpen, setSignOutOpen] = useState(false);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              aria-label="User menu"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                {initials(user.name)}
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.roleLabel}
                </span>
              </span>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
            className="w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground">
                {user.roleLabel}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/p/${slug}/settings`}>Preferences</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
              {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSignOutOpen(true)}>
              <LogOutIcon /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavCount({
  alerts,
  pick,
  tone,
}: {
  alerts: Promise<Alerts>;
  pick: (a: Alerts) => number;
  tone: "late" | "today";
}) {
  const n = pick(use(alerts));
  if (n === 0) return null;
  return (
    <>
      <span
        className={cn(
          "ml-auto rounded-full px-1.5 py-px text-[11px] leading-4 font-semibold tabular-nums group-data-[collapsible=icon]:hidden",
          tone === "late"
            ? "bg-destructive/12 text-destructive"
            : "bg-primary/12 text-primary",
        )}
      >
        {n > 99 ? "99+" : n}
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute top-1 right-1 hidden size-1.5 rounded-full group-data-[collapsible=icon]:block",
          tone === "late" ? "bg-destructive" : "bg-primary",
        )}
      />
    </>
  );
}

const NAV_COUNTS: Record<
  string,
  { pick: (a: Alerts) => number; tone: "late" | "today" }
> = {
  todo: { pick: (a) => a.overdueFollowUps + a.overdueTasks, tone: "late" },
  appointments: { pick: (a) => a.todayAppointments, tone: "today" },
};

const navButtonClass = cn(
  "relative h-9 gap-2 px-2.5 text-sidebar-foreground/80",
  "data-active:bg-primary/10 data-active:text-primary data-active:hover:bg-primary/15 data-active:hover:text-primary",
);

function AppSidebar({
  project,
  user,
  alerts,
}: Pick<ShellProps, "project" | "user" | "alerts">) {
  const base = `/p/${project.slug}`;
  const isActive = useActive(base);
  const { isMobile, setOpenMobile } = useSidebar();
  const items = navItems(project.contact_label);
  const closeOnMobile = () => isMobile && setOpenMobile(false);

  const renderItem = (item: (typeof items)[number]) => {
    const count = NAV_COUNTS[item.href];
    const active = isActive(item.href);
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.label}
          className={navButtonClass}
        >
          <Link href={`${base}/${item.href}`} onClick={closeOnMobile}>
            <item.icon
              className={
                active
                  ? "text-primary"
                  : "text-sidebar-foreground/55 group-hover/menu-button:text-sidebar-accent-foreground"
              }
            />
            <span className="truncate">{item.label}</span>
            {count && (
              <Suspense fallback={null}>
                <NavCount alerts={alerts} pick={count.pick} tone={count.tone} />
              </Suspense>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 justify-center border-b border-sidebar-border px-2 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={project.name}
              className="h-10 gap-2.5 px-1.5"
            >
              <Link href={`${base}/dashboard`} onClick={closeOnMobile}>
                <ProjectLogo
                  project={project}
                  className="size-7 rounded-lg text-[10px]"
                />
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {project.name}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    CRM workspace
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-2">
        <SidebarGroup className="py-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                variant="outline"
                tooltip="Search"
                isActive={isActive("search")}
                className="h-9 gap-2 border border-sidebar-border bg-sidebar px-2.5 text-muted-foreground shadow-none data-active:border-primary/40 data-active:text-primary"
              >
                <Link href={`${base}/search`} onClick={closeOnMobile}>
                  <SearchIcon />
                  <span>Search…</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group} className="py-1">
            <SidebarGroupLabel className="h-7 px-2.5 text-[11px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase group-data-[collapsible=icon]:-mt-7">
              {group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {items.filter((i) => i.group === group).map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu user={user} slug={project.slug} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function CurrentPage({
  base,
  contactLabel,
}: {
  base: string;
  contactLabel: string;
}) {
  const isActive = useActive(base);
  const current = [
    ...navItems(contactLabel),
    { href: "search", label: "Search" },
  ].find((i) => isActive(i.href));
  if (!current) return null;
  return (
    <>
      <span className="text-muted-foreground">/</span>
      <span className="truncate font-medium text-foreground">
        {current.label}
      </span>
    </>
  );
}

export function AppShell({
  project,
  user,
  alerts,
  defaultOpen = true,
  today,
  children,
}: ShellProps) {
  const base = `/p/${project.slug}`;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar project={project} user={user} alerts={alerts} />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-navbar px-2 text-navbar-foreground shadow-xs sm:px-3">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="data-vertical:h-4 data-vertical:self-center"
          />
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-2 text-sm"
          >
            <Link
              href={`${base}/dashboard`}
              className="flex min-w-0 items-center gap-2 font-semibold hover:text-foreground"
            >
              <ProjectLogo
                project={project}
                className="size-6 rounded-md text-[10px] md:hidden"
              />
              <span className="truncate">{project.name}</span>
            </Link>
            <span className="hidden min-w-0 items-center gap-2 sm:flex">
              <CurrentPage base={base} contactLabel={project.contact_label} />
            </span>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1 hidden items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground sm:flex">
              <CalendarDaysIcon className="size-3.5" />
              {today}
            </span>
            <ThemeToggle variant="ghost" />
            <ActivityMenu base={base} alerts={alerts} />
            <SignOutButton />
          </div>
        </header>

        <div className="min-w-0 flex-1 px-3 pb-10 sm:px-4 lg:px-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
