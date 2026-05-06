"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Problem } from "@/types/problem";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Trophy,
  BarChart2,
} from "lucide-react";
import {
  DifficultyBadge,
  isAcceptedResult,
  StatusIcon
} from "@/components/problem/ProblemComponents";

type ProblemStatus = "solved" | "wrong" | "none";

type ProblemId = Problem["id"];

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

const DIFFICULTIES = ["전체", "Easy", "Medium", "Medium-Hard", "Hard"];
const PAGE_SIZE = 20;

function ProblemsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [user, setUser] = useState<any>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [problemStatusMap, setProblemStatusMap] = useState<Map<ProblemId, ProblemStatus>>(new Map());
  const [problemStatsMap, setProblemStatsMap] = useState<Map<string, ProblemStats>>(new Map());
  const [totalSolvedCount, setTotalSolvedCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDifficulty, setDifficulty] = useState("전체");
  const [selectedCategory, setCategory] = useState("전체");
  const [selectedStatus, setStatus] = useState("전체");
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);

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
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("유저 조회 실패:", error);
      }
      setUser(data.user);

      try {
        const res = await fetch("/api/problems/categories");
        if (!res.ok) throw new Error("카테고리 목록 조회 실패");
        const cats = await res.json();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (categoryError) {
        console.error("카테고리 목록 조회 실패:", categoryError);
        setCategories([]);
      }
    };
    init();
  }, []);

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
          console.error("정답 제출 문제 조회 실패:", error);
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
          .eq("is_deleted", false)
          .eq("is_hidden", false);

        if (error) {
          console.error("공개 해결 문제 조회 실패:", error);
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

        const publicSolvedProblemIds = await fetchPublicProblemIds(solvedProblemIds);

        setTotalSolvedCount(publicSolvedProblemIds.length);
      } catch (error) {
        console.error("전체 해결 문제 수 계산 실패:", error);
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

    if (selectedDifficulty !== "전체") params.set("difficulty", selectedDifficulty);
    if (selectedCategory !== "전체") params.set("category", selectedCategory);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    try {
      const res = await fetch(`/api/problems?${params}`);
      if (!res.ok) throw new Error("문제 목록 조회 실패");
      const json = await res.json();
      setProblems(json.data ?? []);
      setTotalCount(json.totalCount ?? 0);
      setFilteredCount(json.filteredCount ?? 0);
    } catch (error) {
      console.error("문제 목록 조회 실패:", error);
      setProblems([]);
      setTotalCount(0);
      setFilteredCount(0);
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, selectedDifficulty, selectedCategory, debouncedSearch]);

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
        console.error("문제별 제출 상태 조회 실패:", error);
        setProblemStatusMap(new Map());
        return;
      }

      const nextStatusMap = new Map<ProblemId, ProblemStatus>();
      problems.forEach((p) => nextStatusMap.set(p.id, "none"));

      ((data as SubmissionStatusRow[] | null) ?? []).forEach((s) => {
        const current = nextStatusMap.get(s.problem_id);
        if (current === "solved") return;
        if (isAcceptedResult(s.result)) {
          nextStatusMap.set(s.problem_id, "solved");
          return;
        }
        nextStatusMap.set(s.problem_id, "wrong");
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
        console.error("문제 통계 조회 실패:", error);
        setProblemStatsMap(new Map());
      }
    };
    fetchProblemStats();
  }, [problems]);

  const displayed = selectedStatus === "풀었음"
    ? problems.filter((p) => problemStatusMap.get(p.id) === "solved")
    : selectedStatus === "틀렸음"
      ? problems.filter((p) => problemStatusMap.get(p.id) === "wrong")
      : selectedStatus === "안 풀었음"
        ? problems.filter((p) => (problemStatusMap.get(p.id) ?? "none") === "none")
        : problems;

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  const resetFilters = () => {
    setDifficulty("전체");
    setCategory("전체");
    setStatus("전체");
    setSearchInput("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const handleFilterChange = (fn: () => void) => {
    fn();
    setCurrentPage(1);
  };

  return (
    <div className="w-full mx-auto px-6 pt-8 pb-20 space-y-6">
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">총 문제</p>
              <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
                {isFetching && totalCount === 0 ? "—" : totalCount.toLocaleString()}
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 ml-1">문제</span>
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#18181b] border border-[#E2E8F0] dark:border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <Trophy className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">해결한 문제</p>
              <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
                {!user ? (
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">로그인 필요</span>
                ) : (
                  <>
                    {totalSolvedCount.toLocaleString()}
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 ml-1">문제</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#18181b] border border-[#E2E8F0] dark:border-zinc-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">난이도</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => handleFilterChange(() => setDifficulty(e.target.value))}
              className="w-full bg-[#F8FAFC] dark:bg-[#09090b] border border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50 transition cursor-pointer"
            >
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">카테고리</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange(() => setCategory(e.target.value))}
              className="w-full bg-[#F8FAFC] dark:bg-[#09090b] border border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50 transition cursor-pointer"
            >
              <option value="전체">전체</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">상태</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange(() => setStatus(e.target.value))}
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
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">검색</label>
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
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F8FAFC] dark:bg-zinc-800/30 border-b border-[#E2E8F0] dark:border-zinc-800">
          <div className="col-span-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">#</div>
          <div className={`${user ? "col-span-5" : "col-span-6"} text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide`}>제목</div>
          <div className="col-span-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">카테고리</div>
          <div className="col-span-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">난이도</div>
          <div className="col-span-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide text-right">정답률</div>
          {user && <div className="col-span-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide text-center">상태</div>}
        </div>

        {isFetching ? (
          <div className="divide-y divide-[#E2E8F0] dark:divide-zinc-800">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
                <div className="col-span-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className={`${user ? "col-span-5" : "col-span-6"} h-4 bg-zinc-100 dark:bg-zinc-800 rounded`} />
                <div className="col-span-2 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="col-span-2 h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-16" />
                <div className="col-span-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                {user && <div className="col-span-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />}
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">조건에 맞는 문제가 없습니다</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">필터를 조정해보세요</p>
            <button onClick={resetFilters} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-zinc-800">
            {displayed.map((problem, i) => {
              const status = problemStatusMap.get(problem.id) ?? "none";
              const stats = problemStatsMap.get(String(problem.id));
              const acceptanceRate = !stats || stats.attempted_users === 0 ? "-" : `${stats.acceptance_rate}%`;

              return (
                <div key={problem.id} className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/20 transition-colors border-b border-[#E2E8F0] dark:border-zinc-800 last:border-0">
                  <div className="col-span-1 text-sm text-zinc-400 dark:text-zinc-500 font-medium">
                    {problem.problem_no ?? (currentPage - 1) * PAGE_SIZE + i + 1}
                  </div>
                  <div className={user ? "col-span-5" : "col-span-6"}>
                    <Link href={`/problems/${problem.id}`} className="block">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {problem.title}
                      </p>
                    </Link>
                  </div>
                  <div className="col-span-2">
                    {problem.category ? (
                      <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full font-medium">
                        {problem.category}
                      </span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700 text-xs">—</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{acceptanceRate}</span>
                  </div>
                  {user && (
                    <div className="col-span-1 flex justify-center">
                      <StatusIcon result={status === "solved" ? "AC" : status === "wrong" ? "WA" : null} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isFetching && totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] dark:bg-zinc-800/30 border-t border-[#E2E8F0] dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              총 <span className="font-semibold text-zinc-700 dark:text-zinc-300">{filteredCount.toLocaleString()}</span>개 문제
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const win = 5;
                  let s = Math.max(1, currentPage - Math.floor(win / 2));
                  const e = Math.min(totalPages, s + win - 1);
                  s = Math.max(1, e - win + 1);
                  for (let p = s; p <= e; p++) pages.push(p);
                  return pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 text-sm rounded-md font-medium transition ${currentPage === p ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                    >
                      {p}
                    </button>
                  ));
                })()}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
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
      <Suspense fallback={
        <div className="w-full mx-auto px-6 pt-8 pb-20 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }>
        <ProblemsContent />
      </Suspense>
    </div>
  );
}
