"use client";

import React from "react";

export type SubmissionSummary = {
  totalSubmissions: number;
  acceptedSubmissions: number;
  submissionAccuracyRate: number;
};

type Props = {
  summary: SubmissionSummary;
};

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

export default function SubmissionSummaryCards({ summary }: Props) {
  return (
    <div className="flex gap-4">
      <div className="flex min-w-35 flex-col items-start justify-center rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">총 제출</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
          {formatNumber(summary.totalSubmissions)}
        </span>
      </div>

      <div className="flex min-w-35 flex-col items-start justify-center rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">정답률</span>
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {summary.submissionAccuracyRate.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
