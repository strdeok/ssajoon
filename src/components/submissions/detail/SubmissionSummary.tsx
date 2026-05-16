"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  OctagonX,
  FileX2,
  AlignJustify,
  ServerCrash,
  Code2,
  Calendar
} from "lucide-react";
import { FailedTestcaseModal } from "@/components/submission/FailedTestcaseModal";
import Link from "next/link";


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
  // result가 소문자로 들어와도 비교할 수 있도록 대문자로 변환한다.
  const normalizedResult = result.toUpperCase();

  // 정규화된 결과 코드에 따라 표시 정보를 분기한다.
  switch (normalizedResult) {
    // AC는 정답을 의미한다.
    case "AC":

    // ACCEPTED도 정답으로 처리한다.
    case "ACCEPTED":
      // 정답 UI 정보를 반환한다.
      return {
        // 사용자에게 보여줄 한글 라벨이다.
        label: "정답",

        // 텍스트 색상 클래스다.
        colorClass: "text-emerald-500",

        // 배경 색상 클래스다.
        bgClass: "bg-emerald-500/10",

        // 정답 아이콘이다.
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
      };

    // WA는 오답을 의미한다.
    case "WA":

    // WRONG_ANSWER도 오답으로 처리한다.
    case "WRONG_ANSWER":
      // 오답 UI 정보를 반환한다.
      return {
        // 사용자에게 보여줄 한글 라벨이다.
        label: "오답",

        // 텍스트 색상 클래스다.
        colorClass: "text-red-500",

        // 배경 색상 클래스다.
        bgClass: "bg-red-500/10",

        // 오답 아이콘이다.
        icon: <XCircle className="w-8 h-8 text-red-500" />,
      };

    // TLE는 시간 초과를 의미한다.
    case "TLE":

    // TIME_LIMIT_EXCEEDED도 시간 초과로 처리한다.
    case "TIME_LIMIT_EXCEEDED":
      // 시간 초과 UI 정보를 반환한다.
      return {
        // 사용자에게 보여줄 한글 라벨이다.
        label: "시간 초과",

        // 텍스트 색상 클래스다.
        colorClass: "text-amber-500",

        // 배경 색상 클래스다.
        bgClass: "bg-amber-500/10",

        // 시간 초과 아이콘이다.
        icon: <Clock className="w-8 h-8 text-amber-500" />,
      };

    // MLE는 메모리 초과를 의미한다.
    case "MLE":

    // MEMORY_LIMIT_EXCEEDED도 메모리 초과로 처리한다.
    case "MEMORY_LIMIT_EXCEEDED":
      // 메모리 초과 UI 정보를 반환한다.
      return {
        // 사용자에게 보여줄 한글 라벨이다.
        label: "메모리 초과",

        // 텍스트 색상 클래스다.
        colorClass: "text-amber-500",

        // 배경 색상 클래스다.
        bgClass: "bg-amber-500/10",

        // 메모리 초과 아이콘이다.
        icon: <Database className="w-8 h-8 text-amber-500" />,
      };

    // RE는 런타임 에러를 의미한다.
    case "RE":

    // RUNTIME_ERROR도 런타임 에러로 처리한다.
    case "RUNTIME_ERROR":
      // 런타임 에러 UI 정보를 반환한다.
      return {
        // 사용자에게 보여줄 한글 라벨이다.
        label: "런타임 에러",

        // 텍스트 색상 클래스다.
        colorClass: "text-orange-500",

        // 배경 색상 클래스다.
        bgClass: "bg-orange-500/10",

        // 런타임 에러 아이콘이다.
        icon: <OctagonX className="w-8 h-8 text-orange-500" />,
      };

    // CE는 컴파일 에러를 의미한다.
    case "CE":

    // COMPILE_ERROR도 컴파일 에러로 처리한다.
    case "COMPILE_ERROR":

    // COMPILATION_ERROR도 컴파일 에러로 처리한다.
    case "COMPILATION_ERROR":
      // 컴파일 에러 UI 정보를 반환한다.
      return {
        // 사용자에게 보여줄 한글 라벨이다.
        label: "컴파일 에러",

        // 텍스트 색상 클래스다.
        colorClass: "text-violet-500",

        // 배경 색상 클래스다.
        bgClass: "bg-violet-500/10",

        // 컴파일 에러 아이콘이다.
        icon: <FileX2 className="w-8 h-8 text-violet-500" />,
      };

    // PE는 출력 형식 오류를 의미한다.
    case "PE":

    // PRESENTATION_ERROR도 출력 형식 오류로 처리한다.
    case "PRESENTATION_ERROR":

    // OUTPUT_FORMAT_ERROR도 출력 형식 오류로 처리한다.
    case "OUTPUT_FORMAT_ERROR":
      // 출력 형식 오류 UI 정보를 반환한다.
      return {
        // 사용자에게 보여줄 한글 라벨이다.
        label: "출력 형식 오류",

        // 텍스트 색상 클래스다.
        colorClass: "text-sky-500",

        // 배경 색상 클래스다.
        bgClass: "bg-sky-500/10",

        // 출력 형식 오류 아이콘이다.
        icon: <AlignJustify className="w-8 h-8 text-sky-500" />,
      };

    // SYSTEM_ERROR는 시스템 오류를 의미한다.
    case "SYSTEM_ERROR":
      // 시스템 오류 UI 정보를 반환한다.
      return {
        // 사용자에게 보여줄 한글 라벨이다.
        label: "시스템 오류",

        // 텍스트 색상 클래스다.
        colorClass: "text-zinc-500",

        // 배경 색상 클래스다.
        bgClass: "bg-zinc-500/10",

        // 시스템 오류 아이콘이다.
        icon: <ServerCrash className="w-8 h-8 text-zinc-500" />,
      };

    // 위에서 처리하지 않은 결과 코드는 기본값으로 처리한다.
    default:
      // 기본 UI 정보를 반환한다.
      return {
        // 알 수 없는 결과 코드는 원본 값을 그대로 보여준다.
        label: result,

        // 기본 텍스트 색상 클래스다.
        colorClass: "text-zinc-500",

        // 기본 배경 색상 클래스다.
        bgClass: "bg-zinc-500/10",

        // 기본 아이콘 대신 원형 div를 보여준다.
        icon: <div className="w-8 h-8 rounded-full bg-zinc-500/20" />,
      };
  }
};

