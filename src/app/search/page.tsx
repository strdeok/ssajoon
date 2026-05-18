"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Loader2,
  MemoryStick,
  Search,
  SearchIcon,
  Sparkles,
} from "lucide-react";
import { DIFFICULTY_ORDER, getKoreanTag } from "@/utils/tagUtils";

interface OptionItem {
  tag1: string;
  tag2: string | null;
  difficulty: string;
  count: number;
}

interface RecommendedProblem {
  id: number;
  title: string;
  difficulty: string;
  tag1: string;
  tag2?: string | null;
  time_limit_ms: number;
  memory_limit_mb: number;
}

type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

const ALL_OPTION = "전체";

const normalizeSelection = (value: string) => (value === ALL_OPTION ? "" : value);
const DIFFICULTY_RANK: Record<string, number> = {
  ...DIFFICULTY_ORDER,
  EASY: DIFFICULTY_ORDER.Easy,
  MEDIUM: DIFFICULTY_ORDER.Medium,
  MEDIUM_HARD: DIFFICULTY_ORDER["Medium-Hard"],
  "MEDIUM-HARD": DIFFICULTY_ORDER["Medium-Hard"],
  HARD: DIFFICULTY_ORDER.Hard,
  VERY_HARD: DIFFICULTY_ORDER["Very-Hard"],
  "VERY-HARD": DIFFICULTY_ORDER["Very-Hard"],
};

const getDifficultyRank = (difficulty: string) => DIFFICULTY_RANK[difficulty] || 99;

