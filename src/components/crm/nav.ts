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

export function navItems(contactLabel: string) {
  return [
    { href: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { href: "todo", label: "To-Do", icon: ListTodoIcon },
    { href: "leads", label: "Leads", icon: ClipboardListIcon },
    { href: "appointments", label: "Appointments", icon: CalendarCheckIcon },
    { href: "contacts", label: contactLabel, icon: UsersIcon },
    { href: "call-logs", label: "Call Logs", icon: PhoneCallIcon },
    { href: "reports", label: "Reports", icon: BarChart3Icon },
    { href: "settings", label: "Settings", icon: SettingsIcon },
  ] as const;
}
