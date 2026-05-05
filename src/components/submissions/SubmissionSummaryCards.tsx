"use client";

import React from "react";

// 요약 통계를 위한 데이터 타입 정의 (추후 API 연동을 대비)
export type SubmissionSummary = {
  totalSubmissions: number;
  acceptedSubmissions: number;
  submissionAccuracyRate: number; // 퍼센트 값
};

type Props = {
  summary: SubmissionSummary;
};

// 숫자를 천 단위 콤마 형식으로 변환해주는 유틸 함수
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

export default function SubmissionSummaryCards({ summary }: Props) {
  return (
    // 카드를 가로로 나열하며 간격을 줍니다.
    <div className="flex gap-4">
      {/* 1. 총 제출 카드 */}
      <div className="flex flex-col items-start justify-center px-6 py-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm min-w-[140px]">
        {/* 라벨 텍스트: 작고 회색으로 처리하여 보조 역할임을 강조 */}
        <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">총 제출</span>
        {/* 수치 텍스트: 크고 명확하게 표시, 천 단위 콤마 적용 */}
        <span className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
          {formatNumber(summary.totalSubmissions)}
        </span>
      </div>

      {/* 2. 정답률 카드 */}
      <div className="flex flex-col items-start justify-center px-6 py-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm min-w-[140px]">
        {/* 라벨 텍스트: 작고 회색으로 처리 */}
        <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">정답률</span>
        {/* 정답률 텍스트: 값에 강조를 주기 위해 초록색(text-emerald-600)을 적용 */}
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {summary.submissionAccuracyRate.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
