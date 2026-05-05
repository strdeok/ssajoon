"use client";

import Link from "next/link";

export type Submission = {
  id: number;
  problemId: number;
  problemTitle: string;
  category: string;
  language: string;
  result: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  submittedAt: string; // ISO 문자열 또는 형식화된 상대 시간 문자열
};

type Props = {
  submissions: Submission[];
};

// 결과 문자열에 따라 배지(Badge)의 색상을 반환하는 헬퍼 함수
const getResultBadgeStyle = (result: string) => {
  switch (result) {
    case "AC":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"; // 초록 배지
    case "WA":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"; // 빨강 배지
    case "TLE":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"; // 주황 배지
    case "MLE":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"; // 보라 배지
    case "RE":
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"; // 회색 배지
    case "CE":
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"; // 회색 배지
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"; // 기본 배지
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

export default function SubmissionTable({ submissions }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
          <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 font-medium">
            <tr>
              <th className="px-6 py-4">제출 ID</th>
              <th className="px-6 py-4">문제</th>
              <th className="px-6 py-4">언어</th>
              <th className="px-6 py-4">결과</th>
              <th className="px-6 py-4">실행 시간</th>
              <th className="px-6 py-4">메모리</th>
              <th className="px-6 py-4">제출 시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {submissions.length === 0 ? (
              // 제출 내역이 비어있을 경우의 Empty State 렌더링
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-500 dark:text-zinc-500"
                >
                  제출 내역이 없습니다.
                </td>
              </tr>
            ) : (
              // 제출 내역이 있을 경우 테이블 로우 렌더링
              submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  {/* 1. 제출 ID */}
                  <td className="px-6 py-4 font-mono">
                    <Link
                      href={`/submissions/${sub.id}`}
                      className="text-gray-500 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                    >
                      {sub.id}
                    </Link>
                  </td>

                  {/* 2. 문제명 (두 줄 처리: 제목+번호, 카테고리) */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link
                        href={`/problems/${sub.problemId}`}
                        className="font-medium text-gray-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                      >
                        {sub.problemTitle}{" "}
                        <span className="text-gray-400 dark:text-zinc-500 font-normal">
                          #{sub.problemId}
                        </span>
                      </Link>
                      <span className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                        {sub.category}
                      </span>
                    </div>
                  </td>

                  {/* 3. 언어 */}
                  <td className="px-6 py-4 capitalize">
                    {sub.language === "cpp" ? "c++" : sub.language}
                  </td>

                  {/* 4. 결과 (자동 색상 배지) */}
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

                  {/* 5. 실행 시간 */}
                  <td className="px-6 py-4">
                    {sub.runtimeMs !== null ? `${sub.runtimeMs} ms` : "-"}
                  </td>

                  {/* 6. 메모리 */}
                  <td className="px-6 py-4">
                    {sub.memoryKb !== null
                      ? `${(sub.memoryKb / 1024).toFixed(2)} MB`
                      : "-"}
                  </td>

                  {/* 7. 제출 시간 */}
                  <td className="px-6 py-4 text-gray-500 dark:text-zinc-500">
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
