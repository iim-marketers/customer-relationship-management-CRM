import { KanbanSquareIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <KanbanSquareIcon className="size-4.5" />
      </span>
      CRM
    </Link>
  );
}
