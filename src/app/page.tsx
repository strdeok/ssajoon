import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Flame,
  ChevronRight,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import {
  DifficultyBadge,
  StatusIcon,
  StatusLabel,
} from "@/components/problem/ProblemComponents";
import { getKoreanTag } from "@/utils/tagUtils";
import ProblemMarkdown from "@/components/common/ProblemMarkdown";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ProblemRow = {
  id: number;
  title: string;
  difficulty: string | null;
  description: string | null;
  tag1: string | null;
  tag2: string | null;
  created_at: string | null;
};

type JoinedProblem =
  | {
    title: string | null;
  }
  | {
    title: string | null;
  }[]
  | null;

type SubmissionRow = {
  id: number;
  problem_id: number;
  language: string | null;
  result: string | null;
  submitted_at: string | null;
  problems: JoinedProblem;
};

type SubmissionItem = SubmissionRow & {
  problem_title: string;
};

type HomeStats = {
  solved: number;
  accuracy: number;
  recentCount: number;
  streakDays: number;
};

const ACCEPTED_RESULTS = new Set(["AC", "ACCEPTED"]);

function normalizeResult(result: string | null | undefined) {
  return (result ?? "").trim().toUpperCase();
}

function isAcceptedResult(result: string | null | undefined) {
  return ACCEPTED_RESULTS.has(normalizeResult(result));
}

function isUndefinedColumnError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42703"
  );
}

