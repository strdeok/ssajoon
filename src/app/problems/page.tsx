"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Problem } from "@/types/problem";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  BookOpen,
  Trophy,
  BarChart2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DifficultyBadge,
  isAcceptedResult,
  StatusIcon,
} from "@/components/problem/ProblemComponents";
import {
  getKoreanTag,
  DIFFICULTY_OPTIONS,
  DIFFICULTY_ORDER,
} from "@/utils/tagUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProblemStatus = "solved" | "wrong" | "none";

type ProblemId = Problem["id"];
type SortField =
  | "id"
  | "title"
  | "tag"
  | "difficulty"
  | "acceptanceRate"
  | "status";
type SortValue = string | number | null | undefined;

type SubmissionStatusRow = {
  problem_id: ProblemId;
  result: string | null;
};

type ProblemStats = {
  problem_id: string | number;
  attempted_users: number;
  solved_users: number;
  total_submissions: number;
  accepted_submissions: number;
  acceptance_rate: number;
};

type UserProfile = {
  show_algorithm?: boolean | null;
};

const DIFFICULTIES = ["전체", ...DIFFICULTY_OPTIONS];
const PAGE_SIZE = 20;

function ProblemsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [user, setUser] = useState<User | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(true);
  const [isAlgorithmFilterOpen, setIsAlgorithmFilterOpen] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [problemStatusMap, setProblemStatusMap] = useState<
    Map<ProblemId, ProblemStatus>
  >(new Map());
  const [problemStatsMap, setProblemStatsMap] = useState<
    Map<string, ProblemStats>
  >(new Map());
  const [totalSolvedCount, setTotalSolvedCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDifficulty, setDifficulty] = useState("전체");
  const [selectedCategory, setCategory] = useState("전체");
  const [selectedStatus, setStatus] = useState("전체");
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);

  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle URL search query changes
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== searchInput) {
      setSearchInput(q);
    }
  }, [searchInput, searchParams]);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("show_algorithm")
          .eq("id", data.user.id)
          .maybeSingle();

        setShowAlgorithm(
          (profile as UserProfile | null)?.show_algorithm ?? true,
        );
      } else {
        setShowAlgorithm(true);
      }

      try {
        const res = await fetch("/api/problems/categories");
        if (!res.ok) throw new Error("카테고리 목록 조회 실패");
        const cats = await res.json();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (categoryError) {
        setCategories([]);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!showAlgorithm) {
      setCategory("전체");
      setIsAlgorithmFilterOpen(false);
      if (sortField === "tag") {
        setSortField("id");
        setSortOrder("asc");
      }
    }
  }, [showAlgorithm, sortField]);

  useEffect(() => {
    const supabase = createClient();

    const PAGE_SIZE = 1000;

    const CHUNK_SIZE = 300;

    const fetchAllAcceptedSubmissionProblemIds = async () => {
      const allProblemIds: number[] = [];

      let from = 0;

      while (true) {
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from("submissions")
          .select("problem_id")
          .eq("user_id", user!.id)
          .eq("is_deleted", false)
          .in("result", ["AC", "ACCEPTED"])
          .range(from, to);

        if (error) {
          throw error;
        }

        const rows = data ?? [];

        rows.forEach((row) => {
          if (row.problem_id !== null && row.problem_id !== undefined) {
            allProblemIds.push(row.problem_id);
          }
        });

        if (rows.length < PAGE_SIZE) {
          break;
        }

        from += PAGE_SIZE;
      }

      return Array.from(new Set(allProblemIds));
    };

    const fetchPublicProblemIds = async (problemIds: number[]) => {
      const publicProblemIds: number[] = [];

      for (let i = 0; i < problemIds.length; i += CHUNK_SIZE) {
        const chunk = problemIds.slice(i, i + CHUNK_SIZE);

        const { data, error } = await supabase
          .from("problems")
          .select("id")
          .in("id", chunk)
          .eq("is_deleted", false);

        if (error) {
          throw error;
        }

        (data ?? []).forEach((problem) => {
          publicProblemIds.push(problem.id);
        });
      }

      return publicProblemIds;
    };

    const fetchTotalSolvedCount = async () => {
      if (!user) {
        setTotalSolvedCount(0);
        return;
      }

      try {
        const solvedProblemIds = await fetchAllAcceptedSubmissionProblemIds();

        if (solvedProblemIds.length === 0) {
          setTotalSolvedCount(0);
          return;
        }

        const publicSolvedProblemIds =
          await fetchPublicProblemIds(solvedProblemIds);

        setTotalSolvedCount(publicSolvedProblemIds.length);
      } catch (error) {
        setTotalSolvedCount(0);
      }
    };

    fetchTotalSolvedCount();
  }, [user]);

  const fetchProblems = useCallback(async () => {
    setIsFetching(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(PAGE_SIZE),
    });

    if (selectedDifficulty !== "전체")
      params.set("difficulty", selectedDifficulty);
    if (selectedCategory !== "전체") params.set("category", selectedCategory);
    if (selectedStatus !== "전체") params.set("status", selectedStatus);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    try {
      const res = await fetch(`/api/problems?${params}`);
      if (!res.ok) throw new Error("문제 목록 조회 실패");
      const json = await res.json();
      setProblems(json.data ?? []);
      setTotalCount(json.totalCount ?? 0);
      setFilteredCount(json.filteredCount ?? 0);
    } catch (error) {
      setProblems([]);
      setTotalCount(0);
      setFilteredCount(0);
    } finally {
      setIsFetching(false);
    }
  }, [
    currentPage,
    selectedDifficulty,
    selectedCategory,
    selectedStatus,
    debouncedSearch,
  ]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    const supabase = createClient();
    const fetchProblemStatuses = async () => {
      if (!user || problems.length === 0) {
        setProblemStatusMap(new Map());
        return;
      }

      const problemIds = problems.map((p) => p.id);
      const { data, error } = await supabase
        .from("submissions")
        .select("problem_id, result")
        .eq("user_id", user.id)
        .in("problem_id", problemIds);

      if (error) {
        setProblemStatusMap(new Map());
        return;
      }

      const nextStatusMap = new Map<ProblemId, ProblemStatus>();
      problems.forEach((p) => nextStatusMap.set(p.id, "none"));

      const parseProblemId = (value: number | string): number | null => {
        if (typeof value === "number") return value;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
      };

      ((data as SubmissionStatusRow[] | null) ?? []).forEach((s) => {
        const problemId = parseProblemId(s.problem_id);
        if (problemId === null) return;

        const current = nextStatusMap.get(problemId);
        if (current === "solved") return;
        if (isAcceptedResult(s.result)) {
          nextStatusMap.set(problemId, "solved");
          return;
        }
        nextStatusMap.set(problemId, "wrong");
      });

      setProblemStatusMap(nextStatusMap);
    };

    fetchProblemStatuses();
  }, [user, problems]);

  useEffect(() => {
    const fetchProblemStats = async () => {
      if (problems.length === 0) {
        setProblemStatsMap(new Map());
        return;
      }

      const problemIds = problems.map((p) => p.id.toString());
      try {
        const res = await fetch("/api/problems/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemIds }),
        });

        if (!res.ok) throw new Error("문제 통계 조회 실패");
        const json = await res.json();
        const nextStatsMap = new Map<string, ProblemStats>();
        (json.data ?? []).forEach((stats: ProblemStats) => {
          nextStatsMap.set(String(stats.problem_id), stats);
        });
        setProblemStatsMap(nextStatsMap);
      } catch (error) {
        setProblemStatsMap(new Map());
      }
    };
    fetchProblemStats();
  }, [problems]);

  const displayed =
    selectedStatus === "풀었음"
      ? problems.filter((p) => problemStatusMap.get(p.id) === "solved")
      : selectedStatus === "틀렸음"
        ? problems.filter((p) => problemStatusMap.get(p.id) === "wrong")
        : selectedStatus === "안 풀었음"
          ? problems.filter(
              (p) => (problemStatusMap.get(p.id) ?? "none") === "none",
            )
          : problems;

  const sortedDisplayed = useMemo(() => {
    return [...displayed].sort((a, b) => {
      let aVal: SortValue;
      let bVal: SortValue;

      if (sortField === "acceptanceRate") {
        const aStats = problemStatsMap.get(String(a.id));
        const bStats = problemStatsMap.get(String(b.id));
        aVal = aStats?.acceptance_rate ?? -1;
        bVal = bStats?.acceptance_rate ?? -1;
      } else if (sortField === "difficulty") {
        aVal = DIFFICULTY_ORDER[a.difficulty || ""] || 0;
        bVal = DIFFICULTY_ORDER[b.difficulty || ""] || 0;
      } else if (sortField === "tag") {
        aVal = getKoreanTag(a.tag1);
        bVal = getKoreanTag(b.tag1);
      } else if (sortField === "status") {
        const statusOrder: Record<string, number> = {
          solved: 1,
          wrong: 2,
          none: 3,
        };
        aVal = statusOrder[problemStatusMap.get(a.id) ?? "none"];
        bVal = statusOrder[problemStatusMap.get(b.id) ?? "none"];
      } else if (sortField === "title") {
        aVal = a.title;
        bVal = b.title;
      } else {
        aVal = a.id;
        bVal = b.id;
      }

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined)
        return sortOrder === "asc" ? -1 : 1;
      if (bVal === null || bVal === undefined)
        return sortOrder === "asc" ? 1 : -1;

      const res = aVal < bVal ? -1 : 1;
      return sortOrder === "asc" ? res : -res;
    });
  }, [displayed, sortField, sortOrder, problemStatsMap, problemStatusMap]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  const resetFilters = () => {
    setDifficulty("전체");
    setCategory("전체");
    setStatus("전체");
    setSearchInput("");
    setDebouncedSearch("");
    setSortField("id");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  const handleFilterChange = (fn: () => void) => {
    fn();
    setCurrentPage(1);
  };

  const shouldShowAlgorithmFilter =
    showAlgorithm || isAlgorithmFilterOpen || selectedCategory !== "전체";

  return (
    <div className="w-full lg:max-w-360 mx-auto lg:px-24 px-12 pt-8 pb-20 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            문제 목록
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            알고리즘 역량을 키울 수 있는 엄선된 문제들을 만나보세요
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="bg-white dark:bg-[#18181b] border border-[#E2E8F0] dark:border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                총 문제
              </p>
              <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
                {isFetching && totalCount === 0
                  ? "—"
                  : totalCount.toLocaleString()}
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 ml-1">
                  문제
                </span>
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#18181b] border border-[#E2E8F0] dark:border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <Trophy className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                해결한 문제
              </p>
              <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
                {!user ? (
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                    로그인 필요
                  </span>
                ) : (
                  <>
                    {totalSolvedCount.toLocaleString()}
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 ml-1">
                      문제
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#18181b] border border-[#E2E8F0] dark:border-zinc-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 py-5">
        {!showAlgorithm && !shouldShowAlgorithmFilter && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              알고리즘을 선택하면 문제의 풀이 유형을 미리 알 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => setIsAlgorithmFilterOpen(true)}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              알고리즘 기준으로 문제 고르기
            </button>
          </div>
        )}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            shouldShowAlgorithmFilter ? "lg:grid-cols-4" : "lg:grid-cols-3"
          } gap-3`}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              난이도
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) =>
                handleFilterChange(() => setDifficulty(e.target.value))
              }
              className="w-full bg-[#F8FAFC] dark:bg-[#09090b] border border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50 transition cursor-pointer"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {shouldShowAlgorithmFilter && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              알고리즘
            </label>
            <select
              value={selectedCategory}
              onChange={(e) =>
                handleFilterChange(() => setCategory(e.target.value))
              }
              className="w-full bg-[#F8FAFC] dark:bg-[#09090b] border border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50 transition cursor-pointer"
            >
              <option value="전체">전체</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {getKoreanTag(c)}
                </option>
              ))}
            </select>
            {!showAlgorithm && selectedCategory !== "전체" && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                적용 중: {getKoreanTag(selectedCategory)}
              </span>
            )}
          </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              상태
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                handleFilterChange(() => setStatus(e.target.value))
              }
              disabled={!user}
              className="w-full bg-[#F8FAFC] dark:bg-[#09090b] border border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="전체">전체</option>
              <option value="풀었음">풀었음</option>
              <option value="틀렸음">틀렸음</option>
              <option value="안 풀었음">안 풀었음</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              검색
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="문제 제목, 번호 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-[#F8FAFC] dark:bg-[#09090b] border border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 rounded-md pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50 transition placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#18181b] border border-[#E2E8F0] dark:border-zinc-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        {displayed.length === 0 && !isFetching ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              조건에 맞는 문제가 없습니다
            </p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
              필터를 조정해보세요
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <Table className="min-w-210">
            <TableHeader className="bg-[#F8FAFC] dark:bg-zinc-800/30">
              <TableRow className="border-[#E2E8F0] dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="w-20 px-6">
                  <button
                    type="button"
                    className="group flex items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("id")}
                  >
                    #
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      {sortField === "id" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-blue-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                </TableHead>
                <TableHead className="min-w-60">
                  <button
                    type="button"
                    className="group flex items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("title")}
                  >
                    제목
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      {sortField === "title" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-blue-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                </TableHead>
                {showAlgorithm && (
                <TableHead className="min-w-45">
                  <button
                    type="button"
                    className="group flex items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("tag")}
                  >
                    태그
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      {sortField === "tag" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-blue-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                </TableHead>
                )}
                <TableHead className="w-36">
                  <button
                    type="button"
                    className="group flex items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("difficulty")}
                  >
                    난이도
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      {sortField === "difficulty" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-blue-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                </TableHead>
                <TableHead className="w-28 text-right">
                  <button
                    type="button"
                    className="group ml-auto flex items-center justify-end gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("acceptanceRate")}
                  >
                    정답률
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      {sortField === "acceptanceRate" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-blue-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                </TableHead>
                {user && (
                  <TableHead className="w-24 text-center">
                    <button
                      type="button"
                      className="group mx-auto flex items-center justify-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                      onClick={() => handleSort("status")}
                    >
                      상태
                      <span className="opacity-0 transition-opacity group-hover:opacity-100">
                        {sortField === "status" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-blue-500" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-blue-500" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </span>
                    </button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow
                      key={i}
                      className="animate-pulse border-[#E2E8F0] dark:border-zinc-800 hover:bg-transparent"
                    >
                      <TableCell className="px-6">
                        <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      {showAlgorithm && (
                      <TableCell>
                        <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      )}
                      <TableCell>
                        <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      <TableCell>
                        <div className="ml-auto h-4 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      {user && (
                        <TableCell>
                          <div className="mx-auto h-4 w-6 rounded bg-zinc-100 dark:bg-zinc-800" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                : sortedDisplayed.map((problem, i) => {
                    const status = problemStatusMap.get(problem.id) ?? "none";
                    const stats = problemStatsMap.get(String(problem.id));
                    const acceptanceRate =
                      !stats || stats.attempted_users === 0
                        ? "-"
                        : `${stats.acceptance_rate}%`;

                    return (
                      <TableRow
                        key={problem.id}
                        className="group border-[#E2E8F0] dark:border-zinc-800 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/20"
                      >
                        <TableCell className="px-6 text-sm font-medium text-zinc-400 dark:text-zinc-500">
                          {problem.id ?? (currentPage - 1) * PAGE_SIZE + i + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/problems/${problem.id}`}
                            className="block"
                          >
                            <p className="line-clamp-1 text-sm font-semibold text-zinc-800 transition-colors group-hover:text-blue-600 dark:text-zinc-200 dark:group-hover:text-blue-400">
                              {problem.title}
                            </p>
                          </Link>
                        </TableCell>
                        {showAlgorithm && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                              {getKoreanTag(problem.tag1)}
                            </span>
                            {problem.tag2 && (
                              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                {getKoreanTag(problem.tag2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        )}
                        <TableCell>
                          <DifficultyBadge difficulty={problem.difficulty} />
                        </TableCell>
                        <TableCell className="text-right pr-7.5">
                          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            {acceptanceRate}
                          </span>
                        </TableCell>
                        {user && (
                          <TableCell>
                            <div className="flex justify-center">
                              <StatusIcon
                                result={
                                  status === "solved"
                                    ? "AC"
                                    : status === "wrong"
                                      ? "WA"
                                      : null
                                }
                              />
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        )}

        {!isFetching && filteredCount > 0 && (
          <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] lg:px-4 px-0 py-4 dark:border-zinc-800 dark:bg-zinc-800/30 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="whitespace-nowrap text-center text-xs text-zinc-500 dark:text-zinc-400 sm:text-left">
                총{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {filteredCount.toLocaleString()}
                </span>
                개 문제
              </p>

              <div className="w-full min-w-0 overflow-x-auto sm:w-auto">
                <div className="mx-auto flex w-max items-center justify-center gap-1 sm:mx-0">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 sm:inline-flex"
                    aria-label="첫 페이지로 이동"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    aria-label="이전 페이지로 이동"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    {(() => {
                      const pages: number[] = [];
                      const windowSize = 5;

                      let start = Math.max(
                        1,
                        currentPage - Math.floor(windowSize / 2),
                      );
                      const end = Math.min(
                        totalPages,
                        start + windowSize - 1,
                      );

                      start = Math.max(1, end - windowSize + 1);

                      for (let page = start; page <= end; page++) {
                        pages.push(page);
                      }

                      return pages.map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          aria-current={
                            currentPage === page ? "page" : undefined
                          }
                          className={`h-8 min-w-8 shrink-0 rounded-md px-2 text-sm font-medium transition ${
                            currentPage === page
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    aria-label="다음 페이지로 이동"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 sm:inline-flex"
                    aria-label="마지막 페이지로 이동"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#09090b]">
      <Suspense
        fallback={
          <div className="mx-auto flex min-h-96 w-full items-center justify-center px-6 pt-8 pb-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        }
      >
        <ProblemsContent />
      </Suspense>
    </div>
  );
}
