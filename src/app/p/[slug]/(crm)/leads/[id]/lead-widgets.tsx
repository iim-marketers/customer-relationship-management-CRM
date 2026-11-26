"use client";

import { ArrowRightLeftIcon, CheckIcon, Trash2Icon, UserCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addLeadNote, convertLead, deleteLead, moveLeadStage, setFollowUp } from "@/app/p/[slug]/(crm)/actions";
import { useAction } from "@/components/crm/use-action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StagePills({ slug, leadId, stages, current }: { slug: string; leadId: string; stages: Stage[]; current: string }) {
  const { pending, run } = useAction();
  const [optimistic, setOptimistic] = useState(current);
  return (
    <div className={cn("o-statusbar", pending && "opacity-70")}>
      {stages.map((s) => {
        const active = s.id === optimistic;
        return (
          <button
            key={s.id}
            disabled={pending || active}
            aria-current={active ? "step" : undefined}
            onClick={() => {
              setOptimistic(s.id);
              run(() => moveLeadStage(slug, leadId, s.id)).then((r) => !r.ok && setOptimistic(current));
            }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 py-1.5 text-sm whitespace-nowrap transition-colors",
              active ? "bg-primary font-semibold text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {active && <CheckIcon className="size-3.5" />}
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

export function FollowUpEditor({ slug, leadId, value, presets }: { slug: string; leadId: string; value: string; presets: { label: string; wall: string }[] }) {
  const { pending, run } = useAction();
  const [wall, setWall] = useState(value);
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input type="datetime-local" value={wall} onChange={(e) => setWall(e.target.value)} className="flex-1" />
        <Button disabled={pending || !wall || wall === value} onClick={() => run(() => setFollowUp(slug, leadId, wall))}>
          Save
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setWall(p.wall);
              run(() => setFollowUp(slug, leadId, p.wall));
            }}
          >
            {p.label}
          </Button>
        ))}
        {value && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              setWall("");
              run(() => setFollowUp(slug, leadId, null));
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

export function NoteComposer({ slug, leadId }: { slug: string; leadId: string }) {
  const { pending, run } = useAction();
  const [body, setBody] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addLeadNote(slug, leadId, body), () => setBody(""));
      }}
      className="space-y-2"
    >
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Log an internal note…" className="bg-card" />
      <div className="flex justify-start">
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          Log
        </Button>
      </div>
    </form>
  );
}

export function ConvertButton({ slug, leadId, label }: { slug: string; leadId: string; label: string }) {
  const { pending, run } = useAction();
  const router = useRouter();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        run(
          () => convertLead(slug, leadId),
          (r) => r.data && router.push(`/p/${slug}/contacts/${r.data.contactId}`),
        )
      }
    >
      <UserCheckIcon /> Convert to {label}
    </Button>
  );
}

export function ContactLink({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="outline" asChild>
      <Link href={href}>
        <ArrowRightLeftIcon /> View {label}
      </Link>
    </Button>
  );
}

export function DeleteLeadButton({ slug, leadId, name }: { slug: string; leadId: string; name: string }) {
  const { pending, run } = useAction();
  const router = useRouter();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" aria-label="Delete lead" disabled={pending}>
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>This removes the lead, its tasks and activity history. It can&apos;t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => run(() => deleteLead(slug, leadId), () => router.push(`/p/${slug}/leads`))}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
