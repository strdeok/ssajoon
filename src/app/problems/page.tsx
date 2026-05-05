"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Problem } from "@/types/problem";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Trophy,
  CheckCircle2,
  XCircle,
  Circle,
  BarChart2,
} from "lucide-react";

type ProblemStatus = "solved" | "wrong" | "none";

type ProblemId = Problem["id"];

type SubmissionStatusRow = {
  problem_id: ProblemId;
  result: string | null;
};

const DIFFICULTY_MAP: Record<
  string,
  { label: string; cls: string; bg: string }
> = {
  EASY: {
    label: "Easy",
    cls: "text-emerald-700",
    bg: "bg-emerald-50 border border-emerald-200",
  },
  Easy: {
    label: "Easy",
    cls: "text-emerald-700",
    bg: "bg-emerald-50 border border-emerald-200",
  },
  MEDIUM: {
    label: "Medium",
    cls: "text-amber-700",
    bg: "bg-amber-50 border border-amber-200",
  },
  Medium: {
    label: "Medium",
    cls: "text-amber-700",
    bg: "bg-amber-50 border border-amber-200",
  },
  MEDIUM_HARD: {
    label: "Medium-Hard",
    cls: "text-orange-700",
    bg: "bg-orange-50 border border-orange-200",
  },
  "Medium Hard": {
    label: "Medium-Hard",
    cls: "text-orange-700",
    bg: "bg-orange-50 border border-orange-200",
  },
  "Medium-Hard": {
    label: "Medium-Hard",
    cls: "text-orange-700",
    bg: "bg-orange-50 border border-orange-200",
  },
  HARD: {
    label: "Hard",
    cls: "text-red-700",
    bg: "bg-red-50 border border-red-200",
  },
  Hard: {
    label: "Hard",
    cls: "text-red-700",
    bg: "bg-red-50 border border-red-200",
  },
};

const DIFFICULTIES = ["전체", "Easy", "Medium", "Medium-Hard", "Hard"];

const PAGE_SIZE = 20;

