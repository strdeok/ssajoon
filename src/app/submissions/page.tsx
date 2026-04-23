import { createClient } from "@/utils/supabase/server";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let submissions: any[] = [];

  if (user) {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, problems(id, title)")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (data) submissions = data;
  }

  return (
    <div className="container mx-auto px-6 pt-12 pb-24">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight sm:text-5xl mb-4">
          제출 내역
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          지금까지의 모든 제출 및 채점 결과입니다.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-black/40 border-b border-zinc-200 dark:border-white/5">
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">ID</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">문제</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">언어</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">상태</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">제출 시각</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-zinc-500 text-zinc-500 font-medium">
                  {sub.problems?.problem_no ? `${sub.problems.problem_no}번` : sub.problem_id}
                </td>
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                  <Link href={`/problems/${sub.problem_id}`} className="hover:underline">
                    {sub.problems?.problem_no ? `${sub.problems.problem_no}번` : sub.problem_id}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-medium">
                  {sub.language || "unknown"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {(sub.status === "PENDING" || sub.status === "QUEUED") && (
                      <span className="flex items-center text-zinc-500 bg-zinc-500/10 px-3 py-1 rounded-full text-sm font-medium">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        채점 대기 중
                      </span>
                    )}
                    {sub.status === "RUNNING" && (
                      <span className="flex items-center text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full text-sm font-medium">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        채점 중
                      </span>
                    )}
                    {(sub.status === "AC" || sub.result === "AC") && (
                      <span className="flex items-center text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        맞았습니다!!
                      </span>
                    )}
                    {(["WA", "CE", "RE", "TLE", "MLE"].includes(sub.status) || ["WA", "CE", "RE", "TLE", "MLE"].includes(sub.result)) && (
                      <span className="flex items-center text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-sm font-medium">
                        <XCircle className="w-4 h-4 mr-2" />
                        {(sub.result || sub.status) === "WA" ? "틀렸습니다" :
                          (sub.result || sub.status) === "CE" ? "컴파일 에러" :
                            (sub.result || sub.status) === "RE" ? "런타임 에러" :
                              (sub.result || sub.status) === "TLE" ? "시간 초과" :
                                (sub.result || sub.status) === "MLE" ? "메모리 초과" : "오답"}
                      </span>
                    )}
                    {(sub.status === "ERROR" || sub.status === "FAILED") && (
                      <span className="flex items-center text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full text-sm font-medium">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        채점 실패
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(sub.submitted_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  {user ? "아직 제출 내역이 없습니다. 문제를 풀어보세요!" : "로그인 후 제출 내역을 확인할 수 있습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
