"use client"; // 이 컴포넌트가 클라이언트 컴포넌트임을 명시합니다.

import Link from "next/link"; // Next.js의 클라이언트 라우팅용 Link를 가져옵니다.
import { usePathname, useSearchParams } from "next/navigation"; // 현재 경로와 쿼리스트링을 읽기 위한 훅을 가져옵니다.

interface PaginationProps { // Pagination 컴포넌트가 받을 props 타입을 정의합니다.
  totalPages: number; // 전체 페이지 수를 의미합니다.
  currentPage: number; // 현재 페이지 번호를 의미합니다.
  pageParamName?: string; // URL에서 페이지 번호로 사용할 쿼리 파라미터 이름을 의미합니다.
}

export function Pagination({ totalPages, currentPage, pageParamName = "page" }: PaginationProps) { // Pagination 컴포넌트를 정의합니다.
  const pathname = usePathname(); // 현재 페이지의 pathname을 가져옵니다.
  const searchParams = useSearchParams(); // 현재 URL의 search params를 가져옵니다.

  const safeTotalPages = Math.max(1, totalPages); // totalPages가 0 이하로 들어와도 최소 1로 보정합니다.
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages); // currentPage가 범위를 벗어나지 않도록 보정합니다.

  const createPageURL = (pageNumber: number) => { // 특정 페이지 번호로 이동하는 URL을 만드는 함수를 정의합니다.
    const params = new URLSearchParams(searchParams.toString()); // 현재 URL 쿼리스트링을 복사합니다.
    params.set(pageParamName, String(pageNumber)); // 페이지 번호 파라미터를 새 값으로 설정합니다.
    return `${pathname}?${params.toString()}`; // pathname과 쿼리스트링을 합쳐 최종 URL을 반환합니다.
  };

  const getPageNumbers = () => { // 화면에 보여줄 페이지 번호 배열을 만드는 함수를 정의합니다.
    const pages: number[] = []; // 페이지 번호를 담을 배열을 생성합니다.
    const showMax = 5; // 한 번에 보여줄 최대 페이지 번호 개수를 설정합니다.
    let start = Math.max(1, safeCurrentPage - Math.floor(showMax / 2)); // 현재 페이지를 중심으로 시작 페이지를 계산합니다.
    let end = Math.min(safeTotalPages, start + showMax - 1); // 시작 페이지 기준으로 끝 페이지를 계산합니다.

    if (end - start + 1 < showMax) { // 실제 표시 개수가 showMax보다 적은지 확인합니다.
      start = Math.max(1, end - showMax + 1); // 끝 페이지를 기준으로 시작 페이지를 다시 보정합니다.
    }

    for (let page = start; page <= end; page += 1) { // 시작 페이지부터 끝 페이지까지 반복합니다.
      pages.push(page); // 계산된 페이지 번호를 배열에 추가합니다.
    }

    return pages; // 최종 페이지 번호 배열을 반환합니다.
  };

  const pages = getPageNumbers(); // 화면에 렌더링할 페이지 번호 배열을 가져옵니다.
  const isFirstPage = safeCurrentPage === 1; // 현재 페이지가 첫 페이지인지 확인합니다.
  const isLastPage = safeCurrentPage === safeTotalPages; // 현재 페이지가 마지막 페이지인지 확인합니다.

  if (totalPages <= 1) return null; // 전체 페이지가 1 이하라면 페이지네이션을 렌더링하지 않습니다.

  return ( // JSX 렌더링을 시작합니다.
    <div className="flex justify-center items-center mt-10"> {/* 페이지네이션 전체를 가운데 정렬합니다. */}
      <nav className="inline-flex items-center -space-x-px rounded-xl shadow-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden" aria-label="Pagination"> {/* 페이지네이션 nav 영역을 만듭니다. */}
        {isFirstPage ? ( // 첫 페이지라면 이전 버튼을 비활성 UI로 보여줍니다.
          <span className="relative inline-flex items-center px-3 py-2.5 text-zinc-500 dark:text-zinc-400 opacity-40 cursor-not-allowed"> {/* 비활성 이전 버튼을 span으로 렌더링합니다. */}
            <span className="sr-only">Previous</span> {/* 스크린 리더용 텍스트를 제공합니다. */}
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> {/* 이전 아이콘 SVG를 렌더링합니다. */}
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /> {/* 이전 화살표 path를 렌더링합니다. */}
            </svg> {/* SVG를 종료합니다. */}
          </span> // 비활성 이전 버튼을 종료합니다.
        ) : ( // 첫 페이지가 아니라면 실제 이동 가능한 Link를 보여줍니다.
          <Link href={createPageURL(safeCurrentPage - 1)} className="relative inline-flex items-center px-3 py-2.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"> {/* 이전 페이지로 이동하는 Link를 렌더링합니다. */}
            <span className="sr-only">Previous</span> {/* 스크린 리더용 텍스트를 제공합니다. */}
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> {/* 이전 아이콘 SVG를 렌더링합니다. */}
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /> {/* 이전 화살표 path를 렌더링합니다. */}
            </svg> {/* SVG를 종료합니다. */}
          </Link> // 이전 페이지 Link를 종료합니다.
        )}

        {pages.map((page) => ( // 계산된 페이지 번호들을 반복 렌더링합니다.
          <Link key={page} href={createPageURL(page)} className={`relative inline-flex items-center px-4 py-2.5 text-sm font-bold transition-all ${safeCurrentPage === page ? "z-10 bg-blue-600 text-white" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}> {/* 각 페이지 번호 Link를 렌더링합니다. */}
            {page} {/* 페이지 번호를 화면에 표시합니다. */}
          </Link> // 페이지 번호 Link를 종료합니다.
        ))}

        {isLastPage ? ( // 마지막 페이지라면 다음 버튼을 비활성 UI로 보여줍니다.
          <span className="relative inline-flex items-center px-3 py-2.5 text-zinc-500 dark:text-zinc-400 opacity-40 cursor-not-allowed"> {/* 비활성 다음 버튼을 span으로 렌더링합니다. */}
            <span className="sr-only">Next</span> {/* 스크린 리더용 텍스트를 제공합니다. */}
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> {/* 다음 아이콘 SVG를 렌더링합니다. */}
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /> {/* 다음 화살표 path를 렌더링합니다. */}
            </svg> {/* SVG를 종료합니다. */}
          </span> // 비활성 다음 버튼을 종료합니다.
        ) : ( // 마지막 페이지가 아니라면 실제 이동 가능한 Link를 보여줍니다.
          <Link href={createPageURL(safeCurrentPage + 1)} className="relative inline-flex items-center px-3 py-2.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"> {/* 다음 페이지로 이동하는 Link를 렌더링합니다. */}
            <span className="sr-only">Next</span> {/* 스크린 리더용 텍스트를 제공합니다. */}
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> {/* 다음 아이콘 SVG를 렌더링합니다. */}
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /> {/* 다음 화살표 path를 렌더링합니다. */}
            </svg> {/* SVG를 종료합니다. */}
          </Link> // 다음 페이지 Link를 종료합니다.
        )}
      </nav> {/* 페이지네이션 nav 영역을 종료합니다. */}
    </div> // 페이지네이션 wrapper를 종료합니다.
  );
}