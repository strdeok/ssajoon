"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { AuthNav } from "@/components/layout/AuthNav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/problems", label: "문제" },
  { href: "/submissions", label: "제출 기록" },
  { href: "/search", label: "문제 찾기" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur dark:border-white/5 dark:bg-[#09090b]/95">
      <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-12 md:py-4 lg:max-w-360 lg:px-24">
        <Link
          href="/"
          prefetch={false}
          className="min-w-0 shrink text-lg font-bold tracking-tight sm:text-xl"
        >
          <span className="block truncate bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SSAJOON
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`${pathname.includes(item.href) ? "text-blue-800 dark:text-blue-400" : "text-zinc-600  hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"} rounded-full px-4 py-2 text-sm font-medium transition-colors`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <ThemeSwitcher />
          <Separator orientation="vertical" className="h-8" />
          <AuthNav />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
          <ThemeSwitcher />
          <Button
            type="button"
            size="icon"
            className="rounded-full"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "w-full overflow-hidden border-t border-zinc-200 transition-[max-height,opacity] duration-200 dark:border-white/5 lg:hidden",
          mobileOpen ? "max-h-112 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Separator />
          <div className="w-full">
            <AuthNav />
          </div>
        </div>
      </div>
    </header>
  );
}
