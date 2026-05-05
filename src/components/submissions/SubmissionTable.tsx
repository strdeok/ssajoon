"use client";

import React from "react";
import { Eye } from "lucide-react";
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
    case "맞았습니다!":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"; // 초록 배지
    case "틀렸습니다":
      return "bg-red-100 text-red-700 border-red-200"; // 빨강 배지
    case "시간 초과":
      return "bg-orange-100 text-orange-700 border-orange-200"; // 주황 배지
    case "메모리 초과":
      return "bg-purple-100 text-purple-700 border-purple-200"; // 보라 배지
    case "런타임 에러":
    case "컴파일 에러":
      return "bg-gray-100 text-gray-700 border-gray-200"; // 회색 배지
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"; // 기본 배지
  }
};

export default function SubmissionTable({ submissions }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">제출 ID</th>
              <th className="px-6 py-4">문제</th>
              <th className="px-6 py-4">언어</th>
              <th className="px-6 py-4">결과</th>
              <th className="px-6 py-4">실행 시간</th>
              <th className="px-6 py-4">메모리</th>
              <th className="px-6 py-4">제출 시간</th>
              <th className="px-6 py-4 text-center">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {submissions.length === 0 ? (
              // 제출 내역이 비어있을 경우의 Empty State 렌더링
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  제출 내역이 없습니다.
                </td>
              </tr>
            ) : (
              // 제출 내역이 있을 경우 테이블 로우 렌더링
              submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  {/* 1. 제출 ID */}
                  <td className="px-6 py-4 font-mono text-gray-500">{sub.id}</td>

                  {/* 2. 문제명 (두 줄 처리: 제목+번호, 카테고리) */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link
                        href={`/problems/${sub.problemId}`}
                        className="font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                      >
                        {sub.problemTitle} <span className="text-gray-400 font-normal">#{sub.problemId}</span>
                      </Link>
                      <span className="text-xs text-gray-500 mt-0.5">{sub.category}</span>
                    </div>
                  </td>

                  {/* 3. 언어 */}
                  <td className="px-6 py-4">{sub.language}</td>

                  {/* 4. 결과 (자동 색상 배지) */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getResultBadgeStyle(
                        sub.result
                      )}`}
                    >
                      {sub.result}
                    </span>
                  </td>

                  {/* 5. 실행 시간 */}
                  <td className="px-6 py-4">{sub.runtimeMs !== null ? `${sub.runtimeMs} ms` : "-"}</td>

                  {/* 6. 메모리 */}
                  <td className="px-6 py-4">
                    {sub.memoryKb !== null ? `${(sub.memoryKb / 1024).toFixed(2)} MB` : "-"}
                  </td>

                  {/* 7. 제출 시간 */}
                  <td className="px-6 py-4 text-gray-500">{sub.submittedAt}</td>

                  {/* 8. 작업 (상세보기 버튼) */}
                  <td className="px-6 py-4 text-center">
                    <button
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-flex justify-center"
                      title="코드 상세보기"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
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