export default function GeneratePage() {
  const router = useRouter();
  const [optionItems, setOptionItems] = useState<OptionItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [selectedTag1, setSelectedTag1] = useState(ALL_OPTION);
  const [selectedTag2, setSelectedTag2] = useState(ALL_OPTION);
  const [selectedDifficulty, setSelectedDifficulty] = useState(ALL_OPTION);

  const [status, setStatus] = useState<SearchStatus>("idle");
  const [problems, setProblems] = useState<RecommendedProblem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setIsLoadingOptions(true);

    try {
      const response = await fetch("/api/problems/recommend/options", {
        cache: "no-store",
      });
      const data = await response.json();

      setOptionItems(data.success ? data.items ?? [] : []);
    } catch {
      setOptionItems([]);
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    void fetchOptions();
  }, [fetchOptions]);

  const availableTag1s = useMemo(() => {
    let items = optionItems;

    if (selectedTag2 !== ALL_OPTION) {
      items = items.filter((item) => item.tag2 === selectedTag2);
    }

    if (selectedDifficulty !== ALL_OPTION) {
      items = items.filter((item) => item.difficulty === selectedDifficulty);
    }

    return Array.from(new Set(items.map((item) => item.tag1).filter(Boolean))).sort();
  }, [optionItems, selectedDifficulty, selectedTag2]);

  const availableTag2s = useMemo(() => {
    let items = optionItems.filter((item) => item.tag2);

    if (selectedTag1 !== ALL_OPTION) {
      items = items.filter((item) => item.tag1 === selectedTag1);
    }

    if (selectedDifficulty !== ALL_OPTION) {
      items = items.filter((item) => item.difficulty === selectedDifficulty);
    }

    return Array.from(new Set(items.map((item) => item.tag2 as string))).sort();
  }, [optionItems, selectedDifficulty, selectedTag1]);

  const availableDifficulties = useMemo(() => {
    let items = optionItems;

    if (selectedTag1 !== ALL_OPTION) {
      items = items.filter((item) => item.tag1 === selectedTag1);
    }

    if (selectedTag2 !== ALL_OPTION) {
      items = items.filter((item) => item.tag2 === selectedTag2);
    }

    return Array.from(new Set(items.map((item) => item.difficulty).filter(Boolean))).sort(
      (a, b) => getDifficultyRank(a) - getDifficultyRank(b),
    );
  }, [optionItems, selectedTag1, selectedTag2]);

  const matchingProblemCount = useMemo(() => {
    return optionItems
      .filter((item) => {
        const tag1Matches = selectedTag1 === ALL_OPTION || item.tag1 === selectedTag1;
        const tag2Matches = selectedTag2 === ALL_OPTION || item.tag2 === selectedTag2;
        const difficultyMatches =
          selectedDifficulty === ALL_OPTION || item.difficulty === selectedDifficulty;

        return tag1Matches && tag2Matches && difficultyMatches;
      })
      .reduce((sum, item) => sum + item.count, 0);
  }, [optionItems, selectedDifficulty, selectedTag1, selectedTag2]);

  const resetResults = () => {
    setProblems([]);
    setErrorMessage(null);
    setStatus("idle");
  };

  const handleTag1Change = (tag: string) => {
    setSelectedTag1(tag);
    setSelectedTag2(ALL_OPTION);
    resetResults();
  };

  const handleSearch = async () => {
    if (isLoadingOptions || status === "loading") return;

    setStatus("loading");
    setProblems([]);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/problems/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag1: normalizeSelection(selectedTag1),
          tag2: normalizeSelection(selectedTag2),
          difficulty: normalizeSelection(selectedDifficulty),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "문제를 찾는 중 오류가 발생했습니다.");
      }

      const nextProblems = (data.problems ?? []) as RecommendedProblem[];
      setProblems(nextProblems);
      setStatus(nextProblems.length > 0 ? "success" : "empty");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "문제를 찾는 중 오류가 발생했습니다.",
      );
      setStatus("error");
    }
  };

  const difficultyColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case "EASY":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "MEDIUM":
      case "MEDIUM-HARD":
      case "MEDIUM_HARD":
        return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "HARD":
      case "VERY-HARD":
      case "VERY_HARD":
        return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
      default:
        return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-6 sm:p-8 pb-20 space-y-8">
      <div className="flex flex-col gap-3 pt-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-4xl">
            문제 찾기
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
            알고리즘 유형과 난이도를 선택하면 문제 중 조건에 맞는 문제를 랜덤으로 검색합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <section className="lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#09090b]">
          <div className="space-y-5">
            <FilterSelect
              label="알고리즘 유형"
              value={selectedTag1}
              onChange={handleTag1Change}
              disabled={isLoadingOptions || status === "loading"}
              options={[ALL_OPTION, ...availableTag1s]}
              renderLabel={(value) => (value === ALL_OPTION ? value : getKoreanTag(value))}
            />

            <FilterSelect
              label="추가 유형"
              value={selectedTag2}
              onChange={(value) => {
                setSelectedTag2(value);
                resetResults();
              }}
              disabled={isLoadingOptions || status === "loading"}
              options={[ALL_OPTION, ...availableTag2s]}
              renderLabel={(value) => (value === ALL_OPTION ? value : getKoreanTag(value))}
            />

            <FilterSelect
              label="난이도"
              value={selectedDifficulty}
              onChange={(value) => {
                setSelectedDifficulty(value);
                resetResults();
              }}
              disabled={isLoadingOptions || status === "loading"}
              options={[ALL_OPTION, ...availableDifficulties]}
              renderLabel={(value) => value}
            />

            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoadingOptions || status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {status === "loading" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <SearchIcon className="h-5 w-5" />
              )}
              <span>{status === "loading" ? "문제 찾는 중..." : "문제 찾기"}</span>
            </button>

            {status === "error" && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-semibold">
                  {errorMessage || "문제를 찾는 중 오류가 발생했습니다."}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-8">
          {status === "idle" && (
            <StatePanel
              icon={<Search className="h-10 w-10" />}
              title="추천 문제"
              description="알고리즘 유형과 난이도를 선택한 뒤 문제를 찾아보세요."
            />
          )}

          {status === "loading" && (
            <StatePanel
              icon={<Loader2 className="h-10 w-10 animate-spin" />}
              title="조건에 맞는 문제를 찾고 있어요."
              description="공개 문제 목록에서 최대 10개를 랜덤으로 불러오는 중입니다."
            />
          )}

          {status === "empty" && (
            <StatePanel
              icon={<AlertCircle className="h-10 w-10" />}
              title="조건에 맞는 문제가 없습니다"
              description="조건에 맞는 문제가 없습니다. 다른 조건으로 다시 시도해보세요."
            />
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-zinc-950 dark:text-white">
                    추천 문제
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    원하는 문제를 선택해 풀이를 시작하세요.
                  </p>
                </div>
                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  {problems.length}개 표시
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 h-98 overflow-y-scroll">
                {problems.map((problem) => (
                  <button
                    key={problem.id}
                    type="button"
                    onClick={() => router.push(`/problems/${problem.id}`)}
                    className="group w-full rounded-2xl border border-zinc-200 max-h-32 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#09090b] dark:hover:border-blue-500/50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${difficultyColor(problem.difficulty)}`}
                          >
                            {problem.difficulty}
                          </span>
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
                            {getKoreanTag(problem.tag1)}
                          </span>
                          {problem.tag2 && (
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
                              {getKoreanTag(problem.tag2)}
                            </span>
                          )}
                        </div>

                        <h3 className="truncate text-lg font-black text-zinc-950 dark:text-white">
                          {problem.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            시간 제한 {problem.time_limit_ms / 1000}초
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MemoryStick className="h-4 w-4" />
                            메모리 제한 {problem.memory_limit_mb}MB
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-blue-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  disabled,
  options,
  renderLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  options: string[];
  renderLabel: (value: string) => string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-11 font-medium text-zinc-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-black/40 dark:text-zinc-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {renderLabel(option)}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-zinc-500" />
      </div>
    </div>
  );
}

function StatePanel({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-115 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-white/[0.02] dark:text-zinc-400">
      <div className="mb-4 text-zinc-300 dark:text-zinc-700">{icon}</div>
      <h2 className="text-lg font-black text-zinc-900 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-sm text-sm">{description}</p>
    </div>
  );
}
