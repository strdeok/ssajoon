"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getKoreanTag } from "@/utils/tagUtils";

interface AdminProblemFiltersProps {
  categories: string[];
}

export function AdminProblemFilters({ categories }: AdminProblemFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentCategory = searchParams.get("category") || "전체";
  const currentDifficulty = searchParams.get("difficulty") || "전체";
  const currentStatus = searchParams.get("status") || "전체";
  const currentSort = searchParams.get("sort") || "newest";

  const DIFFICULTIES = ["전체", "Easy", "Medium", "Medium-Hard", "Hard", "Very-Hard"];
  const STATUSES = [
    { label: "전체", value: "전체" },
    { label: "활성", value: "active" },
    { label: "숨김", value: "hidden" },
    { label: "삭제됨", value: "deleted" }
  ];
  const SORTS = [
    { label: "최신순", value: "newest" },
    { label: "오래된순", value: "oldest" },
    { label: "제목순", value: "title" }
  ];

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "전체" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-4 items-center bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">카테고리</label>
        <select
          value={currentCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        >
          <option value="전체">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>{getKoreanTag(c)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">난이도</label>
        <select
          value={currentDifficulty}
          onChange={(e) => updateFilter("difficulty", e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">상태</label>
        <select
          value={currentStatus}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">정렬</label>
        <select
          value={currentSort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}