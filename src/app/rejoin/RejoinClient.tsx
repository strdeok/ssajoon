"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { keepAccountDeleted, restoreDeletedAccount } from "./actions";

type RejoinClientProps = {
  initialMessage?: string;
};

export function RejoinClient({ initialMessage }: RejoinClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(initialMessage ?? null);

  const handleRestore = () => {
    setMessage(null);

    startTransition(async () => {
      const result = await restoreDeletedAccount();

      if (!result.success) {
        setMessage(result.message ?? "계정 복구 중 오류가 발생했습니다.");
        return;
      }

      window.dispatchEvent(new Event("auth:profile-updated"));

      router.replace("/");
      router.refresh();
    });
  };

  const handleKeepDeleted = () => {
    setMessage(null);

    startTransition(async () => {
      const result = await keepAccountDeleted();

      if (!result.success) {
        setMessage(result.message ?? "로그아웃 중 오류가 발생했습니다.");
        return;
      }

      const supabase = createClient();

      await supabase.auth.signOut();

      window.dispatchEvent(new Event("auth:signed-out"));

      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-1 flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-white/5 dark:bg-zinc-900">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <RotateCcw className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            다시 회원가입하시겠습니까?
          </h1>

          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            이 계정은 이전에 탈퇴 처리되었습니다. <br />
            다시 시작하면 계정과 기존 제출 내역이 복구됩니다.
          </p>
        </div>

        {message && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid gap-3">
          <button
            type="button"
            onClick={handleRestore}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{isPending ? "처리 중..." : "다시 시작하기"}</span>
          </button>

          <button
            type="button"
            onClick={handleKeepDeleted}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 py-3 font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <LogOut className="h-4 w-4" />
            <span>아니오, 로그인하지 않기</span>
          </button>
        </div>
      </div>
    </div>
  );
}