"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signout } from "@/app/login/actions";
import { LogOut, Settings, UserCircle2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    return <Skeleton className="h-10 w-full max-w-40 rounded-full" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        prefetch={false}
        className={buttonVariants({
          variant: "default",
          size: "sm",
          className: "w-full justify-center rounded-full px-5 lg:w-auto",
        })}
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:gap-3 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
      {userRole === "ADMIN" && (
        <Link
          href="/admin"
          prefetch={false}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "w-full justify-center rounded-full lg:w-auto",
          })}
        >
          <Settings className="h-4 w-4" />
          관리자
        </Link>
      )}

      <Link
        href="/mypage"
        prefetch={false}
        className={cn(
          "inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:w-auto lg:justify-start",
        )}
      >
        <UserCircle2 className="h-4 w-4 shrink-0" />
        <span
          className="max-w-45 truncate sm:max-w-40"
          title={user.user_metadata?.nickname || user.email}
        >
          {user.user_metadata?.nickname || user.email}
        </span>
      </Link>

      <form action={signout} className="w-full lg:w-auto">
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="w-full justify-center rounded-full lg:w-auto"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </form>
    </div>
  );
}
