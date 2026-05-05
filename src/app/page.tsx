import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Flame,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart2,
} from "lucide-react";

async function getData() {
  const host = (await headers()).get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 문제 목록 (최근 5개 + 전체 카운트)
  const problemsRes = await fetch(
    `${protocol}://${host}/api/problems?pageSize=5`,
    { cache: "no-store" },
  );
  const problemsJson = problemsRes.ok
    ? await problemsRes.json()
    : { data: [], count: 0 };
  const recentProblems: any[] = problemsJson.data ?? [];
  const totalProblemsCount: number = problemsJson.count ?? 0;

  // 사용자 제출 이력 (로그인 상태일 때만)
  let submissions: any[] = [];
  let stats = { solved: 0, accuracy: 0, recentCount: 0, streakDays: 1 };

  if (user) {
    const subRes = await fetch(`${protocol}://${host}/api/submissions`, {
      cache: "no-store",
      headers: { Cookie: (await headers()).get("cookie") || "" },
    });
    if (subRes.ok) {
      submissions = await subRes.json();
      const total = submissions.length;
      const accepted = submissions.filter((s: any) => s.status === "AC").length;
      const uniqueSolved = new Set(
        submissions
          .filter((s: any) => s.status === "AC")
          .map((s: any) => s.problem_id)
      ).size;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentCount = submissions.filter(
        (s: any) => new Date(s.submitted_at) > sevenDaysAgo
      ).length;

      stats = {
        solved: uniqueSolved,
        accuracy: total > 0 ? Math.round((accepted / total) * 100) : 0,
        recentCount,
        streakDays: recentCount > 0 ? 1 : 0,
      };
    }
  }

  return { user, totalProblemsCount, recentProblems, submissions: submissions.slice(0, 6), stats };
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const map: Record<string, string> = {
    Easy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EASY: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border border-amber-200",
    MEDIUM: "bg-amber-50 text-amber-700 border border-amber-200",
    Hard: "bg-red-50 text-red-700 border border-red-200",
    HARD: "bg-red-50 text-red-700 border border-red-200",
    MEDIUM_HARD: "bg-orange-50 text-orange-700 border border-orange-200",
    "Medium Hard": "bg-orange-50 text-orange-700 border border-orange-200",
  };
  const labelMap: Record<string, string> = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
    MEDIUM_HARD: "Medium-Hard",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[difficulty] ?? "bg-zinc-100 text-zinc-600 border border-zinc-200"}`}
    >
      {labelMap[difficulty] ?? difficulty}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "AC")
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "PENDING")
    return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    AC: { label: "정답", cls: "text-emerald-600 font-semibold" },
    WA: { label: "오답", cls: "text-red-500" },
    TLE: { label: "시간초과", cls: "text-orange-500" },
    MLE: { label: "메모리초과", cls: "text-purple-500" },
    RE: { label: "런타임오류", cls: "text-rose-500" },
    CE: { label: "컴파일오류", cls: "text-yellow-600" },
    PENDING: { label: "채점중", cls: "text-blue-500" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "text-zinc-500" };
  return <span className={`text-xs ${cls}`}>{label}</span>;
}

export default async function Home() {
  const { user, totalProblemsCount, recentProblems, submissions, stats } = await getData();

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* ───────────────── Hero Section ───────────────── */}
      <section className="relative overflow-hidden mx-6 mt-6 rounded-xl h-[400px] bg-[#253EEB] flex items-center">
        {/* Code texture overlay */}
        <div className="absolute inset-0 opacity-10 select-none pointer-events-none overflow-hidden">
          <pre className="text-[11px] text-white leading-5 font-mono p-8 whitespace-pre-wrap break-all">
            {`def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i
    return []

def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def inorder(root):
    if not root: return []
    return inorder(root.left) + [root.val] + inorder(root.right)`}
          </pre>
        </div>
        {/* Gradient left overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#253EEB] via-[#253EEB]/80 to-transparent" />

        {/* Content */}
        <div className="relative z-10 px-12 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <Flame className="w-3.5 h-3.5" />
            알고리즘 마스터의 시작
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            코딩 실력을<br />
            한 단계 끌어올리세요
          </h1>
          <p className="text-blue-100 text-base leading-relaxed mb-8 opacity-90">
            체계적으로 큐레이션된 알고리즘 문제들로<br />
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

      {/* ───────────────── Stats Grid ───────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mx-6 mt-6">
        {[
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
            label: "최근 7일 제출",
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
        ].map(({ icon, label, value, unit, bg }) => (
          <div
            key={label}
            className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 font-medium">{label}</span>
              <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-zinc-900">
                {value}
              </span>
              <span className="text-sm text-zinc-400 font-medium">{unit}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ───────────────── Main Content Grid ───────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-6 mt-6 mb-8">
        {/* Left: Recent Problems Table (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">최근 추가된 문제</h2>
            <Link
              href="/problems"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              전체 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-zinc-500 uppercase tracking-wide">
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
              recentProblems.map((problem: any, idx: number) => (
                <Link
                  href={`/problems/${problem.id}`}
                  key={problem.id}
                  className="group grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="col-span-1 text-sm text-zinc-400 font-medium">
                    {problem.problem_no ?? idx + 1}
                  </div>
                  <div className="col-span-6">
                    <p className="text-sm font-semibold text-zinc-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {problem.title}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                      {problem.description}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700 bg-blue-50 group-hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all">
                      풀기
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: My Submissions (1/3 width) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">최근 제출 현황</h2>
            {user && (
              <Link
                href="/submissions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
              >
                전체 <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden flex-1">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">
                    로그인하고 내 제출 현황을 확인하세요
                  </p>
                  <p className="text-xs text-zinc-400">
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
                <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center">
                  <BarChart2 className="w-7 h-7 text-zinc-300" />
                </div>
                <p className="text-sm text-zinc-400">아직 제출한 문제가 없어요</p>
                <Link
                  href="/problems"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  첫 문제 풀러 가기 →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {submissions.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <StatusIcon status={sub.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {sub.problem_title ?? `문제 #${sub.problem_id}`}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {new Date(sub.submitted_at).toLocaleDateString(
                            "ko-KR",
                            { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <StatusLabel status={sub.status} />
                        <span className="text-xs text-zinc-400">{sub.language}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="border-t border-[#E2E8F0] bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-zinc-800">싸준 (SSAJUN)</p>
            <p className="text-xs text-zinc-400 mt-1">
              © 2024 싸준 (SSAJUN). All rights reserved.
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/problems" className="hover:text-zinc-800 transition-colors">
              문제
            </Link>
            <Link href="/generate" className="hover:text-zinc-800 transition-colors">
              AI 생성
            </Link>
            <Link href="/submissions" className="hover:text-zinc-800 transition-colors">
              제출
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
