"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserCircle2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AuthState = {
  user: User | null;
  userRole: string;
  isDeleted: boolean;
  isLoading: boolean;
};

export function AuthNav() {
  const router = useRouter();

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userRole: "USER",
    isDeleted: false,
    isLoading: true,
  });

  useEffect(() => {
    let ignore = false;
    const supabase = createClient();

    const setSignedOutState = () => {
      setAuthState({
        user: null,
        userRole: "USER",
        isDeleted: false,
        isLoading: false,
      });
    };

    async function loadAuthState() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (ignore) return;

      if (userError || !user) {
        setSignedOutState();
        return;
      }

      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("role, is_deleted")
        .eq("id", user.id)
        .maybeSingle();

      if (ignore) return;

      // auth.users에는 있는데 public.users row가 없는 비정상 상태
      if (userDataError || !userData) {
        await supabase.auth.signOut();

        if (!ignore) {
          setSignedOutState();
          router.refresh();
        }

        return;
      }

      // is_deleted === true여도 여기서 자동 로그아웃하지 않음
      setAuthState({
        user,
        userRole: typeof userData.role === "string" ? userData.role : "USER",
        isDeleted: Boolean(userData.is_deleted),
        isLoading: false,
      });
    }

    loadAuthState().catch(() => {
      if (!ignore) {
        setSignedOutState();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (ignore) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setSignedOutState();
        router.refresh();
      }
    });

    const handleSignedOut = () => {
      if (ignore) return;

      setSignedOutState();
      router.refresh();
    };

    const handleProfileUpdated = () => {
      if (ignore) return;

      loadAuthState().then(() => {
        router.refresh();
      });
    };

    window.addEventListener("auth:signed-out", handleSignedOut);
    window.addEventListener("auth:profile-updated", handleProfileUpdated);

    return () => {
      ignore = true;
      subscription.unsubscribe();
      window.removeEventListener("auth:signed-out", handleSignedOut);
      window.removeEventListener("auth:profile-updated", handleProfileUpdated);
    };
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();

    await supabase.auth.signOut();

    setAuthState({
      user: null,
      userRole: "USER",
      isDeleted: false,
      isLoading: false,
    });

    window.dispatchEvent(new Event("auth:signed-out"));

    router.replace("/");
    router.refresh();
  }

  const { user, userRole, isDeleted, isLoading } = authState;

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

  if (isDeleted) {
    return (
      <div className="flex w-full flex-col items-stretch gap-2 sm:gap-3 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
        <Link
          href="/account/restore"
          prefetch={false}
          className={buttonVariants({
            size: "sm",
            className: "w-full justify-center rounded-full lg:w-auto",
          })}
        >
          계정 복구
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-center rounded-full lg:w-auto"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:gap-3 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
      {userRole === "ADMIN" && (
        <Link
          href="/admin"
          prefetch={false}
          className={buttonVariants({
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
          "inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full bg-background px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-accent hover:text-accent-foreground lg:w-auto lg:justify-start",
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

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="w-full justify-center rounded-full lg:w-auto"
      >
        <LogOut className="h-4 w-4" />
        로그아웃
      </Button>
    </div>
  );
}