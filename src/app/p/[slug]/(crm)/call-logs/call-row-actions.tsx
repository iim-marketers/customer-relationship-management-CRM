"use client";

import { Trash2Icon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createLeadFromCall, deleteCallLog } from "@/app/p/[slug]/(crm)/actions";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function CallRowActions({ slug, callId, hasLead, canDelete }: { slug: string; callId: string; hasLead: boolean; canDelete: boolean }) {
  const router = useRouter();
  const { pending, run } = useAction();

  return (
    <div className="flex items-center justify-end gap-1">
      {!hasLead && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pending}
              aria-label="Create lead from call"
              onClick={() =>
                run(
                  () => createLeadFromCall(slug, callId),
                  (r) => r.data?.id && router.push(`/p/${slug}/leads/${r.data.id}`),
                )
              }
            >
              <UserPlusIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create lead</TooltipContent>
        </Tooltip>
      )}
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Delete call log" className="text-muted-foreground hover:text-destructive">
              <Trash2Icon />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this call log?</AlertDialogTitle>
              <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => run(() => deleteCallLog(slug, callId))}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
