"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { SelectField, TextField } from "@/components/crm/fields";
import { ProjectLogo } from "@/components/crm/project-logo";
import { onSubmitForm, useAction } from "@/components/crm/use-action";
import { SubmitButton } from "@/components/submit-button";
import {
  AlertDialog,
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
import { INDUSTRIES } from "@/lib/industries";
import type { Project } from "@/lib/types";
import { deleteProject, updateProjectProfile } from "./actions";
import { CopyButton } from "./copy-button";
import { TIMEZONES } from "./master-config";

export function ProfileSection({ project, isAdmin, isOwner }: { project: Project; isAdmin: boolean; isOwner: boolean }) {
  const { pending, run } = useAction();
  const [logo, setLogo] = useState(project.logo_url ?? "");
  const [name, setName] = useState(project.name);
  const loginPath = `/p/${project.slug}/login`;
  const zones = TIMEZONES.includes(project.timezone) ? TIMEZONES : [project.timezone, ...TIMEZONES];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/30 p-4">
        <ProjectLogo project={{ name: name || project.name, logo_url: logo || null }} className="size-14" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Team login page</div>
          <div className="truncate font-mono text-sm">{loginPath}</div>
          <p className="text-xs text-muted-foreground">Share this with your team — it shows your logo and only lets project members in.</p>
        </div>
        <CopyButton value={loginPath} label="Copy link" />
      </div>

      <form onSubmit={onSubmitForm((fd) => run(() => updateProjectProfile(project.slug, fd)))} className="grid gap-4 sm:grid-cols-2">
        <fieldset disabled={!isAdmin} className="contents">
          <TextField label="Project name" name="name" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="Contacts are called"
            name="contact_label"
            required
            defaultValue={project.contact_label}
            placeholder="Customers, Patients, Clients…"
          />
          <SelectField
            label="Industry"
            name="industry"
            noneLabel="Not set"
            options={INDUSTRIES.map((i) => ({ value: i.value, label: i.label }))}
            defaultValue={project.industry}
          />
          <SelectField label="Timezone" name="timezone" options={zones.map((z) => ({ value: z, label: z.replace("_", " ") }))} defaultValue={project.timezone} />
          <TextField label="Logo URL" name="logo_url" type="url" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…/logo.png" />
          {isAdmin && (
            <SubmitButton pending={pending} className="sm:col-span-2 sm:justify-self-start">
              Save changes
            </SubmitButton>
          )}
        </fieldset>
      </form>

      {isOwner && <DangerZone slug={project.slug} />}
    </div>
  );
}

function DangerZone({ slug }: { slug: string }) {
  const [confirm, setConfirm] = useState("");
  const { pending, run } = useAction();
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-destructive">
            <TriangleAlertIcon className="size-4" /> Delete project
          </h3>
          <p className="text-sm text-muted-foreground">Permanently deletes every lead, appointment, call and setting in this project, and every team login for it.</p>
        </div>
        <AlertDialog onOpenChange={() => setConfirm("")}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete project</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this project for everyone?</AlertDialogTitle>
              <AlertDialogDescription>
                Your login and every team member&apos;s login are deleted too, so the emails can be used to sign up again. This can&apos;t be undone. Type <span className="font-mono font-semibold text-foreground">{slug}</span> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={slug} autoComplete="off" className="font-mono" />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="destructive" disabled={confirm !== slug || pending} onClick={() => run(() => deleteProject(slug, confirm))}>
                Delete forever
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
