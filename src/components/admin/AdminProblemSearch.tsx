"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

interface AdminProblemSearchProps {
  placeholder?: string;
}

export function AdminProblemSearch({ placeholder = "문제 이름 또는 번호 검색..." }: AdminProblemSearchProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
      params.set("page", "1");
    } else {
      params.delete("search");
    }
    
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
        className="block w-full pl-10 pr-4 py-2.5 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-zinc-900 dark:border-zinc-800 dark:placeholder-zinc-400 dark:text-white transition-all shadow-sm"
        placeholder={placeholder}
      />
      <button type="submit" className="hidden">검색</button>
    </form>
  );
}
