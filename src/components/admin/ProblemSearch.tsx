"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

interface ProblemSearchProps {
  placeholder?: string;
}

export function ProblemSearch({ placeholder = "문제 이름 검색..." }: ProblemSearchProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("problemSearch") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    
    if (searchTerm.trim()) {
      params.set("problemSearch", searchTerm.trim());
      // 검색 시 1페이지로 초기화
      params.set("historyPage", "1");
    } else {
      params.delete("problemSearch");
    }
    
    // 페이지 이동 스크롤 유지
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="block w-full pl-10 pr-4 py-2 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-900 dark:border-zinc-800 dark:placeholder-zinc-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
        placeholder={placeholder}
      />
      <button type="submit" className="hidden">검색</button>
    </form>
  );
}