function getProblemTitle(joinedProblem: JoinedProblem, problemId: number) {
  const problem = Array.isArray(joinedProblem)
    ? joinedProblem[0]
    : joinedProblem;
  return problem?.title || `문제 #${problemId}`;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getStartOfCurrentWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay(); // 0(일) ~ 6(토)
  const diff = day === 0 ? -6 : 1 - day; // 월요일로 맞춤
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function calculateStreakDays(submissions: SubmissionRow[]) {
  const submissionDateKeys = new Set(
    submissions
      .filter((submission) => submission.submitted_at)
      .map((submission) =>
        getDateKey(new Date(submission.submitted_at as string)),
      ),
  );

  let streak = 0;
  const checkDate = new Date();

  if (!submissionDateKeys.has(getDateKey(checkDate))) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (submissionDateKeys.has(getDateKey(checkDate))) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

async function getVisibleProblemsCount(supabase: ServerSupabaseClient) {
  const query = supabase
    .from("problems")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false)
    .eq("is_hidden", false);

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
    .select("id, title, difficulty, description, tag1, tag2, created_at")
    .eq("is_deleted", false)
    .eq("is_hidden", false)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(10);

  if (!error) return (data ?? []) as ProblemRow[];

  if (isUndefinedColumnError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("problems")
      .select("id, title, difficulty, description, tag1, tag2, created_at")
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

async function getUserSubmissions(
  supabase: ServerSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("submissions")
    .select("id, problem_id, language, result, submitted_at, problems(title)")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (error) {
    return [];
  }

  return (data ?? []) as SubmissionRow[];
}

function calculateUserStats(allSubmissions: SubmissionRow[]) {
  const total = allSubmissions.length;
  const acceptedSubmissions = allSubmissions.filter((submission) =>
    isAcceptedResult(submission.result),
  );
  const uniqueSolved = new Set(
    acceptedSubmissions.map((submission) => submission.problem_id),
  ).size;

  const startOfWeek = getStartOfCurrentWeek(new Date());

  const recentCount = allSubmissions.filter((submission) => {
    if (!submission.submitted_at) return false;
    return new Date(submission.submitted_at) >= startOfWeek;
  }).length;

  return {
    solved: uniqueSolved,
    accuracy:
      total > 0 ? Math.round((acceptedSubmissions.length / total) * 100) : 0,
    recentCount,
    streakDays: calculateStreakDays(allSubmissions),
  } satisfies HomeStats;
}

async function getData() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();

  const user = authData.user;
  const totalProblemsCount = await getVisibleProblemsCount(supabase);
  const recentProblems = await getRecentVisibleProblems(supabase);

  let submissions: SubmissionItem[] = [];
  let stats: HomeStats = {
    solved: 0,
    accuracy: 0,
    recentCount: 0,
    streakDays: 0,
  };

  if (user) {
    const allSubmissions = await getUserSubmissions(supabase, user.id);
    stats = calculateUserStats(allSubmissions);
    submissions = allSubmissions.slice(0, 6).map((submission) => ({
      ...submission,
      problem_title: getProblemTitle(
        submission.problems,
        submission.problem_id,
      ),
    }));
  }

  return { user, totalProblemsCount, recentProblems, submissions, stats };
}

export default async function Home() {
  // 홈 페이지 서버 컴포넌트를 정의한다.
  const { user, totalProblemsCount, recentProblems, submissions, stats } =
    await getData(); // 홈 화면에 필요한 데이터를 서버에서 조회한다.

  const statCards = [
    {
      icon: <Trophy className="w-5 h-5 text-blue-500" />,
      label: "푼 문제",
      value: user ? stats.solved : "-",
      unit: "문제",
      bg: "bg-blue-50",
    },
    {
      icon: <BarChart2 className="w-5 h-5 text-emerald-500" />,
      label: "정답률",
      value: user ? stats.accuracy : "-",
      unit: "%",
      bg: "bg-emerald-50",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-violet-500" />,
      label: "이번 주 제출",
      value: user ? stats.recentCount : "-",
      unit: "회",
      bg: "bg-violet-50",
    },
    {
      icon: <BookOpen className="w-5 h-5 text-amber-500" />,
      label: "총 문제 수",
      value: totalProblemsCount,
      unit: "문제",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-zinc-950 transition-colors duration-300 px-16">
      <section  className="relative overflow-hidden mx-6 mt-6 rounded-xl h-100 bg-[#253EEB] dark:bg-indigo-700 flex items-center shadow-2xl shadow-blue-500/10">
        <div className="absolute inset-0 opacity-10 dark:opacity-5 select-none pointer-events-none overflow-hidden">
        </div>
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
              href="/problems"
              className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              문제 풀기 시작
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
            >
              AI 문제 생성
            </Link>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mx-6 mt-6">
        {statCards.map(
          (
            { icon, label, value, unit, bg },
          ) => (
            <Link
              prefetch={false}
              href={label === "총 문제 수" ? "/problems" : "submissions"}
              key={label}
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
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </span>
                <span className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
                  {unit}
                </span>
              </div>
            </Link>
          ),
        )}
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-6 mt-6 mb-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              최근 추가된 문제
            </h2>
            <Link
              href="/problems"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              전체 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#F8FAFC] dark:bg-zinc-800/50 border-b border-[#E2E8F0] dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-6">문제 제목</div>
              <div className="col-span-2">난이도</div>
              <div className="col-span-3 text-right">풀기</div>
            </div>
            {recentProblems.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 text-sm">
                등록된 문제가 없습니다.
              </div>
            ) : (
              recentProblems.map(
                (
                  problem,
                ) => (
                  <Link
                    prefetch={false}
                    href={`/problems/${problem.id}`}
                    key={problem.id}
                    className="group grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-[#E2E8F0] dark:border-zinc-800 last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="col-span-1 text-sm text-zinc-400 font-medium">
                      {problem.id}
                    </div>
                    <div className="col-span-6">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {problem.title}
                      </p>
                      {/* <div className="mt-0.5 line-clamp-1">
                        {problem.description ? (
                          <ProblemMarkdown
                            content={problem.description}
                            variant="compact"
                          />
                        ) : (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {(problem.tag1 ? getKoreanTag(problem.tag1) : "") ||
                              "설명이 없습니다."}
                          </p>
                        )}
                      </div> */}
                    </div>
                    <div className="col-span-3">
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-all">
                        풀기 <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ),
              )
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              최근 제출 현황
            </h2>
            {user && (
              <Link
                href="/submissions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
              >
                전체 <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-lg overflow-hidden flex-1">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
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
                  href="/login"
                  className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  로그인
                </Link>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  <BarChart2 className="w-7 h-7 text-zinc-300" />
                </div>
                <p className="text-sm text-zinc-400">
                  아직 제출한 문제가 없어요
                </p>
                <Link
                  href="/problems"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  첫 문제 풀러 가기 →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0] dark:divide-zinc-800">
                {submissions.map(
                  (
                    submission,
                  ) => (
                    <Link
                      prefetch={false}
                      href={`/submissions/${submission.id}`}
                      key={submission.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <StatusIcon result={submission.result} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {submission.problem_title}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {submission.submitted_at
                            ? new Date(
                              submission.submitted_at,
                            ).toLocaleDateString("ko-KR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
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
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
