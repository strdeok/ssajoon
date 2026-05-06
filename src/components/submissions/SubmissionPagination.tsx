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
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

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
      <nav className="inline-flex items-center -space-x-px rounded-md shadow-sm bg-white dark:bg-zinc-900" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-zinc-500 border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="sr-only">Previous</span>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border focus:z-20 transition-colors ${
              currentPage === page
                ? "z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                : "bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-zinc-500 border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="sr-only">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
