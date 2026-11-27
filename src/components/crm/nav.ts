import {
  BarChart3Icon,
  CalendarCheckIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  PhoneCallIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

export const NAV_GROUPS = ["Overview", "Sales", "Insights"] as const;

export function navItems(contactLabel: string) {
  return [
    { href: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon, group: "Overview" },
    { href: "todo", label: "To-Do", icon: ListTodoIcon, group: "Overview" },
    { href: "leads", label: "Leads", icon: ClipboardListIcon, group: "Sales" },
    { href: "appointments", label: "Appointments", icon: CalendarCheckIcon, group: "Sales" },
    { href: "contacts", label: contactLabel, icon: UsersIcon, group: "Sales" },
    { href: "call-logs", label: "Call Logs", icon: PhoneCallIcon, group: "Sales" },
    { href: "reports", label: "Reports", icon: BarChart3Icon, group: "Insights" },
    { href: "settings", label: "Settings", icon: SettingsIcon, group: "Insights" },
  ] as const;
}
