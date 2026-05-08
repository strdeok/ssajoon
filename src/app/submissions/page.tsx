"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import SubmissionSummaryCards, {
  SubmissionSummary,
} from "@/components/submissions/SubmissionSummaryCards";
import SubmissionFilters from "@/components/submissions/SubmissionFilters";
import SubmissionTable, {
  Submission,
} from "@/components/submissions/SubmissionTable";
import SubmissionPagination from "@/components/submissions/SubmissionPagination";
import WeeklySubmissionChart, {
  WeeklyStat,
} from "@/components/submissions/WeeklySubmissionChart";

const ITEMS_PER_PAGE = 10;

const isAcceptedResult = (result: string | null) => {
  if (!result) return false;
  const lower = result.toLowerCase();
  return (
    lower.includes("맞았습니다") ||
    lower === "accepted" ||
    lower === "ac" ||
    lower.includes("정답")
  );
};

const getResultText = (result: string) => {
  switch (result) {
    case "AC":
      return "정답";
    case "WA":
      return "오답";
    case "TLE":
      return "시간 초과";
    case "MLE":
      return "메모리 초과";
    case "RE":
      return "런타임 에러";
    case "CE":
      return "컴파일 에러";
    case "PE":
      return "출력 형식 오류";
    case "SYSTEM_ERROR":
      return "시스템 오류";
    default:
      return result;
  }
};

