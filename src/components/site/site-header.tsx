"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("text-[28px] leading-none font-semibold tracking-tight text-[#8f8f8f] dark:text-[#b4b4bb]", className)}
      aria-label="CRM home"
    >
      <span className="text-[#714b67] dark:text-[#c79bbd]">C</span>RM
    </Link>
  );
}

function useScrollHeader(revealOffset = 64, jitter = 6) {
  const [state, setState] = useState({ atTop: true, hidden: false });
  const lastY = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY.current;
      if (Math.abs(delta) < jitter && y > 0) return;
      lastY.current = y;
      const atTop = y <= 4;
      const hidden = !atTop && delta > 0 && y > revealOffset;
      setState((s) => (s.atTop === atTop && s.hidden === hidden ? s : { atTop, hidden }));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [revealOffset, jitter]);

  return state;
}

export function SiteHeader() {
  const { atTop, hidden } = useScrollHeader();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[translate,opacity,background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none",
        atTop
          ? "border-transparent bg-white dark:bg-background"
          : "border-border bg-white/85 shadow-[0_4px_20px_-12px_rgba(17,24,39,0.25)] backdrop-blur dark:bg-background/80",
        hidden && "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3.5 sm:px-6">
        <Wordmark />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="rounded-md px-3 py-2 text-[15px] font-medium text-foreground hover:text-[#714b67] dark:hover:text-primary">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-[#5f3f57] bg-[#714b67] px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm transition hover:bg-[#5f3f57]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
