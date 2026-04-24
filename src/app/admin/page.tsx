import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { BookOpen, Users, Activity } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  
  // 간단한 통계 데이터 조회 (RLS 우회를 위해 Admin 클라이언트 사용)
  const { count: userCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_deleted', false);
  // 활성 문제 수 (삭제된 문제 제외)
  const { count: problemCount } = await supabaseAdmin.from('problems').select('*', { count: 'exact', head: true }).eq('is_deleted', false);
  // 전체 제출 수 (삭제된 제출 제외)
  const { count: submissionCount } = await supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).eq('is_deleted', false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">대시보드</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">SSAJOON 플랫폼 전체 현황을 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 통계 카드 1 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-white/5 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">총 사용자</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{userCount || 0}명</h3>
            </div>
          </div>
        </div>

        {/* 통계 카드 2 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-white/5 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">등록된 문제</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{problemCount || 0}개</h3>
            </div>
          </div>
        </div>

        {/* 통계 카드 3 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-white/5 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">총 제출 횟수</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{submissionCount || 0}건</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-white/5 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">바로가기</h3>
          <div className="space-y-3">
            <Link 
              href="/admin/problems/new" 
              className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-zinc-900 dark:text-white">새 문제 작성</span>
              </div>
              <span className="text-sm text-blue-600 dark:text-blue-400">작성하기 &rarr;</span>
            </Link>
            <Link 
              href="/admin/users" 
              className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-zinc-900 dark:text-white">사용자 목록 보기</span>
              </div>
              <span className="text-sm text-purple-600 dark:text-purple-400">이동하기 &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
