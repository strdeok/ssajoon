"use client";

import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toggleHidden } from "@/app/admin/problems/actions";

interface ToggleHiddenButtonProps {
  id: number;
  isHidden: boolean;
  disabled?: boolean;
}

export function ToggleHiddenButton({ id, isHidden, disabled }: ToggleHiddenButtonProps) {
  return (
    <form action={async () => {
      try {
        await toggleHidden(id, isHidden);
      } catch (error) {
        alert(error instanceof Error ? error.message : "오류가 발생했습니다.");
      }
    }}>
      <SubmitButton isHidden={isHidden} disabled={disabled} />
    </form>
  );
}

function SubmitButton({ isHidden, disabled }: { isHidden: boolean; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`p-2 rounded-lg transition-all ${
        isHidden 
          ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20" 
          : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isHidden ? "보이게 하기" : "숨기기"}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isHidden ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>
  );
}
