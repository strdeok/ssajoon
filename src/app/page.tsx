import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Flame, ChevronRight, ArrowRight } from "lucide-react";
import {
  HomeStatsCards,
  HomeSubmissionPanel,
} from "@/components/home/HomeSubmissionClient";

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
    Easy:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    EASY:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    Medium:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    MEDIUM:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    Hard:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    HARD:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
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
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        map[difficulty] ??
        "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      }`}
    >
      {labelMap[difficulty] ?? difficulty}
    </span>
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
  // 홈 페이지 서버 컴포넌트를 정의한다.
  const { totalProblemsCount, recentProblems } =
    await getData(); // 홈 화면에 필요한 데이터를 서버에서 조회한다.

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-zinc-950 transition-colors duration-300 px-16">
      <section className="relative overflow-hidden mx-6 mt-6 rounded-xl h-100 bg-[#253EEB] dark:bg-indigo-700 flex items-center shadow-2xl shadow-blue-500/10">
        <div className="absolute inset-0 opacity-10 dark:opacity-5 select-none pointer-events-none overflow-hidden"></div>
        <div className="absolute inset-0 bg-linear-to-r from-[#253EEB] via-[#253EEB]/80 to-transparent dark:from-indigo-700 dark:via-indigo-700/80" />
        <div className="relative z-10 px-12 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <Flame className="w-3.5 h-3.5" />
            알고리즘 마스터의 시작
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            코딩 실력을
            <br />한 단계 끌어올리세요
          </h1>
          <p className="text-blue-100 text-base leading-relaxed mb-8 opacity-90">
            체계적으로 큐레이션된 알고리즘 문제들로
            <br />
            실전 감각을 키우고 코딩 역량을 성장시키세요.
          </p>
          <div className="flex items-center gap-3">
            <Link
              prefetch={false}
              href="/problems"
              className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              문제 풀기 시작
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/generate"
              prefetch={false}
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
            >
              AI 문제 생성
            </Link>
          </div>
        </div>
      </section>
      <HomeStatsCards totalProblemsCount={totalProblemsCount} />
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-6 mt-6 mb-8 min-h-[690px]">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              최근 추가된 문제
            </h2>
            <Link
              prefetch={false}
              href="/problems"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              전체 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-lg overflow-hidden min-h-[640px]">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#F8FAFC] dark:bg-zinc-800/50 border-b border-[#E2E8F0] dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-6">문제 제목</div>
              <div className="col-span-2">난이도</div>
              <div className="col-span-3 text-right">풀기</div>
            </div>
            {recentProblems.length === 0 ? (
              <div className="min-h-[596px] flex items-center justify-center text-center text-zinc-400 text-sm">
                등록된 문제가 없습니다.
              </div>
            ) : (
              recentProblems.map((problem) => (
                <Link
                  prefetch={false}
                  href={`/problems/${problem.id}`}
                  key={problem.id}
                  className="group grid grid-cols-12 gap-4 items-center min-h-[59px] px-5 py-4 border-b border-[#E2E8F0] dark:border-zinc-800 last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="col-span-1 text-sm text-zinc-400 font-medium">
                    {problem.id}
                  </div>
                  <div className="col-span-6">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {problem.title}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <HomeDifficultyBadge difficulty={problem.difficulty} />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-all">
                      풀기 <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        <HomeSubmissionPanel />
      </section>
    </div>
  );
}
