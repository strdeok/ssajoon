"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Code2,
  Calendar,
} from "lucide-react";
import { formatTimeAgo, formatDateTime } from "@/utils/date";
import { FailedTestcaseModal } from "@/components/submission/FailedTestcaseModal";


interface SubmissionSummaryProps {
  submission: {
    id: string;
    result: string;
    language: string;
    execution_time_ms: number | null;
    memory_kb: number | null;
    submitted_at: string;
    problem_title: string;
    problem_id: string;
    failed_testcase_order: number | null;
  };
}

const getResultInfo = (result: string) => {
  const normalizedResult = result.toUpperCase();
  switch (normalizedResult) {
    case "AC":
    case "ACCEPTED":
      return {
        label: "정답",
        colorClass: "text-emerald-500",
        bgClass: "bg-emerald-500/10",
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
      };
    case "WA":
    case "WRONG_ANSWER":
      return {
        label: "오답",
        colorClass: "text-red-500",
        bgClass: "bg-red-500/10",
        icon: <XCircle className="w-8 h-8 text-red-500" />,
      };
    case "TLE":
      return {
        label: "시간 초과",
        colorClass: "text-amber-500",
        bgClass: "bg-amber-500/10",
        icon: <Clock className="w-8 h-8 text-amber-500" />,
      };
    case "MLE":
      return {
        label: "메모리 초과",
        colorClass: "text-amber-500",
        bgClass: "bg-amber-500/10",
        icon: <Database className="w-8 h-8 text-amber-500" />,
      };
    default:
      return {
        label: result,
        colorClass: "text-zinc-500",
        bgClass: "bg-zinc-500/10",
        icon: <div className="w-8 h-8 rounded-full bg-zinc-500/20" />,
      };
  }
};

export default function SubmissionSummary({
  submission,
}: SubmissionSummaryProps) {
  const { label, colorClass, bgClass, icon } = getResultInfo(submission.result);

  return (
    <>
      <div className="flex justify-end mb-1">{(submission.result === "WA") && submission.failed_testcase_order && (
        <FailedTestcaseModal
          submissionId={submission.id}
          problemId={submission.problem_id}
          failedOrder={submission.failed_testcase_order}
        />
      )}</div>
      <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-xl">
        <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${bgClass} shadow-inner`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-3xl font-black tracking-tight ${colorClass}`}
                >
                  {label}
                </span>
                <span className="text-zinc-400 dark:text-zinc-600 font-mono text-sm">
                  #{submission.id}
                </span>
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                {submission.problem_title}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                시간
              </div>
              <div className="text-md font-bold text-zinc-900 dark:text-white">
                {submission.execution_time_ms !== null
                  ? `${submission.execution_time_ms}ms`
                  : "-"}
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">
                <Database className="w-3 h-3" />
                메모리
              </div>
              <div className="text-md font-bold text-zinc-900 dark:text-white">
                {submission.memory_kb !== null
                  ? `${submission.memory_kb}KB`
                  : "-"}
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">
                <Code2 className="w-3 h-3" />
                언어
              </div>
              <div className="text-md font-bold text-zinc-900 dark:text-white capitalize">
                {submission.language === "cpp" ? "C++" : submission.language}
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
                제출
              </div>
              <div className="text-md font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                {formatTimeAgo(submission.submitted_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-3 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span>제출 시각: {formatDateTime(submission.submitted_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>문제 번호: {submission.problem_id}</span>
          </div>
        </div>



      </div>
    </>

  );
}