const normalizeLanguage = (lang: string | null | undefined) => {
  if (!lang || lang === "Unknown") return "unknown";
  const lower = lang.toLowerCase();
  if (lower === "cpp" || lower === "c++") return "c++";
  return lower;
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<SubmissionSummary>({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    submissionAccuracyRate: 0,
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("모든 상태");
  const [languageFilter, setLanguageFilter] = useState("모든 언어");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Submission>("submittedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof Submission) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  useEffect(() => {
    async function fetchSubmissions() {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("로그인이 필요합니다.");
          setIsLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("submissions")
          .select(
            `
            id,
            problem_id,
            language,
            result,
            status,
            execution_time_ms,
            memory_kb,
            submitted_at,
            problems (
              title,
              tag1,
              tag2
            )
          `,
          )
          .eq("user_id", user.id)
          .or("is_deleted.is.false,is_deleted.is.null")
          .order("submitted_at", { ascending: false });

        if (fetchError) {
          console.error("Fetch submissions error:", fetchError);
          throw fetchError;
        }

        const mappedSubmissions: Submission[] = (data || []).map((sub: any) => {
          const problemData = Array.isArray(sub.problems)
            ? sub.problems[0]
            : sub.problems;

          let displayResult = sub.result || sub.status || "결과 없음";

          // 결과 값 정규화 (배지 스타일 일관성을 위함)
          if (isAcceptedResult(displayResult)) {
            displayResult = "AC";
          } else if (
            displayResult.includes("틀렸습니다") ||
            displayResult === "Wrong Answer" ||
            displayResult === "WA"
          ) {
            displayResult = "WA";
          } else if (
            displayResult.includes("시간 초과") ||
            displayResult === "Time Limit Exceeded" ||
            displayResult === "TLE"
          ) {
            displayResult = "TLE";
          } else if (
            displayResult.includes("메모리 초과") ||
            displayResult === "Memory Limit Exceeded" ||
            displayResult === "MLE"
          ) {
            displayResult = "MLE";
          } else if (
            displayResult.includes("런타임 에러") ||
            displayResult === "Runtime Error" ||
            displayResult === "RE"
          ) {
            displayResult = "RE";
          } else if (
            displayResult.includes("컴파일 에러") ||
            displayResult === "Compile Error" ||
            displayResult === "CE"
          ) {
            displayResult = "CE";
          }

          return {
            id: sub.id,
            problemId: sub.problem_id,
            problemTitle: problemData?.title || "알 수 없는 문제",
            tag1: problemData?.tag1 || "기타",
            tag2: problemData?.tag2 || null,
            language: normalizeLanguage(sub.language),
            result: displayResult,
            runtimeMs: sub.execution_time_ms,
            memoryKb: sub.memory_kb,
            submittedAt: sub.submitted_at,
          };
        });

        setSubmissions(mappedSubmissions);

        // 추가: 맞힌 사람 수(solved_users) 데이터를 가져와서 submissions 보완
        if (mappedSubmissions.length > 0) {
          const problemIds = Array.from(
            new Set(mappedSubmissions.map((s) => String(s.problemId))),
          );

          // API 제한(50개)을 고려하여 청크 단위로 요청
          const CHUNK_SIZE = 50;
          const statsMap = new Map<string, number>();

          for (let i = 0; i < problemIds.length; i += CHUNK_SIZE) {
            const chunk = problemIds.slice(i, i + CHUNK_SIZE);
            try {
              const res = await fetch("/api/problems/stats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ problemIds: chunk }),
              });
              if (res.ok) {
                const json = await res.json();
                (json.data ?? []).forEach((stat: any) => {
                  statsMap.set(String(stat.problem_id), stat.solved_users);
                });
              }
            } catch (err) {
              console.error("Failed to fetch problem stats for chunk:", err);
            }
          }

          if (statsMap.size > 0) {
            setSubmissions((prev) =>
              prev.map((s) => ({
                ...s,
                solvedUsersCount: statsMap.get(String(s.problemId)) ?? 0,
              })),
            );
          }
        }

        const total = mappedSubmissions.length;
        const accepted = mappedSubmissions.filter((s) =>
          isAcceptedResult(s.result),
        ).length;
        const accuracy =
          total > 0 ? Number(((accepted / total) * 100).toFixed(1)) : 0;

        setSummary({
          totalSubmissions: total,
          acceptedSubmissions: accepted,
          submissionAccuracyRate: accuracy,
        });

        const stats = calculateWeeklySubmissionStats(mappedSubmissions);
        setWeeklyStats(stats);
      } catch (err: any) {
        console.error("Submission fetch failed:", err);
        setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
        setSubmissions([]);
        setSummary({
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          submissionAccuracyRate: 0,
        });
        setWeeklyStats([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  const calculateWeeklySubmissionStats = (subs: Submission[]): WeeklyStat[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const internalStats: (WeeklyStat & { localDateStr: string })[] = [];
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    // 로컬 날짜 문자열 생성을 위한 헬퍼 (YYYY-MM-DD)
    const getLocalDateStr = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    // 이번 주 월요일 찾기
    const getStartOfCurrentWeek = (date: Date) => {
      const result = new Date(date);
      const day = result.getDay(); // 0(일) ~ 6(토)
      const diff = day === 0 ? -6 : 1 - day; // 월요일로 맞춤
      result.setDate(result.getDate() + diff);
      result.setHours(0, 0, 0, 0);
      return result;
    };

    const startOfWeek = getStartOfCurrentWeek(today);

    // 월요일부터 일요일까지 7일간의 데이터 초기화
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      internalStats.push({
        date: dayNames[d.getDay()],
        count: 0,
        isToday: d.getTime() === today.getTime(),
        localDateStr: getLocalDateStr(d),
      });
    }

    subs.forEach((sub) => {
      if (!sub.submittedAt) return;
      const subDate = new Date(sub.submittedAt);
      const dateStr = getLocalDateStr(subDate);

      const targetStat = internalStats.find((s) => s.localDateStr === dateStr);
      if (targetStat) {
        targetStat.count += 1;
      }
    });

    return internalStats.map(({ localDateStr, ...rest }) => rest);
  };

  const filteredSubmissions = useMemo(() => {
    const filtered = submissions.filter((sub) => {
      const matchesSearch =
        sub.problemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.problemId.toString().includes(searchQuery);

      const matchesStatus =
        statusFilter === "모든 상태" ||
        getResultText(sub.result) === statusFilter;

      const matchesLanguage =
        languageFilter === "모든 언어" ||
        sub.language === normalizeLanguage(languageFilter);

      return matchesSearch && matchesStatus && matchesLanguage;
    });

    // 정렬 로직 적용
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return sortOrder === "asc" ? -1 : 1;
      if (bVal === null || bVal === undefined) return sortOrder === "asc" ? 1 : -1;

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [submissions, searchQuery, statusFilter, languageFilter, sortField, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, languageFilter]);

  const totalPages =
    Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE) || 1;
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubmissions, currentPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-zinc-400">
            제출 기록을 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm text-center border border-gray-200 dark:border-zinc-800">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    // 페이지 전체 배경은 아주 연한 회색(bg-gray-50), 최소 높이는 화면 전체(min-h-screen)
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* 넉넉한 spacing을 가진 중앙 정렬 컨테이너 */}
      <div className="px-14">
        {/* 1. 상단 헤더 및 요약 통계 섹션 */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            {/* 큰 제목 */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
              제출 기록
            </h1>
            {/* 설명 문구 */}
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              본인이 제출한 모든 소스코드의 실행 결과와 이력을 확인하고
              관리합니다.
            </p>
          </div>
          {/* 요약 통계 카드 컴포넌트 렌더링 */}
          <SubmissionSummaryCards summary={summary} />
        </div>

        {/* 2. 필터 바 섹션 */}
        <SubmissionFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          languageFilter={languageFilter}
          setLanguageFilter={setLanguageFilter}
        />

        {/* 3. 제출 목록 테이블 섹션 (페이징된 데이터 전달) */}
        <SubmissionTable
          submissions={paginatedSubmissions}
          onSort={handleSort}
          currentSort={{ field: sortField, order: sortOrder }}
        />

        {/* 4. 페이지네이션 섹션 */}
        <SubmissionPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* 5. 주간 제출 통계 (차트) 섹션 */}
        {weeklyStats.length > 0 && <WeeklySubmissionChart data={weeklyStats} />}
      </div>
    </div>
  );
}
