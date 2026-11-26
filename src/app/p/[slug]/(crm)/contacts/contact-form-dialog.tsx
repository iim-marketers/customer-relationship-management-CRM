"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createContact, updateContact } from "@/app/p/[slug]/(crm)/actions";
import { SelectField, TextAreaField, TextField, toOptions } from "@/components/crm/fields";
import { onSubmitForm, useAction } from "@/components/crm/use-action";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ClientLookups } from "@/lib/project";
import type { Contact } from "@/lib/types";

export function ContactFormDialog({
  slug,
  singular,
  lookups,
  contact,
  trigger,
}: {
  slug: string;
  singular: string;
  lookups: ClientLookups;
  contact?: Contact;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contact ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={onSubmitForm((fd) =>
            run(
              () => (contact ? updateContact(slug, contact.id, fd) : createContact(slug, fd)),
              (r) => {
                setOpen(false);
                const created = r.data as { id: string } | undefined;
                if (!contact && created?.id) router.push(`/p/${slug}/contacts/${created.id}`);
              },
            ),
          )}
          className="grid gap-4 sm:grid-cols-2"
        >
          <TextField label="Name" name="name" required defaultValue={contact?.name} placeholder="Full name" />
          <TextField label="Phone" name="phone" type="tel" defaultValue={contact?.phone ?? ""} placeholder="+91…" />
          <TextField label="Email" name="email" type="email" defaultValue={contact?.email ?? ""} />
          <SelectField label="Branch" name="branch_id" noneLabel="No branch" options={toOptions(lookups.branches, contact?.branch_id)} defaultValue={contact?.branch_id} />
          <SelectField label="Service" name="service_id" noneLabel="Not set" options={toOptions(lookups.services, contact?.service_id)} defaultValue={contact?.service_id} />
          <SelectField label="Source" name="source_id" noneLabel="Not set" options={toOptions(lookups.sources, contact?.source_id)} defaultValue={contact?.source_id} />
          <SelectField
            label="Assigned to"
            name="assigned_to"
            noneLabel="Unassigned"
            options={lookups.members.map((m) => ({ value: m.id, label: m.name }))}
            defaultValue={contact?.assigned_to}
            className="sm:col-span-2"
          />
          <TextAreaField label="Notes" name="notes" defaultValue={contact?.notes ?? ""} rows={3} className="sm:col-span-2" />
          <SubmitButton pending={pending} className="sm:col-span-2">
            {contact ? "Save changes" : `Add ${singular.toLowerCase()}`}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
