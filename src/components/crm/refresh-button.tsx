"use client";

import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" onClick={() => start(() => router.refresh())} disabled={pending}>
      <RefreshCwIcon className={cn(pending && "animate-spin")} /> Refresh
    </Button>
  );
}
