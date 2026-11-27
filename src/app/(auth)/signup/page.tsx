import type { Metadata } from "next";
import { KanbanSquareIcon } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { FEATURES, featureTile } from "@/components/site/features";
import { scriptFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create a project" };

const HIGHLIGHTS = FEATURES.filter((f) =>
  ["pipeline", "follow-ups", "appointments", "reports"].includes(f.id),
);

export default function SignupPage() {
  return (
    <main className="grid min-h-svh grid-cols-1 lg:h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:overflow-hidden">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#150f1d] p-10 text-white lg:flex xl:p-12 short:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgb(113_75_103/0.85),transparent_70%),radial-gradient(ellipse_70%_50%_at_100%_100%,rgb(1_126_132/0.4),transparent_70%),linear-gradient(160deg,#2b1a2c,#150f1d_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] bg-[size:22px_22px]"
        />
        <Link
          href="/"
          className="relative inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <KanbanSquareIcon className="size-4.5" />
          </span>
          CRM
        </Link>

        <div className="relative max-w-md">
          <h1
            className={cn(
              scriptFont.className,
              "text-6xl leading-[0.95] xl:text-7xl short:text-5xl xl:short:text-6xl",
            )}
          >
            Start a new CRM{" "}
            <span className="block text-[#f2645e]">in a minute</span>
          </h1>
          <p className="mt-5 text-lg text-white/70 short:mt-3 short:text-base">
            Your pipeline, lead sources and first branch are set up for you.
            Invite your team when you&apos;re ready.
          </p>
          <ul className="mt-6 space-y-5 short:mt-6 short:space-y-3">
            {HIGHLIGHTS.map(({ id, icon: Icon, color, title }) => (
              <li key={id} className="flex items-center gap-4">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-lg shadow-lg ring-1 shadow-black/30 ring-white/15 short:size-8"
                  style={featureTile(color)}
                >
                  <Icon className="size-5 short:size-4" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden className="h-8" />
      </aside>

      <section className="flex items-center justify-center px-4 pb-8 sm:px-8 sm:pt-8 lg:overflow-y-auto lg:py-6">
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <BrandMark className="text-2xl lg:hidden" />
              <h2 className="text-2xl font-bold tracking-tight">
                Create your account
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ll land in your new dashboard right after.
            </p>
          </div>
          <SignupForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
