"use client";

import { CheckCircle2, CircleMinus, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function normalizeResult(result: string | null | undefined) {
  return (result ?? "").trim().toUpperCase();
}

export function isAcceptedResult(result: string | null | undefined) {
  const acceptedResults = new Set(["AC", "ACCEPTED"]);
  return acceptedResults.has(normalizeResult(result));
}

export function DifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  if (!difficulty) return null;

  const map: Record<string, string> = {
    Basic:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    BASIC:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    Easy:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    EASY:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    Medium:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    MEDIUM:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    Hard:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    HARD:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    MEDIUM_HARD:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
    "Medium Hard":
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
    "Medium-Hard":
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  };

  const labelMap: Record<string, string> = {
    BASIC: "Basic",
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
    MEDIUM_HARD: "Medium-Hard",
  };

  return (
    <Badge
      variant="outline"
      className={
        map[difficulty] ??
        "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      }
    >
      {labelMap[difficulty] ?? difficulty}
    </Badge>
  );
}

export function StatusIcon({ result }: { result: string | null }) {
  const normalizedResult = normalizeResult(result);

  if (isAcceptedResult(normalizedResult)) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }

  if (normalizedResult === "PENDING" || normalizedResult === "JUDGING") {
    return <Clock className="h-4 w-4 animate-spin text-blue-400" />;
  }

  if (normalizedResult === "WA" || normalizedResult === "WRONG_ANSWER") {
    return <XCircle className="h-4 w-4 text-red-400" />;
  }

  return <CircleMinus className="h-4 w-4 text-gray-400" />;
}

export function StatusLabel({ result }: { result: string | null }) {
  const normalizedResult = normalizeResult(result);

  const map: Record<string, { label: string; cls: string }> = {
    AC: {
      label: "정답",
      cls: "text-emerald-600 dark:text-emerald-400 font-semibold",
    },
    ACCEPTED: {
      label: "정답",
      cls: "text-emerald-600 dark:text-emerald-400 font-semibold",
    },
    WA: { label: "오답", cls: "text-red-500 dark:text-red-400" },
    WRONG_ANSWER: { label: "오답", cls: "text-red-500 dark:text-red-400" },
    TLE: { label: "시간 초과", cls: "text-orange-500 dark:text-orange-400" },
    TIME_LIMIT_EXCEEDED: {
      label: "시간 초과",
      cls: "text-orange-500 dark:text-orange-400",
    },
    MLE: {
      label: "메모리 초과",
      cls: "text-purple-500 dark:text-purple-400",
    },
    MEMORY_LIMIT_EXCEEDED: {
      label: "메모리 초과",
      cls: "text-purple-500 dark:text-purple-400",
    },
    RE: { label: "런타임 오류", cls: "text-rose-500 dark:text-rose-400" },
    RUNTIME_ERROR: {
      label: "런타임 오류",
      cls: "text-rose-500 dark:text-rose-400",
    },
    CE: { label: "컴파일 오류", cls: "text-yellow-600 dark:text-yellow-500" },
    COMPILE_ERROR: {
      label: "컴파일 오류",
      cls: "text-yellow-600 dark:text-yellow-500",
    },
    PENDING: { label: "채점 중", cls: "text-blue-500 dark:text-blue-400" },
    JUDGING: { label: "채점 중", cls: "text-blue-500 dark:text-blue-400" },
  };

  const { label, cls } = map[normalizedResult] ?? {
    label: normalizedResult || "결과 없음",
    cls: "text-zinc-500 dark:text-zinc-400",
  };

  return <span className={`text-xs ${cls}`}>{label}</span>;
}
