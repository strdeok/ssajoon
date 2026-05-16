"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BarChart2,
  BookOpen,
  ChevronRight,
  Trophy,
  TrendingUp,
} from "lucide-react";
import {
  StatusIcon,
  StatusLabel,
} from "@/components/problem/ProblemComponents";

type JoinedProblem =
  | {
      title: string | null;
    }
  | {
      title: string | null;
    }[]
  | null;

type SubmissionItem = {
  id: number;
  problem_id: number;
  language: string | null;
  result: string | null;
  submitted_at: string | null;
  problems: JoinedProblem;
  problem_title: string;
};

type HomeSubmissionData = {
  authenticated: boolean;
  stats: {
    solved: number;
    accuracy: number;
    weeklySubmissionCount: number;
  };
  recentSubmissions: SubmissionItem[];
};

type SubmissionState = {
  data: HomeSubmissionData | null;
  isLoading: boolean;
};

let cachedSubmissionData: HomeSubmissionData | null | undefined;
let cachedSubmissionPromise: Promise<HomeSubmissionData | null> | null = null;

async function fetchHomeSubmissionData() {
  if (cachedSubmissionData !== undefined) {
    return cachedSubmissionData;
  }

  cachedSubmissionPromise ??= fetch("/api/home/submissions", {
    cache: "no-store",
  })
    .then(async (response) => {
      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as HomeSubmissionData;
    })
    .catch(() => null)
    .then((data) => {
      cachedSubmissionData = data;
      return data;
    });

  return cachedSubmissionPromise;
}

function useHomeSubmissionData(): SubmissionState {
  const [state, setState] = useState<SubmissionState>(() => ({
    data: cachedSubmissionData ?? null,
    isLoading: cachedSubmissionData === undefined,
  }));

  useEffect(() => {
    if (cachedSubmissionData !== undefined) return;

    let ignore = false;

    fetchHomeSubmissionData().then((data) => {
      if (!ignore) {
        setState({ data, isLoading: false });
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  return state;
}

function StatCard({
  href,
  icon,
  label,
  value,
  unit,
  bg,
  isLoading = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: number | string;
  unit: string;
  bg: string;
  isLoading?: boolean;
}) {
  return (
    <Link
      prefetch={false}
      href={href}
      className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-lg p-6 flex flex-col gap-2 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${bg} dark:bg-opacity-10`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        {isLoading ? (
          <span className="h-9 w-14 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ) : (
          <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
        )}
        <span className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
          {unit}
        </span>
      </div>
    </Link>
  );
}

export function HomeStatsCards({
  totalProblemsCount,
}: {
  totalProblemsCount: number;
}) {
  const { data, isLoading } = useHomeSubmissionData();
  const isAuthenticated = Boolean(data?.authenticated);

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mx-6 mt-6">
      <StatCard
        href="/submissions"
        icon={<Trophy className="w-5 h-5 text-blue-500" />}
        label="푼 문제"
        value={isAuthenticated ? data?.stats.solved ?? 0 : "-"}
        unit="문제"
        bg="bg-blue-50"
        isLoading={isLoading}
      />
      <StatCard
        href="/submissions"
        icon={<BarChart2 className="w-5 h-5 text-emerald-500" />}
        label="정답률"
        value={isAuthenticated ? data?.stats.accuracy ?? 0 : "-"}
        unit="%"
        bg="bg-emerald-50"
        isLoading={isLoading}
      />
      <StatCard
        href="/submissions"
        icon={<TrendingUp className="w-5 h-5 text-violet-500" />}
        label="이번 주 제출"
        value={isAuthenticated ? data?.stats.weeklySubmissionCount ?? 0 : "-"}
        unit="회"
        bg="bg-violet-50"
        isLoading={isLoading}
      />
      <StatCard
        href="/problems"
        icon={<BookOpen className="w-5 h-5 text-amber-500" />}
        label="총 문제 수"
        value={totalProblemsCount}
        unit="문제"
        bg="bg-amber-50"
      />
    </section>
  );
}

function HomeSubmissionSkeleton() {
  return (
    <div className="divide-y divide-[#E2E8F0] dark:divide-zinc-800">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[64px] items-center gap-3 px-5 py-3.5"
        >
          <div className="h-4 w-4 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          </div>
          <div className="h-4 w-12 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function LoginRequiredPanel() {
  return (
    <div className="flex min-h-[384px] flex-col items-center justify-center px-6 text-center gap-4">
      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
        <Trophy className="w-7 h-7 text-blue-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
          로그인하고 내 제출 현황을 확인하세요
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          나의 알고리즘 성장 과정을 기록하세요
        </p>
      </div>
      <Link
        prefetch={false}
        href="/login"
        className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
      >
        로그인
      </Link>
    </div>
  );
}

function EmptySubmissionPanel() {
  return (
    <div className="flex min-h-[384px] flex-col items-center justify-center px-6 text-center gap-3">
      <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
        <BarChart2 className="w-7 h-7 text-zinc-300" />
      </div>
      <p className="text-sm text-zinc-400">아직 제출한 문제가 없어요</p>
      <Link
        prefetch={false}
        href="/problems"
        className="text-sm text-blue-600 hover:underline font-medium"
      >
        첫 문제 풀러 가기 →
      </Link>
    </div>
  );
}

export function HomeSubmissionPanel() {
  const { data, isLoading } = useHomeSubmissionData();
  const recentSubmissions = data?.recentSubmissions ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          최근 제출 현황
        </h2>
        {data?.authenticated && (
          <Link
            prefetch={false}
            href="/submissions"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
          >
            전체 <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-lg overflow-hidden flex-1 min-h-[386px]">
        {isLoading ? (
          <HomeSubmissionSkeleton />
        ) : !data?.authenticated ? (
          <LoginRequiredPanel />
        ) : recentSubmissions.length === 0 ? (
          <EmptySubmissionPanel />
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-zinc-800">
            {recentSubmissions.map((submission) => (
              <Link
                prefetch={false}
                href={`/submissions/${submission.id}`}
                key={submission.id}
                className="flex min-h-[64px] items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50 transition-colors"
              >
                <StatusIcon result={submission.result} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {submission.problem_title}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleDateString(
                          "ko-KR",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "제출 시간 없음"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <StatusLabel result={submission.result} />
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {submission.language || "-"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
