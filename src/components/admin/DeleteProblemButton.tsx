"use client";

import { useFormStatus } from "react-dom";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteButtonProps {
  disabled?: boolean;
  title?: string;
}

/**
 * 문제 삭제 버튼 컴포넌트.
 * useFormStatus를 사용해 Server Action 실행 중에는 스피너를 표시하고
 * 중복 클릭을 자동으로 방지한다.
 */
export function DeleteProblemButton({ disabled, title }: DeleteButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors ${
        isDisabled
          ? "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
          : "text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
      }`}
      title={title}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
