"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteContact } from "@/app/p/[slug]/(crm)/actions";
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

export function DeleteContactButton({ slug, contactId, name }: { slug: string; contactId: string; name: string }) {
  const router = useRouter();
  const { pending, run } = useAction();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={pending}>
          <Trash2Icon /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Their appointments and calls are kept but unlinked. Leads that converted into this record stay in the pipeline.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => run(() => deleteContact(slug, contactId), () => router.push(`/p/${slug}/contacts`))}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
