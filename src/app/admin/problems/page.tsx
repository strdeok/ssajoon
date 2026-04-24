import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/auth/isAdmin";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { redirect } from "next/navigation";
import { deleteProblem } from "./actions";
import { DeleteProblemButton } from "@/components/admin/DeleteProblemButton";

export default async function AdminProblemsPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const supabaseAdmin = createAdminClient();
  // 관리자는 soft delete 된 문제도 볼 수 있도록 전체 조회
  const { data: problems } = await supabaseAdmin
    .from('problems')
    .select('id, title, category, difficulty, created_at, is_deleted')
    .order('id', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">문제 관리</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">등록된 알고리즘 문제를 관리합니다.</p>
        </div>
        <Link 
          href="/admin/problems/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 문제 작성
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">카테고리</th>
                <th className="px-6 py-4 font-semibold">제목</th>
                <th className="px-6 py-4 font-semibold">난이도</th>
                <th className="px-6 py-4 font-semibold">상태</th>
                <th className="px-6 py-4 font-semibold">생성일</th>
                <th className="px-6 py-4 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
              {problems?.map(problem => (
                <tr key={problem.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${problem.is_deleted ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{problem.id}</td>
                  <td className="px-6 py-4">{problem.category || '-'}</td>
                  <td className="px-6 py-4 font-medium">{problem.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs font-semibold">
                      {problem.difficulty || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {problem.is_deleted ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        삭제됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        활성
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-500">
                    {new Date(problem.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* soft delete 된 문제는 수정 버튼을 숨김 */}
                      {!problem.is_deleted && (
                        <Link
                          href={`/admin/problems/${problem.id}/edit`}
                          className="p-2 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      {/* soft delete 된 문제는 이미 삭제되었으니 버튼 비활성화 */}
                      <form action={async () => {
                        "use server";
                        await deleteProblem(problem.id);
                      }}>
                        <DeleteProblemButton
                          disabled={problem.is_deleted}
                          title={problem.is_deleted ? '이미 삭제된 문제' : '삭제'}
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {(!problems || problems.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    등록된 문제가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
