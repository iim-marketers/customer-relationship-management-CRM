import Link from "next/link";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="CRM home" className={cn("inline-flex text-xl", className)}>
      <Logo />
    </Link>
  );
}
