"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signout } from "@/app/login/actions";
import { LogOut, UserCircle, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

type AuthState = {
  user: User | null;
  userRole: string;
  isLoading: boolean;
};

export function AuthNav() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userRole: "USER",
    isLoading: true,
  });

  useEffect(() => {
    let ignore = false;

    async function loadAuthState() {
      const supabase = createClient();
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

        if (typeof userData?.role === "string") {
          userRole = userData.role;
        }
      }

      if (!ignore) {
        setAuthState({ user, userRole, isLoading: false });
      }
    }

    loadAuthState().catch(() => {
      if (!ignore) {
        setAuthState({ user: null, userRole: "USER", isLoading: false });
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const { user, userRole, isLoading } = authState;

  if (isLoading) {
    return (
      <div className="flex h-9 w-65 justify-end">
        <div className="h-9 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-9 w-65 justify-end">
        <Link
          href="/login"
          prefetch={false}
          className="flex h-9 items-center px-4 text-sm font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-9 w-full items-center justify-end space-x-4 overflow-hidden">
      {userRole === "ADMIN" && (
        <Link
          href="/admin"
          prefetch={false}
          className="flex h-8 shrink-0 items-center space-x-1.5 px-3 text-xs font-bold bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-md hover:bg-zinc-700 dark:hover:bg-white transition-colors cursor-pointer shadow-sm"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>관리자 페이지</span>
        </Link>
      )}

      <Link
        href="/mypage"
        prefetch={false}
        className="flex h-9 min-w-0 items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
      >
        <UserCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span
          className="max-w-30  truncate underline-offset-4 group-hover:underline"
          title={user.user_metadata?.nickname || user.email}
        >
          {user.user_metadata?.nickname || user.email}
        </span>
      </Link>
      <form action={signout}>
        <button
          type="submit"
          className="flex h-9 shrink-0 items-center space-x-2 px-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </form>
    </div>
  );
}
