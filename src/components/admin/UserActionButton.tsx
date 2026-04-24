"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface UserActionButtonProps {
  isDeleted: boolean;
}

/**
 * 관리자 유저 상세 페이지의 계정 복구/강제 탈퇴 버튼.
 * useFormStatus를 통해 Server Action 실행 중 로딩 상태를 표시한다.
 */
export function UserActionButton({ isDeleted }: UserActionButtonProps) {
  const { pending } = useFormStatus();

  if (isDeleted) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? "처리 중..." : "계정 복구하기"}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? "처리 중..." : "강제 탈퇴 처리"}
    </button>
  );
}
