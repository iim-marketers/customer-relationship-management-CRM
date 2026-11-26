import {
  BarChart3Icon,
  CalendarCheckIcon,
  KanbanSquareIcon,
  ListTodoIcon,
  PhoneCallIcon,
  RepeatIcon,
  UsersIcon,
  WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: KanbanSquareIcon, title: "Lead pipeline", body: "Kanban and list views with drag-and-drop stages you define." },
  { icon: ListTodoIcon, title: "Follow-up to-dos", body: "A daily queue of due and overdue follow-ups for every agent." },
  { icon: CalendarCheckIcon, title: "Appointments", body: "Book, confirm, reschedule and track no-shows by branch." },
  { icon: RepeatIcon, title: "Repeat enquiries", body: "The same phone number never creates a duplicate lead." },
  { icon: PhoneCallIcon, title: "Call logs", body: "Every call with duration, agent and recording, linked to leads." },
  { icon: BarChart3Icon, title: "Reports", body: "Conversion funnel, source ROI, service mix and team performance." },
  { icon: UsersIcon, title: "Team & branches", body: "Owner, admin, manager and agent roles, per project." },
  { icon: WebhookIcon, title: "Lead webhook", body: "Pipe in leads from your site, Meta or Google Ads with one API key." },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-6">
        <BrandMark />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Create project</Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col items-center py-16 text-center sm:py-24">
        <span className="mb-5 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          One login · every client&apos;s CRM
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Run the CRM for <span className="text-primary">every project</span> from one place.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
          Spin up a separate, fully isolated CRM for each business in under a minute — with its own pipeline, team,
          branches and branded login page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="h-11 px-6 text-base" asChild>
            <Link href="/signup">Create your first project</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-11 px-6 text-base" asChild>
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card/70 p-5">
            <f.icon className="mb-3 size-5 text-primary" />
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
