"use client";

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
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
  StatusIcon,
} from "@/components/problem/ProblemComponents";
import {
  getKoreanTag,
  DIFFICULTY_OPTIONS,
} from "@/utils/tagUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownSelect } from "@/components/ui/dropdown-select";

type ProblemStatus = "solved" | "wrong" | "none";

type ProblemId = Problem["id"];
type SortField =
  | "id"
  | "title"
  | "difficulty"
  | "tag1"
  | "tag2"
  | "created_at"
  | "attemptedUsers"
  | "solvedUsers"
  | "acceptanceRate"
  | "status";
type SortOrder = "asc" | "desc";

type ProblemStats = {
  problem_id: string | number;
  attemptedUsers: number;
  solvedUsers: number;
  total_submissions: number;
  accepted_submissions: number;
  acceptanceRate: number;
};

type ProblemListItem = Problem & {
  attemptedUsers?: number;
  solvedUsers?: number;
  acceptanceRate?: number;
  filteredCount?: number;
  isSolved?: boolean;
  userStatus?: ProblemStatus;
};

type ProblemsResponse = {
  data: ProblemListItem[];
  totalCount: number;
  filteredCount: number;
};

type SolvedProblemsResponse = {
  solvedProblemIds: number[];
};

type ProblemStatusesResponse = {
  solvedProblemIds: number[];
  attemptedProblemIds: number[];
  wrongProblemIds: number[];
};

type UserProfile = {
  show_algorithm?: boolean | null;
};

const DIFFICULTIES = ["전체", ...DIFFICULTY_OPTIONS];
const PAGE_SIZE = 20;
const DEFAULT_SORT: SortField = "id";
const DEFAULT_ORDER: SortOrder = "asc";
const SORT_DEFAULT_ORDERS: Record<SortField, SortOrder> = {
  id: "asc",
  title: "asc",
  difficulty: "asc",
  tag1: "asc",
  tag2: "asc",
  created_at: "desc",
  attemptedUsers: "desc",
  solvedUsers: "desc",
  acceptanceRate: "desc",
  status: "asc",
};

const isSortField = (value: string | null): value is SortField =>
  value === "id" ||
  value === "title" ||
  value === "difficulty" ||
  value === "tag1" ||
  value === "tag2" ||
  value === "created_at" ||
  value === "attemptedUsers" ||
  value === "solvedUsers" ||
  value === "acceptanceRate" ||
  value === "status";

const normalizeSort = (value: string | null): SortField =>
  isSortField(value) ? value : DEFAULT_SORT;

const normalizeOrder = (value: string | null): SortOrder =>
  value === "desc" ? "desc" : DEFAULT_ORDER;

