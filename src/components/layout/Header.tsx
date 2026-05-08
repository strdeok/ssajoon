import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { AuthNav } from "@/components/layout/AuthNav";
import { Search } from "lucide-react";

import { createClient } from "@/utils/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = "USER";
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (userData) {
      userRole = userData.role;
    }
  }

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#09090b] flex items-center justify-center shadow-sm sticky top-0 z-50 px-24">
      <div className="w-full max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent shrink-0">
            <Link href="/">SSAJOON</Link>
          </h1>

          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/problems"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              문제
            </Link>
            <Link
              href="/submissions"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              제출 기록
            </Link>
            <Link
              href="/generate"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              문제 생성
            </Link>
          </nav>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <form action="/problems" method="GET" className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              name="q"
              placeholder="문제 번호 또는 제목 검색..."
              className="block w-full pl-10 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </form>
        </div>


        <div className="flex items-center space-x-4 shrink-0">
          <ThemeSwitcher />
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
