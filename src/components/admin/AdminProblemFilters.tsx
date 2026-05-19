"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { getKoreanTag, DIFFICULTY_OPTIONS } from "@/utils/tagUtils";

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

  const DIFFICULTIES = ["전체", ...DIFFICULTY_OPTIONS];
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
        <label className="ml-1 text-xs font-bold uppercase tracking-wider text-zinc-500">카테고리</label>
        <DropdownSelect
          value={currentCategory}
          onValueChange={(value) => updateFilter("category", value)}
          options={[
            { value: "전체", label: "전체 카테고리" },
            ...categories.map((c) => ({ value: c, label: getKoreanTag(c) })),
          ]}
          triggerClassName="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-blue-500/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="ml-1 text-xs font-bold uppercase tracking-wider text-zinc-500">난이도</label>
        <DropdownSelect
          value={currentDifficulty}
          onValueChange={(value) => updateFilter("difficulty", value)}
          options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
          triggerClassName="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-blue-500/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="ml-1 text-xs font-bold uppercase tracking-wider text-zinc-500">상태</label>
        <DropdownSelect
          value={currentStatus}
          onValueChange={(value) => updateFilter("status", value)}
          options={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          triggerClassName="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-blue-500/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="ml-1 text-xs font-bold uppercase tracking-wider text-zinc-500">정렬</label>
        <DropdownSelect
          value={currentSort}
          onValueChange={(value) => updateFilter("sort", value)}
          options={SORTS.map((s) => ({ value: s.value, label: s.label }))}
          triggerClassName="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-blue-500/20"
        />
      </div>
    </div>
  );
}