const parsePage = (value: string | null) => {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const getSortIconClassName = (isActive: boolean) =>
  isActive
    ? "opacity-100"
    : "opacity-0 transition-opacity group-hover:opacity-100";

function ProblemsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  const urlSearchQuery = searchParams.get("search") || searchParams.get("q") || "";

  const [user, setUser] = useState<User | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(true);
  const [isAlgorithmFilterOpen, setIsAlgorithmFilterOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(() =>
    parsePage(searchParams.get("page")),
  );
  const [selectedDifficulty, setDifficulty] = useState(
    () => searchParams.get("difficulty") || "전체",
  );
  const [selectedCategory, setCategory] = useState(
    () => searchParams.get("category") || "전체",
  );
  const [selectedStatus, setStatus] = useState(
    () => searchParams.get("status") || "전체",
  );
  const [searchInput, setSearchInput] = useState(urlSearchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearchQuery);

  const [sortField, setSortField] = useState<SortField>(() =>
    normalizeSort(searchParams.get("sort")),
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(() =>
    normalizeOrder(searchParams.get("order")),
  );

  const handleSort = (field: SortField) => {
    const nextOrder =
      sortField === field
        ? sortOrder === "asc"
          ? "desc"
          : "asc"
        : SORT_DEFAULT_ORDERS[field];
    const params = new URLSearchParams(searchParams);

    params.set("page", "1");
    params.set("sort", field);
    params.set("order", nextOrder);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setCurrentPage(1);
    setSortField(field);
    setSortOrder(nextOrder);
  };

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const updateQueryParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParamsRef.current);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "전체") {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(totalPages, Math.max(1, page));
    const params = new URLSearchParams(searchParams);

    params.set("page", String(nextPage));
    params.set("sort", sortField);
    params.set("order", sortOrder);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setCurrentPage(nextPage);
  };

  useEffect(() => {
    const nextPage = parsePage(searchParams.get("page"));
    const nextSort = normalizeSort(searchParams.get("sort"));
    const nextOrder = normalizeOrder(searchParams.get("order"));
    const nextDifficulty = searchParams.get("difficulty") || "전체";
    const nextCategory = searchParams.get("category") || "전체";
    const nextStatus = searchParams.get("status") || "전체";

    setCurrentPage(nextPage);
    setSortField(nextSort);
    setSortOrder(nextOrder);
    setDifficulty(nextDifficulty);
    setCategory(nextCategory);
    setStatus(nextStatus);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
      updateQueryParams({
        page: "1",
        search: searchInput.trim() || null,
        sort: sortField,
        order: sortOrder,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, sortField, sortOrder, updateQueryParams]);

  useEffect(() => {
    setSearchInput(urlSearchQuery);
    setDebouncedSearch(urlSearchQuery);
    setCurrentPage(1);
  }, [urlSearchQuery]);

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
      } catch {
        setCategories([]);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!showAlgorithm) {
      setCategory("전체");
      setIsAlgorithmFilterOpen(false);
      if (sortField === "tag1") {
        setSortField("id");
        setSortOrder("asc");
        updateQueryParams({ page: "1", sort: "id", order: "asc" });
      }
    }
  }, [showAlgorithm, sortField, updateQueryParams]);

  const solvedProblemsQuery = useQuery({
    queryKey: ["user", user?.id, "solved-problems"],
    queryFn: async () => {
      const response = await fetch("/api/me/solved-problems", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("해결한 문제 목록 조회 실패");
      }

      return (await response.json()) as SolvedProblemsResponse;
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  const problemStatusesQuery = useQuery({
    queryKey: ["user", user?.id, "problem-statuses"],
    queryFn: async () => {
      const response = await fetch("/api/me/problem-statuses", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("문제 풀이 상태 조회 실패");
      }

      return (await response.json()) as ProblemStatusesResponse;
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  const solvedProblemIds = useMemo(
    () => solvedProblemsQuery.data?.solvedProblemIds ?? [],
    [solvedProblemsQuery.data?.solvedProblemIds],
  );
  const attemptedProblemIds = useMemo(
    () => problemStatusesQuery.data?.attemptedProblemIds ?? [],
    [problemStatusesQuery.data?.attemptedProblemIds],
  );
  const wrongProblemIds = useMemo(
    () => problemStatusesQuery.data?.wrongProblemIds ?? [],
    [problemStatusesQuery.data?.wrongProblemIds],
  );

  const solvedSet = useMemo(
    () => new Set<ProblemId>(solvedProblemIds),
    [solvedProblemIds],
  );
  const wrongSet = useMemo(
    () => new Set<ProblemId>(wrongProblemIds),
    [wrongProblemIds],
  );

  const statusProblemIds = useMemo(() => {
    if (!user || selectedStatus === "전체") return null;
    if (selectedStatus === "풀었음") return solvedProblemIds;
    if (selectedStatus === "틀렸음") return wrongProblemIds;
    return null;
  }, [selectedStatus, solvedProblemIds, user, wrongProblemIds]);

  const excludedStatusProblemIds = useMemo(() => {
    if (!user || selectedStatus !== "안 풀었음") return null;
    return attemptedProblemIds;
  }, [attemptedProblemIds, selectedStatus, user]);

  const shouldReturnEmptyProblems =
    Boolean(user) &&
    (selectedStatus === "풀었음" || selectedStatus === "틀렸음") &&
    statusProblemIds !== null &&
    statusProblemIds.length === 0;

  const isWaitingForStatusFilter =
    Boolean(user) &&
    (selectedStatus !== "전체" || sortField === "status") &&
    problemStatusesQuery.isLoading;
  const isUserStatusFiltered =
    Boolean(user) && (selectedStatus !== "전체" || sortField === "status");

  const problemsQuery = useQuery({
    queryKey: isUserStatusFiltered
      ? [
          "user",
          user?.id,
          "filtered-problems",
          {
            page: currentPage,
            pageSize: PAGE_SIZE,
            difficulty: selectedDifficulty,
            tag1: selectedCategory,
            search: debouncedSearch.trim(),
            sort: sortField,
            order: sortOrder,
            status: selectedStatus,
            problemIds: statusProblemIds,
            excludedProblemIds: excludedStatusProblemIds,
          },
        ]
      : [
          "problems",
          {
            page: currentPage,
            pageSize: PAGE_SIZE,
            difficulty: selectedDifficulty,
            category: selectedCategory,
            search: debouncedSearch.trim(),
            sort: sortField,
            order: sortOrder,
          },
    ],
    queryFn: async () => {
      if (shouldReturnEmptyProblems) {
        return { data: [], totalCount: 0, filteredCount: 0 } satisfies ProblemsResponse;
      }

      const createProblemParams = ({
        page,
        pageSize,
        sort,
        order,
        problemIds,
        excludedProblemIds,
      }: {
        page: number;
        pageSize: number;
        sort: Exclude<SortField, "status">;
        order: SortOrder;
        problemIds?: number[] | null;
        excludedProblemIds?: number[] | null;
      }) => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          sort,
          order,
        });

        if (selectedDifficulty !== "전체") {
          params.set("difficulty", selectedDifficulty);
        }
        if (selectedCategory !== "전체") {
          params.set("category", selectedCategory);
        }
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        if (problemIds && problemIds.length > 0) {
          params.set("problemIds", problemIds.join(","));
        }
        if (excludedProblemIds && excludedProblemIds.length > 0) {
          params.set("excludedProblemIds", excludedProblemIds.join(","));
        }

        return params;
      };

      const fetchProblemsPage = async (params: URLSearchParams) => {
        const response = await fetch(`/api/problems?${params.toString()}`);
        if (!response.ok) {
          throw new Error("문제 목록 조회 실패");
        }

        return (await response.json()) as ProblemsResponse;
      };

      const apiSort: Exclude<SortField, "status"> =
        sortField === "status" ? "id" : sortField;

      if (sortField === "status" && user && selectedStatus === "전체") {
        const statusGroups =
          sortOrder === "asc"
            ? [
                { problemIds: solvedProblemIds, excludedProblemIds: null },
                { problemIds: wrongProblemIds, excludedProblemIds: null },
                { problemIds: null, excludedProblemIds: attemptedProblemIds },
              ]
            : [
                { problemIds: null, excludedProblemIds: attemptedProblemIds },
                { problemIds: wrongProblemIds, excludedProblemIds: null },
                { problemIds: solvedProblemIds, excludedProblemIds: null },
              ];

        const countResults = await Promise.all(
          statusGroups.map((group) => {
            if (group.problemIds && group.problemIds.length === 0) {
              return Promise.resolve({
                data: [],
                totalCount: 0,
                filteredCount: 0,
              } satisfies ProblemsResponse);
            }

            return fetchProblemsPage(
              createProblemParams({
                page: 1,
                pageSize: 1,
                sort: "id",
                order: "asc",
                problemIds: group.problemIds,
                excludedProblemIds: group.excludedProblemIds,
              }),
            );
          }),
        );

        const groupCounts = countResults.map((result) => result.filteredCount);
        const totalFilteredCount = groupCounts.reduce(
          (sum, count) => sum + count,
          0,
        );
        const pageStart = (currentPage - 1) * PAGE_SIZE;
        let cursor = 0;
        const pageProblems: ProblemListItem[] = [];

        for (let index = 0; index < statusGroups.length; index += 1) {
          const group = statusGroups[index];
          const groupCount = groupCounts[index];
          const groupStart = cursor;
          const groupEnd = cursor + groupCount;

          cursor = groupEnd;

          if (
            pageProblems.length >= PAGE_SIZE ||
            pageStart + PAGE_SIZE <= groupStart ||
            pageStart >= groupEnd
          ) {
            continue;
          }

          let groupOffset = Math.max(0, pageStart - groupStart);
          let remaining = Math.min(
            PAGE_SIZE - pageProblems.length,
            groupCount - groupOffset,
          );
          const groupPageSize = 100;

          while (remaining > 0) {
            const groupPage = Math.floor(groupOffset / groupPageSize) + 1;
            const offsetInPage = groupOffset % groupPageSize;
            const groupResult = await fetchProblemsPage(
              createProblemParams({
                page: groupPage,
                pageSize: groupPageSize,
                sort: "id",
                order: "asc",
                problemIds: group.problemIds,
                excludedProblemIds: group.excludedProblemIds,
              }),
            );
            const slice = groupResult.data.slice(
              offsetInPage,
              offsetInPage + remaining,
            );

            pageProblems.push(...slice);

            if (slice.length === 0) break;

            groupOffset += slice.length;
            remaining -= slice.length;
          }
        }

        return {
          data: pageProblems,
          totalCount: totalFilteredCount,
          filteredCount: totalFilteredCount,
        } satisfies ProblemsResponse;
      }

      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
        sort: apiSort,
        order: sortOrder,
      });

      if (selectedDifficulty !== "전체") {
        params.set("difficulty", selectedDifficulty);
      }
      if (selectedCategory !== "전체") {
        params.set("category", selectedCategory);
      }
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (statusProblemIds && statusProblemIds.length > 0) {
        params.set("problemIds", statusProblemIds.join(","));
      }
      if (excludedStatusProblemIds && excludedStatusProblemIds.length > 0) {
        params.set("excludedProblemIds", excludedStatusProblemIds.join(","));
      }

      const response = await fetch(`/api/problems?${params.toString()}`);
      if (!response.ok) {
        throw new Error("문제 목록 조회 실패");
      }

      return (await response.json()) as ProblemsResponse;
    },
    enabled: !isWaitingForStatusFilter,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const problems = useMemo(
    () => problemsQuery.data?.data ?? [],
    [problemsQuery.data?.data],
  );
  const totalCount = problemsQuery.data?.totalCount ?? 0;
  const filteredCount = problemsQuery.data?.filteredCount ?? 0;
  const isFetching = problemsQuery.isLoading || isWaitingForStatusFilter;

  const problemStatsMap = useMemo(() => {
    const statsMap = new Map<string, ProblemStats>();

    problems.forEach((problem) => {
      if (
        problem.attemptedUsers !== undefined &&
        problem.solvedUsers !== undefined &&
        problem.acceptanceRate !== undefined
      ) {
        statsMap.set(String(problem.id), {
          problem_id: problem.id,
          attemptedUsers: problem.attemptedUsers,
          solvedUsers: problem.solvedUsers,
          total_submissions: 0,
          accepted_submissions: 0,
          acceptanceRate: problem.acceptanceRate,
        });
      }
    });

    return statsMap;
  }, [problems]);

  const displayed = useMemo(
    () =>
      problems.map((problem) => {
        const isSolved = solvedSet.has(problem.id);
        const userStatus: ProblemStatus = isSolved
          ? "solved"
          : wrongSet.has(problem.id)
            ? "wrong"
            : "none";

        return {
          ...problem,
          isSolved,
          userStatus,
        };
      }),
    [problems, solvedSet, wrongSet],
  );

  const totalSolvedCount = solvedProblemIds.length;

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
    updateQueryParams({
      difficulty: null,
      category: null,
      status: null,
      search: null,
      page: "1",
      sort: "id",
      order: "asc",
    });
  };

  const handleFilterChange = (
    key: "difficulty" | "category" | "status",
    value: string,
    fn: () => void,
  ) => {
    fn();
    setCurrentPage(1);
    updateQueryParams({
      [key]: value,
      page: "1",
      sort: sortField,
      order: sortOrder,
    });
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
            <DropdownSelect
              value={selectedDifficulty}
              onValueChange={(value) =>
                handleFilterChange("difficulty", value, () =>
                  setDifficulty(value),
                )
              }
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              triggerClassName="min-h-9 rounded-md bg-[#F8FAFC] dark:bg-[#09090b] border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50"
            />
          </div>
          {shouldShowAlgorithmFilter && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              알고리즘
            </label>
            <DropdownSelect
              value={selectedCategory}
              onValueChange={(value) =>
                handleFilterChange("category", value, () =>
                  setCategory(value),
                )
              }
              options={[
                { value: "전체", label: "전체" },
                ...categories.map((c) => ({ value: c, label: getKoreanTag(c) })),
              ]}
              triggerClassName="min-h-9 rounded-md bg-[#F8FAFC] dark:bg-[#09090b] border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50"
            />
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
            <DropdownSelect
              value={selectedStatus}
              disabled={!user}
              onValueChange={(value) =>
                handleFilterChange("status", value, () =>
                  setStatus(value),
                )
              }
              options={[
                { value: "전체", label: "전체" },
                { value: "풀었음", label: "풀었음" },
                { value: "틀렸음", label: "틀렸음" },
                { value: "안 풀었음", label: "안 풀었음" },
              ]}
              triggerClassName="min-h-9 rounded-md bg-[#F8FAFC] dark:bg-[#09090b] border-[#E2E8F0] dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50"
            />
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
          <Table className="min-w-[75rem] table-fixed">
            <colgroup>
              <col className="w-20" />
              <col className="w-96" />
              {showAlgorithm && <col className="w-64" />}
              <col className="w-36" />
              <col className="w-28" />
              <col className="w-32" />
              {user && <col className="w-24" />}
            </colgroup>
            <TableHeader className="bg-[#F8FAFC] dark:bg-zinc-800/30">
              <TableRow className="border-[#E2E8F0] dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="w-20 px-6">
                  <button
                    type="button"
                    className="group flex items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("id")}
                  >
                    #
                    <span className={getSortIconClassName(sortField === "id")}>
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
                <TableHead className="w-96">
                  <button
                    type="button"
                    className="group flex items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("title")}
                  >
                    제목
                    <span className={getSortIconClassName(sortField === "title")}>
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
                <TableHead className="w-64">
                  <button
                    type="button"
                    title="알고리즘 태그 기준 정렬"
                    className="group flex cursor-pointer items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("tag1")}
                  >
                    태그
                    <span className={getSortIconClassName(sortField === "tag1")}>
                      {sortField === "tag1" ? (
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
                    <span className={getSortIconClassName(sortField === "difficulty")}>
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
                    title="정답률 기준 정렬"
                    className="group ml-auto flex cursor-pointer items-center justify-end gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("acceptanceRate")}
                  >
                    정답률
                    <span className={getSortIconClassName(sortField === "acceptanceRate")}>
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
                <TableHead className="w-28 text-right">
                  <button
                    type="button"
                    title="생성일 기준 정렬"
                    className="group ml-auto flex cursor-pointer items-center justify-end gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort("created_at")}
                  >
                    생성일
                    <span className={getSortIconClassName(sortField === "created_at")}>
                      {sortField === "created_at" ? (
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
                      title="내 풀이 상태 기준 정렬"
                      className="group mx-auto flex cursor-pointer items-center justify-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                      onClick={() => handleSort("status")}
                    >
                      상태
                      <span className={getSortIconClassName(sortField === "status")}>
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
                      <TableCell className="overflow-hidden">
                        <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      {showAlgorithm && (
                      <TableCell className="overflow-hidden">
                        <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      )}
                      <TableCell>
                        <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      <TableCell>
                        <div className="ml-auto h-4 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      <TableCell>
                        <div className="ml-auto h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </TableCell>
                      {user && (
                        <TableCell>
                          <div className="mx-auto h-4 w-6 rounded bg-zinc-100 dark:bg-zinc-800" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                : displayed.map((problem, i) => {
                    const status = problem.userStatus ?? "none";
                    const stats = problemStatsMap.get(String(problem.id));
                    const acceptanceRate =
                      !stats || stats.attemptedUsers === 0
                        ? "-"
                        : `${stats.acceptanceRate}%`;

                    return (
                      <TableRow
                        key={problem.id}
                        className="group border-[#E2E8F0] dark:border-zinc-800 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/20"
                      >
                        <TableCell className="px-6 text-sm font-medium text-zinc-400 dark:text-zinc-500">
                          {problem.id ?? (currentPage - 1) * PAGE_SIZE + i + 1}
                        </TableCell>
                        <TableCell className="overflow-hidden">
                          <Link
                            href={`/problems/${problem.id}`}
                            className="block"
                          >
                            <p className="truncate text-sm font-semibold text-zinc-800 transition-colors group-hover:text-blue-600 dark:text-zinc-200 dark:group-hover:text-blue-400">
                              {problem.title}
                            </p>
                          </Link>
                        </TableCell>
                        {showAlgorithm && (
                        <TableCell className="overflow-hidden">
                          <div className="flex min-w-0 gap-1 overflow-hidden">
                            <span className="max-w-28 truncate rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                              {getKoreanTag(problem.tag1)}
                            </span>
                            {problem.tag2 && (
                              <span className="max-w-28 truncate rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
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
                        <TableCell className="text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {problem.created_at
                            ? new Date(problem.created_at).toLocaleDateString(
                                "ko-KR",
                                { timeZone: "Asia/Seoul" },
                              )
                            : "-"}
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
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 sm:inline-flex"
                    aria-label="첫 페이지로 이동"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
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
                          onClick={() => handlePageChange(page)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    aria-label="다음 페이지로 이동"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages)}
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
