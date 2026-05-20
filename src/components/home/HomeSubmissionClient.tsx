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
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    <Link href={href} prefetch={false}>
      <Card className="h-full border-[#E2E8F0] transition-all hover:shadow-md dark:border-zinc-800">
        <CardContent className="flex h-full flex-col gap-2 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {label}
            </span>
            <div className={cn("rounded-lg p-2", bg)}>{icon}</div>
          </div>
          <div className="flex items-baseline gap-1">
            {isLoading ? (
              <Skeleton className="h-9 w-14 rounded-md bg-zinc-100 dark:bg-zinc-800" />
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
            )}
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
              {unit}
            </span>
          </div>
        </CardContent>
      </Card>
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
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        href="/submissions"
        icon={<Trophy className="h-5 w-5 text-blue-500" />}
        label="푼 문제"
        value={isAuthenticated ? data?.stats.solved ?? 0 : "-"}
        unit="문제"
        bg="bg-blue-50 dark:bg-blue-500/10"
        isLoading={isLoading}
      />
      <StatCard
        href="/submissions"
        icon={<BarChart2 className="h-5 w-5 text-emerald-500" />}
        label="정답률"
        value={isAuthenticated ? data?.stats.accuracy ?? 0 : "-"}
        unit="%"
        bg="bg-emerald-50 dark:bg-emerald-500/10"
        isLoading={isLoading}
      />
      <StatCard
        href="/submissions"
        icon={<TrendingUp className="h-5 w-5 text-violet-500" />}
        label="이번 주 제출"
        value={isAuthenticated ? data?.stats.weeklySubmissionCount ?? 0 : "-"}
        unit="회"
        bg="bg-violet-50 dark:bg-violet-500/10"
        isLoading={isLoading}
      />
      <StatCard
        href="/problems"
        icon={<BookOpen className="h-5 w-5 text-amber-500" />}
        label="총 문제 수"
        value={totalProblemsCount}
        unit="문제"
        bg="bg-amber-50 dark:bg-amber-500/10"
      />
    </section>
  );
}

function HomeSubmissionSkeleton() {
  return (
    <div className="divide-y divide-[#E2E8F0] dark:divide-zinc-800">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex min-h-16 items-center gap-3 px-5 py-3.5">
          <Skeleton className="h-4 w-4 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800" />
            <Skeleton className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <Skeleton className="h-4 w-12 bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function LoginRequiredPanel() {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
        <Trophy className="h-7 w-7 text-blue-400" />
      </div>
      <div>
        <p className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          로그인하고 제출 현황을 확인하세요
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          학습 기록과 성장 흐름을 한눈에 볼 수 있습니다.
        </p>
      </div>
      <Link
        href="/login"
        prefetch={false}
        className={buttonVariants({ size: "sm", className: "rounded-lg px-5" })}
      >
        로그인
      </Link>
    </div>
  );
}

function EmptySubmissionPanel() {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800">
        <BarChart2 className="h-7 w-7 text-zinc-300" />
      </div>
      <p className="text-sm text-zinc-400">아직 제출한 문제가 없어요</p>
      <Link
        href="/problems"
        prefetch={false}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        첫 문제 풀러 가기
      </Link>
    </div>
  );
}
const convertLanguage = (language: string | null) => {
  if (!language) return "-";

  switch (language) {
    case "java":
      return "Java 17";
    case "cpp":
      return "C++ 17";
    case "python":
      return "Python3";
    default:
      return language;
  }
};

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
            href="/submissions"
            prefetch={false}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            전체
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <Card className="min-h-80 overflow-hidden border-[#E2E8F0] dark:border-zinc-800 sm:min-h-96">
        <CardContent className="p-0">
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
                  href={`/submissions/${submission.id}`}
                  key={submission.id}
                  prefetch={false}
                  className="flex min-h-16 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50"
                >
                  <StatusIcon result={submission.result} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {submission.problem_title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
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
                      {convertLanguage(submission.language)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
