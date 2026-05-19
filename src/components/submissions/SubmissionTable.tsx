"use client";

import { getKoreanTag } from "@/utils/tagUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Users } from "lucide-react";

export type Submission = {
  id: number;
  problemId: number;
  problemTitle: string;
  tag1: string;
  tag2: string | null;
  language: string;
  result: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  submittedAt: string;
  solvedUsersCount?: number | null;
};

type Props = {
  submissions: Submission[];
  onSort: (field: keyof Submission) => void;
  currentSort: { field: keyof Submission; order: "asc" | "desc" };
};

const getResultBadgeStyle = (result: string) => {
  switch (result) {
    case "AC":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    case "WA":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
    case "TLE":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";
    case "MLE":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
    case "RE":
    case "CE":
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
  }
};

const getResultText = (result: string) => {
  switch (result) {
    case "AC":
      return "정답";
    case "WA":
      return "오답";
    case "TLE":
      return "시간 초과";
    case "MLE":
      return "메모리 초과";
    case "RE":
      return "런타임 에러";
    case "CE":
      return "컴파일 에러";
    case "PE":
      return "출력 형식 오류";
    case "SYSTEM_ERROR":
      return "시스템 오류";
    default:
      return result;
  }
};

const convertLanguage = (language: string | null) => {
  if (!language) return "-";

  switch (language) {
    case "java":
      return "Java 17";
    case "cpp":
      return "C++ 17";
    case "python":
      return "Python3";
    default:
      return language;
  }
};

function formatToReadableDate(isoString: string): string {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour12: false,
  }).format(date);
}

export default function SubmissionTable({
  submissions,
  onSort,
  currentSort,
}: Props) {
  const router = useRouter();

  const SortHeader = ({
    field,
    label,
    className = "",
    align = "left",
  }: {
    field: keyof Submission;
    label: string;
    className?: string;
    align?: "left" | "right" | "center";
  }) => {
    const isActive = currentSort.field === field;

    const alignClass =
      align === "right"
        ? "justify-end text-right"
        : align === "center"
          ? "justify-center text-center"
          : "justify-start text-left";

    return (
      <th className={`h-11 whitespace-nowrap px-6 ${className}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSort(field);
          }}
          className={`group flex w-full items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 ${alignClass}`}
        >
          {label}
          <span className="text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
            {!isActive ? (
              <ArrowUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
            ) : currentSort.order === "asc" ? (
              <ArrowUp className="h-3 w-3 text-blue-500" />
            ) : (
              <ArrowDown className="h-3 w-3 text-blue-500" />
            )}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:border-zinc-800 dark:bg-[#18181b]">
      <div className="w-full overflow-x-auto">
        <table className="min-w-210 w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-27.5" />
            <col className="w-75" />
            <col className="w-27.5" />
            <col className="w-30" />
            <col className="w-27.5" />
            <col className="w-27.5" />
            <col className="w-32.5" />
            <col className="w-50" />
          </colgroup>

          <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] dark:border-zinc-800 dark:bg-zinc-800/30">
            <tr className="hover:bg-transparent">
              <SortHeader field="id" label="제출 ID" />
              <SortHeader field="problemTitle" label="문제" />
              <SortHeader field="language" label="언어" />
              <SortHeader field="result" label="결과" />
              <SortHeader field="runtimeMs" label="실행 시간" align="right" />
              <SortHeader field="memoryKb" label="메모리" align="right" />
              <SortHeader
                field="solvedUsersCount"
                label="맞힌 사람"
                align="right"
              />
              <SortHeader field="submittedAt" label="제출 시간" />
            </tr>
          </thead>

          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800">
                      <svg
                        className="h-6 w-6 text-zinc-400 dark:text-zinc-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    <p className="text-base font-medium text-zinc-900 dark:text-zinc-200">
                      제출 내역이 없습니다.
                    </p>

                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      아직 제출한 문제가 없습니다. 새로운 문제에 도전해보세요!
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => router.push(`/submissions/${sub.id}`)}
                  className="group cursor-pointer border-b border-[#E2E8F0] transition-colors last:border-b-0 hover:bg-[#F8FAFC] dark:border-zinc-800 dark:hover:bg-zinc-800/20"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm font-medium text-zinc-400 dark:text-zinc-500">
                    {sub.id}
                  </td>

                  <td className="min-w-0 px-6 py-4">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1">
                        <span className="truncate text-sm font-semibold text-zinc-800 transition-colors group-hover:text-blue-600 dark:text-zinc-200 dark:group-hover:text-blue-400">
                          {sub.problemTitle}
                        </span>

                        <span className="shrink-0 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                          #{sub.problemId}
                        </span>
                      </div>

                      <div className="mt-1 flex min-w-0 flex-nowrap gap-1 overflow-hidden">
                        <span className="max-w-20.5 truncate whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                          {getKoreanTag(sub.tag1)}
                        </span>

                        {sub.tag2 && (
                          <span className="max-w-20.5 truncate whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                            {getKoreanTag(sub.tag2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    {convertLanguage(sub.language)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/submissions/${sub.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all hover:brightness-95 ${getResultBadgeStyle(
                          sub.result,
                        )}`}
                      >
                        {getResultText(sub.result)}
                      </span>
                    </Link>
                  </td>

                  <td className={`whitespace-nowrap  py-4 ${sub.runtimeMs !== null ? "text-left pl-7" : "text-center pr-5"} text-sm font-medium text-zinc-600 dark:text-zinc-400`}>
                    {sub.runtimeMs !== null ? `${sub.runtimeMs} ms` : "-"}
                  </td>

                  <td className={`whitespace-nowrap py-4 ${sub.memoryKb !== null ? "text-right pr-5" : "text-center pl-2"} text-sm font-medium text-zinc-600 dark:text-zinc-400`}>
                    {sub.memoryKb !== null
                      ? `${(sub.memoryKb / 1024).toFixed(2)} MB`
                      : "-"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-left">
                    <div className="flex items-center justify-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <Users className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="text-sm font-medium">
                        {sub.solvedUsersCount?.toLocaleString() ?? "-"}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-500">
                    {formatToReadableDate(sub.submittedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}