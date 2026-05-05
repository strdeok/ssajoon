"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import SubmissionSummaryCards, { SubmissionSummary } from "@/components/submissions/SubmissionSummaryCards";
import SubmissionFilters from "@/components/submissions/SubmissionFilters";
import SubmissionTable, { Submission } from "@/components/submissions/SubmissionTable";
import SubmissionPagination from "@/components/submissions/SubmissionPagination";
import WeeklySubmissionChart, { WeeklyStat } from "@/components/submissions/WeeklySubmissionChart";

// 한 페이지당 보여줄 제출 기록의 수
const ITEMS_PER_PAGE = 10;

// 정답 처리 기준 판별 (기존 로직과 통일성 유지)
const isAcceptedResult = (result: string | null) => {
  if (!result) return false;
  const lower = result.toLowerCase();
  return lower.includes("맞았습니다") || lower === "accepted" || lower === "ac";
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 요약 통계 및 주간 차트 상태
  const [summary, setSummary] = useState<SubmissionSummary>({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    submissionAccuracyRate: 0,
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);

  // -------------------------------------------------------------
  // 클라이언트 상태 관리 (검색, 필터, 페이지네이션)
  // -------------------------------------------------------------
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("로그인이 필요합니다.");
          setIsLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("submissions")
          .select(`
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
          `)
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .order("submitted_at", { ascending: false });

        if (fetchError) throw fetchError;

        // DB 데이터를 프론트엔드 Submission 인터페이스에 맞게 매핑
        const mappedSubmissions: Submission[] = (data || []).map((sub: any) => {
          const problemData = Array.isArray(sub.problems) ? sub.problems[0] : sub.problems;
          
          return {
            id: sub.id,
            problemId: sub.problem_id,
            problemTitle: problemData?.title || "알 수 없는 문제",
            category: problemData?.category || "기타",
            language: sub.language || "Unknown",
            result: sub.result || "결과 없음",
            runtimeMs: sub.execution_time_ms,
            memoryKb: sub.memory_kb,
            // Date 객체 변환을 위해 원본을 저장하되, UI 표시 시 가공할 수 있게 함
            submittedAt: sub.submitted_at, 
          };
        });

        setSubmissions(mappedSubmissions);
        
        // 1. 요약 통계 계산
        const total = mappedSubmissions.length;
        const accepted = mappedSubmissions.filter(s => isAcceptedResult(s.result)).length;
        const accuracy = total > 0 ? Number(((accepted / total) * 100).toFixed(1)) : 0;
        
        setSummary({
          totalSubmissions: total,
          acceptedSubmissions: accepted,
          submissionAccuracyRate: accuracy,
        });

        // 2. 주간 통계 계산 (최근 7일)
        const stats = calculateWeeklySubmissionStats(mappedSubmissions);
        setWeeklyStats(stats);

      } catch (err: any) {
        console.error("Failed to fetch submissions:", err);
        setError("제출 기록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  // 주간 통계 계산 헬퍼 함수
  const calculateWeeklySubmissionStats = (subs: Submission[]): WeeklyStat[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats: WeeklyStat[] = [];
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    // 최근 7일에 대한 기본 데이터 구조 생성 (6일 전 ~ 오늘)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      stats.push({
        date: dayNames[d.getDay()],
        count: 0,
        isToday: i === 0,
        fullDate: d.toISOString().split("T")[0] // 내부 비교용 yyyy-mm-dd
      });
    }

    // 제출 기록 순회하며 카운트 증가
    subs.forEach(sub => {
      if (!sub.submittedAt) return;
      const subDate = new Date(sub.submittedAt);
      const dateStr = subDate.toISOString().split("T")[0];
      
      const targetStat = stats.find(s => (s as any).fullDate === dateStr);
      if (targetStat) {
        targetStat.count += 1;
      }
    });

    return stats;
  };

  // -------------------------------------------------------------
  // 필터링 로직 (검색어, 상태, 언어에 따라 데이터 필터링)
  // -------------------------------------------------------------
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. 검색어 필터 (문제 번호 또는 제목 포함 여부)
      const matchesSearch =
        sub.problemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.problemId.toString().includes(searchQuery);

      // 2. 상태 필터 (맞았습니다, 틀렸습니다 등 단순 비교 또는 좀 더 유연하게)
      const matchesStatus = 
        statusFilter === "모든 상태" || 
        (statusFilter === "맞았습니다!" && isAcceptedResult(sub.result)) ||
        (statusFilter !== "맞았습니다!" && sub.result === statusFilter && !isAcceptedResult(sub.result));

      // 3. 언어 필터
      const matchesLanguage = languageFilter === "모든 언어" || sub.language === languageFilter;

      return matchesSearch && matchesStatus && matchesLanguage;
    });
  }, [submissions, searchQuery, statusFilter, languageFilter]);

  // 필터 조건이 변경되면 첫 페이지로 되돌아감
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, languageFilter]);

  // -------------------------------------------------------------
  // 페이지네이션 로직 (필터링된 데이터 중 현재 페이지에 해당하는 데이터만 추출)
  // -------------------------------------------------------------
  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE) || 1;
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubmissions, currentPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500">제출 기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <p className="text-red-500 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* 넉넉한 spacing을 가진 중앙 정렬 컨테이너 */}
      <div className="max-w-6xl mx-auto">
        
        {/* 1. 상단 헤더 및 요약 통계 섹션 */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            {/* 큰 제목 */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">제출 기록</h1>
            {/* 설명 문구 */}
            <p className="text-sm text-gray-500">
              본인이 제출한 모든 소스코드의 실행 결과와 이력을 확인하고 관리합니다.
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
        {weeklyStats.length > 0 && (
          <WeeklySubmissionChart data={weeklyStats} />
        )}

      </div>
    </div>
  );
}
