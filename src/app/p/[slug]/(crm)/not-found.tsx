"use client";

import { SearchXIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CrmNotFound() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <SearchXIcon className="size-6" />
      </span>
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This record doesn&apos;t exist, was deleted, or you don&apos;t have access to it.
      </p>
      <Button asChild className="mt-6">
        <Link href={`/p/${slug}/dashboard`}>Back to dashboard</Link>
      </Button>
    </div>
  );
}
