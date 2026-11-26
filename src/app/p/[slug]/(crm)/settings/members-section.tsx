"use client";

import { PencilIcon, PlusIcon, UserMinusIcon } from "lucide-react";
import { useState } from "react";
import { SelectField, TextField, toOptions } from "@/components/crm/fields";
import { onSubmitForm, useAction } from "@/components/crm/use-action";
import { SubmitButton } from "@/components/submit-button";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS, type Branch, type MemberRole } from "@/lib/types";
import { addMember, removeMember, setMemberActive, updateMember } from "./actions";

export type MemberRow = {
  user_id: string;
  name: string;
  email: string | null;
  role: MemberRole;
  branch_id: string | null;
  is_active: boolean;
};

const ROLE_HELP: Record<MemberRole, string> = {
  owner: "Full control, including deleting the project",
  admin: "Manages settings, team and all data",
  manager: "Works all data and can delete records",
  agent: "Works leads, appointments and calls",
};

function roleOptions(viewerRole: MemberRole, includeOwner: boolean) {
  const roles: MemberRole[] = viewerRole === "owner" && includeOwner ? ["owner", "admin", "manager", "agent"] : ["admin", "manager", "agent"];
  return roles.map((r) => ({ value: r, label: `${ROLE_LABELS[r]} — ${ROLE_HELP[r]}` }));
}

function AddMemberDialog({ slug, branches }: { slug: string; branches: Branch[] }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> New user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>
            Creates a login for them. If the email already has an account, they&apos;re simply added to this project (password is ignored).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmitForm((fd) => run(() => addMember(slug, fd), () => setOpen(false)))} className="grid gap-4 sm:grid-cols-2">
          <TextField label="Full name" name="full_name" placeholder="e.g. Jayanagar Branch" className="sm:col-span-2" />
          <TextField label="Email" name="email" type="email" required autoComplete="off" />
          <TextField label="Password" name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Min 8 characters" />
          <SelectField label="Role" name="role" options={roleOptions("admin", false)} defaultValue="agent" className="sm:col-span-2" />
          <SelectField label="Branch" name="branch_id" noneLabel="All branches" options={toOptions(branches)} className="sm:col-span-2" />
          <SubmitButton pending={pending} className="sm:col-span-2">
            Add member
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMemberDialog({ slug, member, branches, viewerRole, isSelf }: { slug: string; member: MemberRow; branches: Branch[]; viewerRole: MemberRole; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();
  const lockRole = isSelf || (member.role === "owner" && viewerRole !== "owner");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Edit member">
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {member.name}</DialogTitle>
          <DialogDescription>{member.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmitForm((fd) => run(() => updateMember(slug, member.user_id, fd), () => setOpen(false)))} className="grid gap-4">
          {lockRole ? (
            <>
              <input type="hidden" name="role" value={member.role} />
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                Role: <span className="font-medium">{ROLE_LABELS[member.role]}</span>
                <span className="block text-xs text-muted-foreground">
                  {isSelf ? "You can't change your own role." : "Only owners can change an owner's role."}
                </span>
              </p>
            </>
          ) : (
            <SelectField label="Role" name="role" options={roleOptions(viewerRole, true)} defaultValue={member.role} />
          )}
          <SelectField label="Branch" name="branch_id" noneLabel="All branches" options={toOptions(branches, member.branch_id)} defaultValue={member.branch_id} />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MembersSection({
  slug,
  members,
  branches,
  isAdmin,
  viewerRole,
  currentUserId,
}: {
  slug: string;
  members: MemberRow[];
  branches: Branch[];
  isAdmin: boolean;
  viewerRole: MemberRole;
  currentUserId: string;
}) {
  const { pending, run } = useAction();
  const branchName = (id: string | null) => (id ? (branches.find((b) => b.id === id)?.name ?? "—") : "All branches");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <p>Create CRM users and control Owner, Admin, Manager and Agent access.</p>
          <p className="mt-1 text-xs">Protected rule: at least one active owner must always remain.</p>
        </div>
        {isAdmin && <AddMemberDialog slug={slug} branches={branches} />}
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Active</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const isSelf = m.user_id === currentUserId;
              const ownerLocked = m.role === "owner" && viewerRole !== "owner";
              return (
                <TableRow key={m.user_id} className={isSelf ? "bg-primary/5" : undefined}>
                  <TableCell className="font-medium">
                    {m.name}
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === "owner" || m.role === "admin" ? "default" : "secondary"}>{ROLE_LABELS[m.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{branchName(m.branch_id)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={m.is_active}
                      disabled={!isAdmin || isSelf || ownerLocked || pending}
                      onCheckedChange={(v) => run(() => setMemberActive(slug, m.user_id, v))}
                      aria-label="Active"
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <EditMemberDialog slug={slug} member={m} branches={branches} viewerRole={viewerRole} isSelf={isSelf} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon-sm" aria-label="Remove member" disabled={isSelf || ownerLocked}>
                              <UserMinusIcon />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {m.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They lose access to this project. Their login and other projects are unaffected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => run(() => removeMember(slug, m.user_id))}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
