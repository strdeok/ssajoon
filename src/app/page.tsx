import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowRight, ChevronRight, Flame } from "lucide-react";
import {
  HomeStatsCards,
  HomeSubmissionPanel,
} from "@/components/home/HomeSubmissionClient";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const revalidate = 60;

type ServerSupabaseClient = ReturnType<typeof createPublicSupabaseClient>;

type ProblemRow = {
  id: number;
  title: string;
  difficulty: string | null;
  tag1: string | null;
  tag2: string | null;
  created_at: string | null;
};

function isUndefinedColumnError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42703"
  );
}

function createPublicSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function HomeDifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  if (!difficulty) return null;

  const map: Record<string, string> = {
    Basic:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    BASIC:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    Easy: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    EASY: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    Medium:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    MEDIUM:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    Hard: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    HARD: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    MEDIUM_HARD:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
    "Medium Hard":
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
    "Medium-Hard":
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  };

  const labelMap: Record<string, string> = {
    BASIC: "Basic",
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
    MEDIUM_HARD: "Medium-Hard",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-1 text-xs font-semibold",
        map[difficulty] ??
          "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
      )}
    >
      {labelMap[difficulty] ?? difficulty}
    </Badge>
  );
}

async function getVisibleProblemsCount(supabase: ServerSupabaseClient) {
  const query = supabase
    .from("problems")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false);

  const { count, error } = await query;

  if (!error) return count ?? 0;

  if (isUndefinedColumnError(error)) {
    const { count: fallbackCount, error: fallbackError } = await supabase
      .from("problems")
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false);

    if (fallbackError) {
      return 0;
    }

    return fallbackCount ?? 0;
  }

  return 0;
}

async function getRecentVisibleProblems(supabase: ServerSupabaseClient) {
  const { data, error } = await supabase
    .from("problems")
    .select("id, title, difficulty, tag1, tag2, created_at")
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(10);

  if (!error) return (data ?? []) as ProblemRow[];

  if (isUndefinedColumnError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("problems")
      .select("id, title, difficulty, tag1, tag2, created_at")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(10);

    if (fallbackError) {
      return [];
    }

    return (fallbackData ?? []) as ProblemRow[];
  }

  return [];
}

async function getData() {
  const supabase = createPublicSupabaseClient();

  const [totalProblemsCount, recentProblems] = await Promise.all([
    getVisibleProblemsCount(supabase),
    getRecentVisibleProblems(supabase),
  ]);

  return { totalProblemsCount, recentProblems };
}

export default async function Home() {
  const { totalProblemsCount, recentProblems } = await getData();

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-4 py-4 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-2xl bg-[#253EEB] shadow-2xl shadow-blue-500/10 dark:bg-indigo-700">
          <Image
            src="/banner.jpg"
            alt="알고리즘 문제 풀이 배너"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1280px"
            className="object-cover object-center opacity-45 dark:opacity-35"
          />

          <div className="absolute inset-0 bg-linear-to-r from-[#253EEB] via-[#253EEB]/85 to-[#253EEB]/35 dark:from-indigo-800 dark:via-indigo-800/85 dark:to-indigo-800/40" />
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative z-10 flex min-h-80 flex-col justify-center px-6 py-10 sm:px-8 lg:min-h-96 lg:px-12">
            <Badge className="mb-6 w-fit border-white/20 bg-white/20 px-3 py-1.5 text-white backdrop-blur-sm">
              <Flame className="mr-1 h-3.5 w-3.5" />
              알고리즘 마스터의 시작
            </Badge>

            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              코딩 실력을
              <br />
              단계적으로 끌어올리세요
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              알고리즘 문제로 문제 해결 능력을 키우고 코딩 역량을 꾸준히
              성장시키세요.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/problems"
                prefetch={false}
                className={buttonVariants({
                  variant: "default",
                  className:
                    "h-11 rounded-lg bg-white px-6 font-bold text-blue-600 hover:bg-blue-50",
                })}
              >
                문제 풀이 시작
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/search"
                prefetch={false}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "h-11 rounded-lg border-white/20 bg-white/10 px-6 font-semibold text-white hover:bg-white/20 hover:text-white",
                })}
              >
                조건별 문제 찾기
              </Link>
            </div>
          </div>
        </section>

        <HomeStatsCards totalProblemsCount={totalProblemsCount} />

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-[#E2E8F0] dark:border-zinc-800">
              <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 dark:border-zinc-800 dark:bg-zinc-800/50 sm:flex-row sm:items-center">
                <CardTitle className="text-lg font-bold">
                  최근 추가된 문제
                </CardTitle>
                <Link
                  href="/problems"
                  prefetch={false}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  전체 보기
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden grid-cols-12 gap-4 border-b border-[#E2E8F0] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:grid">
                  <div className="col-span-1">#</div>
                  <div className="col-span-6">문제 제목</div>
                  <div className="col-span-3">난이도</div>
                  <div className="col-span-2"></div>
                </div>
                {recentProblems.length === 0 ? (
                  <div className="flex min-h-72 items-center justify-center px-6 text-center text-sm text-zinc-400">
                    등록된 문제가 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0] dark:divide-zinc-800">
                    {recentProblems.map((problem) => (
                      <Link
                        href={`/problems/${problem.id}`}
                        key={problem.id}
                        prefetch={false}
                        className="group block px-5 py-4 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50"
                      >
                        <div className="grid gap-3 sm:grid-cols-12 sm:items-center sm:gap-4">
                          <div className="text-sm font-medium text-zinc-400 sm:col-span-1">
                            {problem.id}
                          </div>
                          <div className="sm:col-span-6">
                            <p className="line-clamp-1 text-sm font-semibold text-zinc-800 transition-colors group-hover:text-blue-600 dark:text-zinc-200 dark:group-hover:text-blue-400">
                              {problem.title}
                            </p>
                          </div>
                          <div className="sm:col-span-3">
                            <HomeDifficultyBadge
                              difficulty={problem.difficulty}
                            />
                          </div>
                          <div className="sm:col-span-2 sm:flex sm:justify-end">
                            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 sm:mt-0">
                              보기
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <HomeSubmissionPanel />
        </section>
      </div>
    </div>
  );
}
