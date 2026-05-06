"use client";

import { Activity, CheckCircle2, Clock, Hash, Loader2, XCircle } from "lucide-react";
import { useSubmissionStore } from "@/store/submissionStore";
import { Problem } from "@/types/problem";

import { SubmissionStatus } from "@/types/submission";

export type JudgeProgressPayload = {
  submissionId: string | number;
  phase: SubmissionStatus;
  completedTestcases: number;
  totalTestcases: number;
  progressPercent: number;
  result: SubmissionStatus | null;
};

interface ResultViewerProps {
  problem?: Problem | null;
  progress?: JudgeProgressPayload | null;
  submitError?: string | null;
}

const RESULT_LABELS: Record<string, { text: string; className: string; type: "success" | "fail" | "pending" }> = {
  AC: { text: "맞았습니다!!", className: "text-emerald-600 dark:text-emerald-400", type: "success" },
  ACCEPTED: { text: "맞았습니다!!", className: "text-emerald-600 dark:text-emerald-400", type: "success" },
  WA: { text: "틀렸습니다", className: "text-red-600 dark:text-red-400", type: "fail" },
  WRONG_ANSWER: { text: "틀렸습니다", className: "text-red-600 dark:text-red-400", type: "fail" },
  TLE: { text: "시간 초과", className: "text-orange-600 dark:text-orange-400", type: "fail" },
  TIME_LIMIT_EXCEEDED: { text: "시간 초과", className: "text-orange-600 dark:text-orange-400", type: "fail" },
  MLE: { text: "메모리 초과", className: "text-purple-600 dark:text-purple-400", type: "fail" },
  MEMORY_LIMIT_EXCEEDED: { text: "메모리 초과", className: "text-purple-600 dark:text-purple-400", type: "fail" },
  RE: { text: "런타임 에러", className: "text-rose-600 dark:text-rose-400", type: "fail" },
  RUNTIME_ERROR: { text: "런타임 에러", className: "text-rose-600 dark:text-rose-400", type: "fail" },
  CE: { text: "컴파일 에러", className: "text-yellow-600 dark:text-yellow-400", type: "fail" },
  COMPILE_ERROR: { text: "컴파일 에러", className: "text-yellow-600 dark:text-yellow-400", type: "fail" },
  PENDING: { text: "채점 대기 중", className: "text-blue-600 dark:text-blue-400", type: "pending" },
  QUEUED: { text: "채점 대기 중", className: "text-blue-600 dark:text-blue-400", type: "pending" },
  RUNNING: { text: "채점 중", className: "text-blue-600 dark:text-blue-400", type: "pending" },
};

function normalizeValue(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function clampPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function getResultInfo(resultCode: string, fallbackStatus: string) {
  const resultInfo = RESULT_LABELS[resultCode];
  if (resultInfo) return resultInfo;

  const statusInfo = RESULT_LABELS[fallbackStatus];
  if (statusInfo) return statusInfo;

  return { text: resultCode || fallbackStatus || "채점 상태 확인 중", className: "text-zinc-600 dark:text-zinc-300", type: "pending" as const };
}

export function ResultViewer({ problem, progress = null, submitError = null }: ResultViewerProps) {
  const { status, submissionId, result } = useSubmissionStore();

  const progressPhase = normalizeValue(progress?.phase);
  const progressResult = normalizeValue(progress?.result);
  const storeStatus = normalizeValue(status);
  const storeResult = normalizeValue(result?.result);

  const effectiveSubmissionId = submissionId ?? progress?.submissionId ?? null;
  const isSseActive = progressPhase && progressPhase !== "DONE" && !progressResult;
  const effectiveStatus = isSseActive ? progressPhase : (storeStatus || progressPhase || "PENDING");
  const effectiveResult = progressResult || storeResult || (RESULT_LABELS[effectiveStatus]?.type !== "pending" ? effectiveStatus : "");

  const isRunning = effectiveStatus === "RUNNING" || effectiveStatus === "PENDING" || effectiveStatus === "QUEUED" || isSseActive;
  const isDone = (effectiveStatus === "DONE" || Boolean(effectiveResult)) && !isSseActive;
  const resultInfo = getResultInfo(effectiveResult, isRunning ? "RUNNING" : effectiveStatus);

  const completedTestcases = Math.max(0, progress?.completedTestcases ?? 0);
  const totalTestcases = Math.max(0, progress?.totalTestcases ?? 0);
  const progressPercent = clampPercent(progress?.progressPercent);

  if (!progress && !status && !submissionId && !submitError) return null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-white/10 dark:bg-zinc-900/70">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isRunning && !isDone ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          ) : resultInfo.type === "success" ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          ) : resultInfo.type === "fail" ? (
            <XCircle className="h-6 w-6 text-red-500" />
          ) : (
            <Clock className="h-6 w-6 text-blue-500" />
          )}

          <div>
            <p className={`text-lg font-bold ${resultInfo.className}`}>
              {isRunning && !isDone ? "채점 중" : resultInfo.text}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {problem?.title ? `${problem.title} 채점 결과` : "실시간 채점 상태"}
            </p>
          </div>
        </div>

        {effectiveSubmissionId && (
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Hash className="h-3.5 w-3.5" />
            {effectiveSubmissionId}
          </div>
        )}
      </div>

      {progress && (
        <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="flex items-center justify-between text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2 font-semibold">
              <Activity className="h-4 w-4" />
              <span>{progress.phase === "DONE" ? "채점 완료" : "테스트케이스 채점 중"}</span>
            </div>
            <span className="font-mono font-bold">{progressPercent}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
            <div className="h-full rounded-full bg-blue-600 " style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="flex items-center justify-between text-xs text-blue-700/80 dark:text-blue-300/80">
            <span>완료된 테스트케이스</span>
            <span className="font-mono font-semibold">{completedTestcases} / {totalTestcases}</span>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {submitError}
        </div>
      )}

      {(result?.execution_time_ms !== undefined || result?.memory_kb !== undefined) && (
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
          {result?.execution_time_ms !== undefined && (
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-black/30">
              실행 시간: <strong>{result.execution_time_ms}</strong> ms
            </div>
          )}

          {result?.memory_kb !== undefined && (
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-black/30">
              메모리: <strong>{(result.memory_kb / 1024).toFixed(2)}</strong> MB
            </div>
          )}
        </div>
      )}
    </section>
  );
}