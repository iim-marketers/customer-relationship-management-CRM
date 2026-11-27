"use client";

import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/submit-button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

async function signOutAndGoHome() {
  await signOut();
  window.location.replace("/");
}

export function SignOutForm({ children }: { children: React.ReactNode }) {
  return <form action={signOutAndGoHome}>{children}</form>;
}

export function SignOutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <LogOutIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need to sign in again to access your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <SignOutForm>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <SubmitButton variant="destructive">Sign out</SubmitButton>
          </AlertDialogFooter>
        </SignOutForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SignOutButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        title="Sign out"
        onClick={() => setOpen(true)}
      >
        <LogOutIcon />
      </Button>
      <SignOutDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
