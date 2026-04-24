import { createClient } from "@/utils/supabase/server";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1", 10) || 1;
  const pageSize = 10;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let submissions: any[] = [];
  let totalCount = 0;

  if (user) {
    // 전체 개수 조회
    const { count } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    totalCount = count || 0;

    // 현재 페이지 데이터 조회
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("submissions")
      .select("*, problems(id, title)")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .range(from, to);

    if (data) submissions = data;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto px-6 pt-12 pb-24 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight sm:text-5xl mb-4">
          제출 내역
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          지금까지의 모든 제출 및 채점 결과입니다.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-black/40 border-b border-zinc-200 dark:border-white/5">
                <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">제출 번호</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">문제</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">언어</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">상태</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">제출 시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {submissions.map((sub) => {
                const { text: resultText, isSuccess, isPending, colorClass } = getSubmissionLabel(
                  sub.status,
                  sub.result,
                  sub.failed_testcase_order
                );

                const badgeClass = isSuccess
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : isPending
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 animate-pulse'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20';

                return (
                  <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-zinc-500 font-medium">
                      {String(sub.id).substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      <Link href={`/problems/${sub.problem_id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                        {sub.problems?.title || `문제 #${sub.problem_id}`}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-medium">
                      {sub.language || "unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                          {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                          {resultText}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(sub.submitted_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </td>
                  </tr>
                );
              })}

              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                    {user ? "아직 제출 내역이 없습니다. 첫 문제를 풀어보세요!" : "로그인 후 제출 내역을 확인할 수 있습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-4">
          {currentPage > 1 ? (
            <Link
              href={`/submissions?page=${currentPage - 1}`}
              className="px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
            >
              이전
            </Link>
          ) : (
            <button disabled className="px-4 py-2 text-sm font-medium bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
              이전
            </button>
          )}

          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-900 dark:text-white font-bold">{currentPage}</span> / {totalPages}
          </div>

          {currentPage < totalPages ? (
            <Link
              href={`/submissions?page=${currentPage + 1}`}
              className="px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
            >
              다음
            </Link>
          ) : (
            <button disabled className="px-4 py-2 text-sm font-medium bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
              다음
            </button>
          )}
        </div>
      )}
    </div>
  );
}
