"use client";

import { useState } from "react";
import { createCallLog } from "@/app/p/[slug]/(crm)/actions";
import { Field, SelectField, TextField, toOptions } from "@/components/crm/fields";
import { onSubmitForm, useAction } from "@/components/crm/use-action";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ClientLookups } from "@/lib/project";

export function CallLogDialog({
  slug,
  lookups,
  defaultWhen,
  trigger,
}: {
  slug: string;
  lookups: ClientLookups;
  defaultWhen: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Log call</DialogTitle>
          <DialogDescription>Calls are linked automatically to a lead or record with the same phone number.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmitForm((fd) => run(() => createCallLog(slug, fd), () => setOpen(false)))} className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone" name="phone" type="tel" required placeholder="+91…" />
          <TextField label="Contact name" name="contact_name" placeholder="Optional" />
          <SelectField
            label="Type"
            name="direction"
            options={[
              { value: "incoming", label: "Incoming" },
              { value: "outgoing", label: "Outgoing" },
            ]}
            defaultValue="incoming"
          />
          <SelectField
            label="Status"
            name="status"
            options={[
              { value: "answered", label: "Answered" },
              { value: "missed", label: "Missed" },
              { value: "busy", label: "Busy" },
              { value: "failed", label: "Failed" },
            ]}
            defaultValue="answered"
          />
          <Field label="Duration">
            <div className="flex items-center gap-2">
              <Input name="minutes" type="number" min={0} placeholder="0" aria-label="Minutes" />
              <span className="text-sm text-muted-foreground">m</span>
              <Input name="seconds" type="number" min={0} max={59} placeholder="0" aria-label="Seconds" />
              <span className="text-sm text-muted-foreground">s</span>
            </div>
          </Field>
          <TextField label="Called at" name="called_at" type="datetime-local" defaultValue={defaultWhen} />
          <TextField label="Handled by" name="handled_by" placeholder="Agent name or number" />
          <TextField label="Agent status" name="agent_status" placeholder="e.g. Connected, Drop" />
          <SelectField label="Branch" name="branch_id" noneLabel="No branch" options={toOptions(lookups.branches)} />
          <TextField label="Recording URL" name="recording_url" type="url" placeholder="https://…" />
          <SubmitButton pending={pending} className="sm:col-span-2">
            Log call
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
