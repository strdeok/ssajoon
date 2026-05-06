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
  return lower.includes("맞았습니다") || lower === "accepted" || lower === "ac";
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
            execution_time_ms,
            memory_kb,
            submitted_at,
            problems (
              title,
              category
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .order("submitted_at", { ascending: false });

        if (fetchError) throw fetchError;

        const mappedSubmissions: Submission[] = (data || []).map((sub: any) => {
          const problemData = Array.isArray(sub.problems)
            ? sub.problems[0]
            : sub.problems;

          return {
            id: sub.id,
            problemId: sub.problem_id,
            problemTitle: problemData?.title || "알 수 없는 문제",
            category: problemData?.category || "기타",
            language: normalizeLanguage(sub.language),
            result: sub.result || "결과 없음",
            runtimeMs: sub.execution_time_ms,
            memoryKb: sub.memory_kb,
            submittedAt: sub.submitted_at,
          };
        });

        setSubmissions(mappedSubmissions);

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
        setError("제출 기록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  const calculateWeeklySubmissionStats = (subs: Submission[]): WeeklyStat[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const internalStats: (WeeklyStat & { fullDate: string })[] = [];
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      internalStats.push({
        date: dayNames[d.getDay()],
        count: 0,
        isToday: i === 0,
        fullDate: d.toISOString().split("T")[0],
      });
    }

    subs.forEach((sub) => {
      if (!sub.submittedAt) return;
      const subDate = new Date(sub.submittedAt);
      const dateStr = subDate.toISOString().split("T")[0];

      const targetStat = internalStats.find((s) => s.fullDate === dateStr);
      if (targetStat) {
        targetStat.count += 1;
      }
    });

    return internalStats.map(({ fullDate, ...rest }) => rest);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
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
  }, [submissions, searchQuery, statusFilter, languageFilter]);

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
          <p className="text-gray-500 dark:text-zinc-400">제출 기록을 불러오는 중...</p>
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
      <div className="max-w-6xl mx-auto">
        {/* 1. 상단 헤더 및 요약 통계 섹션 */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            {/* 큰 제목 */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">제출 기록</h1>
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
        <SubmissionTable submissions={paginatedSubmissions} />

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