function isAcceptedResult(result: string | null | undefined) {
  const normalizedResult = (result ?? "").trim().toUpperCase();

  return normalizedResult === "AC" || normalizedResult === "ACCEPTED";
}

function formatSubmissionDateTime(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(dateString));
}

export default function SubmissionSummary({
  submission,
}: SubmissionSummaryProps) {
  const { label, colorClass, bgClass, icon } = getResultInfo(submission.result);
  const shouldShowPerformance = isAcceptedResult(submission.result);

  return (
    <>
      <div className="flex justify-end mb-1">{(submission.result === "WA" || submission.result === "MLE" || submission.result === "TLE" || submission.result == "RE" || submission.result == "PE") && submission.failed_testcase_order && (
        <FailedTestcaseModal
          submissionId={submission.id}
          problemId={submission.problem_id}
          failedOrder={submission.failed_testcase_order}
        />
      )}</div>
      <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-xl">
        <div className="p-8 flex flex-col items-start md:items-center justify-between gap-6">
          <div className="flex items-center w-full gap-6">
            <div className={`p-4 rounded-2xl ${bgClass} shadow-inner`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xl font-black tracking-tight ${colorClass}`}
                >
                  {label}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 font-mono text-sm">
                  #{submission.id}
                </span>
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white hover:cursor-pointer hover:underline">
                <Link
                  href={`/problems/${submission.problem_id}`}
                  prefetch={false}
                >
                  {submission.problem_title}
                </Link>
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
                {shouldShowPerformance && submission.execution_time_ms !== null
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
                {shouldShowPerformance && submission.memory_kb !== null
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
                {formatSubmissionDateTime(submission.submitted_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-3 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span>제출 시각: {formatSubmissionDateTime(submission.submitted_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>문제 번호: {submission.problem_id}</span>
          </div>
        </div>



      </div>
    </>

  );
}