function isAcceptedResult(result: string | null) {
  return result === "AC" || result === "ACCEPTED";
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return <span className="text-zinc-300 text-xs">—</span>;

  const d = DIFFICULTY_MAP[difficulty];

  if (!d) return <span className="text-xs text-zinc-500">{difficulty}</span>;

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${d.cls} ${d.bg}`}
    >
      {d.label}
    </span>
  );
}

export default function ProblemsPage() {
  const [user, setUser] = useState<any>(null);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [isFetching, setIsFetching] = useState(true);

  const [categories, setCategories] = useState<string[]>([]);

  const [problemStatusMap, setProblemStatusMap] = useState<
    Map<ProblemId, ProblemStatus>
  >(new Map());
  const [totalSolvedCount, setTotalSolvedCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDifficulty, setDifficulty] = useState("전체");
  const [selectedCategory, setCategory] = useState("전체");
  const [selectedStatus, setStatus] = useState("전체");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

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

        if (!res.ok) {
          throw new Error("카테고리 목록 조회 실패");
        }

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

    const fetchTotalSolvedCount = async () => {
      if (!user) {
        setTotalSolvedCount(0);
        return;
      }

      const { data, error } = await supabase
        .from("submissions")
        .select("problem_id")
        .eq("user_id", user.id)
        .in("result", ["AC", "ACCEPTED"]);

      if (error) {
        console.error("전체 해결 문제 수 조회 실패:", error);
        setTotalSolvedCount(0);
        return;
      }

      const uniqueSolvedProblemIds = new Set(
        (data ?? []).map((row) => row.problem_id),
      );

      setTotalSolvedCount(uniqueSolvedProblemIds.size);
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
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    try {
      const res = await fetch(`/api/problems?${params}`);

      if (!res.ok) {
        throw new Error("문제 목록 조회 실패");
      }

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
      if (!user) {
        setProblemStatusMap(new Map());
        return;
      }

      if (problems.length === 0) {
        setProblemStatusMap(new Map());
        return;
      }

      const problemIds = problems.map((problem) => problem.id);

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

      problems.forEach((problem) => {
        nextStatusMap.set(problem.id, "none");
      });

      ((data as SubmissionStatusRow[] | null) ?? []).forEach((submission) => {
        const currentStatus = nextStatusMap.get(submission.problem_id);

        if (currentStatus === "solved") return;

        if (isAcceptedResult(submission.result)) {
          nextStatusMap.set(submission.problem_id, "solved");
          return;
        }

        nextStatusMap.set(submission.problem_id, "wrong");
      });

      setProblemStatusMap(nextStatusMap);
    };

    fetchProblemStatuses();
  }, [user, problems]);

  const displayed =
    selectedStatus === "풀었음"
      ? problems.filter(
          (problem) => problemStatusMap.get(problem.id) === "solved",
        )
      : selectedStatus === "틀렸음"
        ? problems.filter(
            (problem) => problemStatusMap.get(problem.id) === "wrong",
          )
        : selectedStatus === "안 풀었음"
          ? problems.filter(
              (problem) =>
                (problemStatusMap.get(problem.id) ?? "none") === "none",
            )
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
    <div className="min-h-screen bg-[#F7F9FC]">
      {" "}
      <div className="w-full mx-auto px-6 pt-8 pb-20 space-y-6">
        {" "}
        <div className="flex items-end justify-between">
          {" "}
          <div>
            {" "}
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {" "}
              문제 목록
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5">
              {" "}
              알고리즘 역량을 키울 수 있는 엄선된 문제들을 만나보세요{" "}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {" "}
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">총 문제</p>
                <p className="text-xl font-extrabold text-zinc-900 leading-tight">
                  {isFetching && totalCount === 0
                    ? "—"
                    : totalCount.toLocaleString()}
                  <span className="text-xs font-medium text-zinc-400 ml-1">
                    문제
                  </span>
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              {" "}
              <div className="p-2 bg-emerald-50 rounded-lg">
                {" "}
                <Trophy className="w-4 h-4 text-emerald-500" />{" "}
              </div>
              <div>
                {" "}
                <p className="text-xs text-zinc-500 font-medium">
                  해결한 문제
                </p>{" "}
                <p className="text-xl font-extrabold text-zinc-900 leading-tight">
                  {" "}
                  {!user ? (
                    <span className="text-zinc-400 text-sm font-medium">
                      로그인 필요
                    </span>
                  ) : (
                    <>
                      {" "}
                      {totalSolvedCount.toLocaleString()}{" "}
                      <span className="text-xs font-medium text-zinc-400 ml-1">
                        문제
                      </span>{" "}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 py-5">
          {" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {" "}
            <div className="flex flex-col gap-1.5">
              {" "}
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                난이도
              </label>{" "}
              <select
                value={selectedDifficulty}
                onChange={(e) =>
                  handleFilterChange(() => setDifficulty(e.target.value))
                }
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-zinc-800 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition cursor-pointer"
              >
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {" "}
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              {" "}
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                카테고리
              </label>{" "}
              <select
                value={selectedCategory}
                onChange={(e) =>
                  handleFilterChange(() => setCategory(e.target.value))
                }
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-zinc-800 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition cursor-pointer"
              >
                <option value="전체">전체</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {" "}
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              {" "}
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                상태
              </label>{" "}
              <select
                value={selectedStatus}
                onChange={(e) =>
                  handleFilterChange(() => setStatus(e.target.value))
                }
                disabled={!user}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-zinc-800 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="전체">전체</option>
                <option value="풀었음">풀었음</option>
                <option value="틀렸음">틀렸음</option>
                <option value="안 풀었음">안 풀었음</option>{" "}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              {" "}
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                검색
              </label>{" "}
              <div className="relative">
                {" "}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />{" "}
                <input
                  type="text"
                  placeholder="문제 제목, 번호 검색"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-zinc-800 rounded-md pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition placeholder:text-zinc-400"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          {" "}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {" "}
            <div className="col-span-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              #
            </div>{" "}
            {user && (
              <div className="col-span-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-center">
                상태
              </div>
            )}{" "}
            <div
              className={`${user ? "col-span-5" : "col-span-6"} text-xs font-semibold text-zinc-500 uppercase tracking-wide`}
            >
              제목
            </div>{" "}
            <div className="col-span-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              카테고리
            </div>{" "}
            <div className="col-span-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              난이도
            </div>{" "}
            <div className="col-span-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-right">
              풀기
            </div>{" "}
          </div>
          {isFetching ? (
            <div className="divide-y divide-[#E2E8F0]">
              {" "}
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse"
                >
                  {" "}
                  <div className="col-span-1 h-4 bg-zinc-100 rounded" />{" "}
                  {user && (
                    <div className="col-span-1 h-4 bg-zinc-100 rounded" />
                  )}{" "}
                  <div
                    className={`${user ? "col-span-5" : "col-span-6"} h-4 bg-zinc-100 rounded`}
                  />{" "}
                  <div className="col-span-2 h-4 bg-zinc-100 rounded" />{" "}
                  <div className="col-span-2 h-4 bg-zinc-100 rounded w-16" />{" "}
                  <div className="col-span-1 h-4 bg-zinc-100 rounded" />{" "}
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-20 text-center">
              {" "}
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                {" "}
                <BarChart2 className="w-8 h-8 text-zinc-300" />{" "}
              </div>
              <p className="text-zinc-500 font-medium">
                조건에 맞는 문제가 없습니다
              </p>{" "}
              <p className="text-zinc-400 text-sm mt-1">필터를 조정해보세요</p>{" "}
              <button
                onClick={resetFilters}
                className="mt-4 text-sm text-blue-600 hover:underline font-medium"
              >
                {" "}
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {" "}
              {displayed.map((problem, index) => {
                const problemStatus =
                  problemStatusMap.get(problem.id) ?? "none";

                return (
                  <Link
                    key={problem.id}
                    href={`/problems/${problem.id}`}
                    className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="col-span-1 text-sm text-zinc-400 font-medium">
                      {" "}
                      {problem.problem_no ??
                        (currentPage - 1) * PAGE_SIZE + index + 1}{" "}
                    </div>

                    {user && (
                      <div className="col-span-1 flex justify-center">
                        {" "}
                        {problemStatus === "solved" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : problemStatus === "wrong" ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-300" />
                        )}
                      </div>
                    )}

                    <div className={user ? "col-span-5" : "col-span-6"}>
                      {" "}
                      <p className="text-sm font-semibold text-zinc-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {" "}
                        {problem.title}
                      </p>
                    </div>

                    <div className="col-span-2">
                      {" "}
                      {problem.category ? (
                        <span className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">
                          {" "}
                          {problem.category}
                        </span>
                      ) : (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {" "}
                      <DifficultyBadge difficulty={problem.difficulty} />{" "}
                    </div>

                    <div className="col-span-1 flex justify-end">
                      {" "}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700 bg-blue-50 group-hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all">
                        {" "}
                        풀기
                        <ChevronRight className="w-3 h-3" />{" "}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {!isFetching && totalCount > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
              {" "}
              <p className="text-xs text-zinc-500">
                {" "}
                총{" "}
                <span className="font-semibold text-zinc-700">
                  {isFetching ? "—" : filteredCount.toLocaleString()}
                </span>
                개 문제
              </p>
              <div className="flex items-center gap-2">
                {" "}
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {" "}
                  {(() => {
                    const pages: number[] = [];
                    const windowSize = 5;
                    let start = Math.max(
                      1,
                      currentPage - Math.floor(windowSize / 2),
                    );
                    const end = Math.min(totalPages, start + windowSize - 1);
                    start = Math.max(1, end - windowSize + 1);

                    for (let page = start; page <= end; page += 1) {
                      pages.push(page);
                    }

                    return pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-sm rounded-md font-medium transition ${currentPage === page ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100"}`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <footer className="border-t border-[#E2E8F0] bg-white">
        {" "}
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {" "}
          <div>
            {" "}
            <p className="text-sm font-semibold text-zinc-800">
              싸준 (SSAJUN)
            </p>{" "}
            <p className="text-xs text-zinc-400 mt-0.5">
              © 2024 싸준 (SSAJUN). All rights reserved.
            </p>{" "}
          </div>
          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            {" "}
            <Link
              href="/problems"
              className="hover:text-zinc-800 transition-colors font-medium text-zinc-800"
            >
              문제
            </Link>{" "}
            <Link
              href="/generate"
              className="hover:text-zinc-800 transition-colors"
            >
              AI 생성
            </Link>{" "}
            <Link
              href="/submissions"
              className="hover:text-zinc-800 transition-colors"
            >
              제출
            </Link>{" "}
          </nav>
        </div>
      </footer>
    </div>
  );
}
