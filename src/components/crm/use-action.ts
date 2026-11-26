"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/types";

/** Runs a server action in a transition and toasts its result. */
export function useAction() {
  const [pending, start] = useTransition();
  const run = <T,>(fn: () => Promise<ActionResult<T>>, onOk?: (r: Extract<ActionResult<T>, { ok: true }>) => void) =>
    new Promise<ActionResult<T>>((resolve) => {
      start(async () => {
        const result = await fn();
        if (result.ok) {
          if (result.message) toast.success(result.message);
          onOk?.(result);
        } else {
          toast.error(result.error);
        }
        resolve(result);
      });
    });
  return { pending, run };
}

/** onSubmit handler that collects FormData without React's auto form reset (keeps input on errors). */
export function onSubmitForm(fn: (fd: FormData) => unknown) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fn(new FormData(e.currentTarget));
  };
}
