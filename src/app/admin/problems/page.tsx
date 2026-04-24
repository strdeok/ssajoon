import { createClient } from "@/utils/supabase/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";
import { deleteProblem } from "./actions";

export default async function AdminProblemsPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const supabase = await createClient();
  const { data: problems } = await supabase
    .from('problems')
    .select('id, title, category, difficulty, created_at')
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
                <th className="px-6 py-4 font-semibold">생성일</th>
                <th className="px-6 py-4 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
              {problems?.map(problem => (
                <tr key={problem.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{problem.id}</td>
                  <td className="px-6 py-4">{problem.category || '-'}</td>
                  <td className="px-6 py-4 font-medium">{problem.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs font-semibold">
                      {problem.difficulty || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-500">
                    {new Date(problem.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/admin/problems/${problem.id}/edit`}
                        className="p-2 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <form action={async () => {
                        "use server";
                        await deleteProblem(problem.id);
                      }}>
                        <button 
                          type="submit"
                          className="p-2 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="삭제"
                          // 브라우저 기본 confirm은 서버 컴포넌트에서 쓰기 어려우므로 클라이언트 폼 래퍼를 권장하지만, 임시로 단순 서버 액션 사용
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
