"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  pageParamName?: string;
}

export function Pagination({ totalPages, currentPage, pageParamName = "page" }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set(pageParamName, pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center mt-8 gap-4">
      {currentPage > 1 ? (
        <Link 
          href={createPageURL(currentPage - 1)}
          className="px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
        >
          이전
        </Link>
      ) : (
        <button disabled className="px-4 py-2 text-sm font-medium bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
          이전
        </button>
      )}

      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        <span className="text-zinc-900 dark:text-white font-bold">{currentPage}</span> / {totalPages}
      </div>

      {currentPage < totalPages ? (
        <Link 
          href={createPageURL(currentPage + 1)}
          className="px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
        >
          다음
        </Link>
      ) : (
        <button disabled className="px-4 py-2 text-sm font-medium bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
          다음
        </button>
      )}
    </div>
  );
}
