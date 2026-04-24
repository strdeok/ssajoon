"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BookOpen } from "lucide-react";

const navItems = [
  { href: "/admin", label: "대시보드 홈", icon: LayoutDashboard, exact: true },
  { href: "/admin/problems", label: "문제 관리", icon: BookOpen, exact: false },
  { href: "/admin/users", label: "사용자 관리", icon: Users, exact: false },
];

/**
 * 관리자 사이드바 네비게이션.
 * 현재 경로에 맞는 항목을 active 스타일로 강조한다.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900"
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? "text-blue-500" : ""}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
