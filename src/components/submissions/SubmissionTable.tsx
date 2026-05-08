"use client";

import { getKoreanTag } from "@/utils/tagUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Users } from "lucide-react";

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
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
    case "CE":
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
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

function formatToReadableDate(isoString: string): string {
  const date = new Date(isoString);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  return new Intl.DateTimeFormat("ko-KR", options).format(date);
}

export default function SubmissionTable({ submissions, onSort, currentSort }: Props) {
  const router = useRouter();

  const SortHeader = ({
    field,
    label,
    className = "",
  }: {
    field: keyof Submission;
    label: string;
    className?: string;
  }) => {
    const isActive = currentSort.field === field;
    return (
      <th
        className={`px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors group ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          onSort(field);
        }}
      >
        <div className="flex items-center space-x-1">
          <span>{label}</span>
          <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors">
            {!isActive ? (
              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
            ) : currentSort.order === "asc" ? (
              <ArrowUp className="w-3 h-3 text-blue-500" />
            ) : (
              <ArrowDown className="w-3 h-3 text-blue-500" />
            )}
          </span>
        </div>
      </th>
    );
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
          <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 font-medium">
            <tr>
              <SortHeader field="id" label="제출 ID" />
              <SortHeader field="problemTitle" label="문제" />
              <SortHeader field="language" label="언어" />
              <SortHeader field="result" label="결과" />
              <SortHeader field="runtimeMs" label="실행 시간" />
              <SortHeader field="memoryKb" label="메모리" />
              <SortHeader field="solvedUsersCount" label="맞힌 사람 수" />
              <SortHeader field="submittedAt" label="제출 시간" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-1">
                      <svg
                        className="w-6 h-6 text-gray-400 dark:text-zinc-500"
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
                    <p className="text-gray-900 dark:text-zinc-200 font-medium text-base">
                      제출 내역이 없습니다.
                    </p>
                    <p className="text-gray-500 dark:text-zinc-500 text-sm">
                      아직 제출한 문제가 없습니다. 새로운 문제에 도전해보세요!
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr
                  onClick={() => {
                    router.push(`/submissions/${sub.id}`);
                  }}
                  key={sub.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors hover:cursor-pointer"
                >
                  <td className="px-6 py-4 font-mono">
                    <span
                      className="text-gray-500 dark:text-zinc-500 transition-colors"
                    >
                      {sub.id}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span
                        className="font-medium text-gray-900 dark:text-zinc-100 "
                      >
                        {sub.problemTitle}{" "}
                        <span className="text-gray-400 dark:text-zinc-500 font-normal">
                          #{sub.problemId}
                        </span>
                      </span>
                      <div className="flex gap-1 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-zinc-500">
                          {getKoreanTag(sub.tag1)}
                        </span>
                        {sub.tag2 && (
                          <>
                            <span className="text-xs text-gray-400 dark:text-zinc-600">
                              •
                            </span>
                            <span className="text-xs text-gray-500 dark:text-zinc-500">
                              {getKoreanTag(sub.tag2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 capitalize">
                    {sub.language === "cpp" ? "c++" : sub.language}
                  </td>

                  <td className="px-6 py-4">
                    <Link href={`/submissions/${sub.id}`}>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:brightness-95 transition-all ${getResultBadgeStyle(
                          sub.result,
                        )}`}
                      >
                        {getResultText(sub.result)}
                      </span>
                    </Link>
                  </td>

                  <td className="px-6 py-4">
                    {sub.runtimeMs !== null ? `${sub.runtimeMs} ms` : "-"}
                  </td>

                  <td className="px-6 py-4">
                    {sub.memoryKb !== null
                      ? `${(sub.memoryKb / 1024).toFixed(2)} MB`
                      : "-"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-400">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-medium">
                        {sub.solvedUsersCount?.toLocaleString() ?? "-"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-500 dark:text-zinc-500 whitespace-nowrap">
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
