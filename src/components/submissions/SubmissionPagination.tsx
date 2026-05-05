"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function SubmissionPagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  // 전체 페이지 수가 0 또는 1이면 렌더링하지 않음
  if (totalPages <= 1) return null;

  // 표시할 페이지 번호 배열 생성 로직 (예: 1 2 3 4 5)
  // 현재 페이지를 중심으로 앞뒤 2개씩 총 최대 5개의 페이지 번호 표시
  const getPageNumbers = () => {
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // 표시할 페이지 수가 5개 미만인 경우 보정
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4);
      }
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex justify-end items-center mb-10">
      <nav className="inline-flex items-center -space-x-px rounded-md shadow-sm bg-white" aria-label="Pagination">
        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 border border-gray-300 bg-white hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="sr-only">Previous</span>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* 페이지 번호 버튼 목록 */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border focus:z-20 transition-colors ${
              currentPage === page
                ? "z-10 bg-blue-50 border-blue-500 text-blue-600" // 현재 페이지 강조 스타일
                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50" // 기본 스타일
            }`}
          >
            {page}
          </button>
        ))}

        {/* 다음 페이지 버튼 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 border border-gray-300 bg-white hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="sr-only">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
