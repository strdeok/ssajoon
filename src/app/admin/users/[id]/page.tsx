import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/auth/isAdmin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Shield, Activity, XCircle, CheckCircle, Clock } from "lucide-react";
import { softDeleteUser, restoreUser } from "../actions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const { id } = await params;
  const supabaseAdmin = createAdminClient();

  // 1. 유저 기본 정보 (RLS 우회)
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user) {
    redirect("/admin/users");
  }

  // 2. 제출 요약 정보
  // 전체 제출 수
  const { count: totalSubmissions } = await supabaseAdmin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id);

  // 정답(AC) 수
  const { count: acSubmissions } = await supabaseAdmin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)
    .eq('result', 'AC');

  // 최근 제출 목록 (최대 10개)
  const { data: recentSubmissions } = await supabaseAdmin
    .from('submissions')
    .select(`
      id, 
      problem_id, 
      language, 
      status, 
      result, 
      submitted_at,
      problems (title)
    `)
    .eq('user_id', id)
    .order('submitted_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/users"
            className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">사용자 상세 정보</h1>
        </div>
        
        {/* 소프트 삭제 버튼 (서버 액션) */}
        <form action={async () => {
          "use server";
          if (user.is_deleted) {
            await restoreUser(user.id);
          } else {
            await softDeleteUser(user.id);
          }
        }}>
          {user.is_deleted ? (
            <button 
              type="submit"
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              계정 복구하기
            </button>
          ) : (
            <button 
              type="submit"
              className="px-4 py-2 bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
            >
              강제 탈퇴 처리
            </button>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 프로필 정보 */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-md">
                <User className="w-10 h-10 text-zinc-400" />
              </div>
            </div>
            
            <div className="space-y-4 text-center">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{user.nickname || '이름 없음'}</h2>
                <p className="text-sm font-mono text-zinc-500 mt-1">{user.id}</p>
              </div>
              
              <div className="flex justify-center gap-2">
                {user.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-md text-xs font-bold">
                    <Shield className="w-3 h-3" /> 관리자
                  </span>
                )}
                {user.is_deleted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-md text-xs font-bold">
                    <XCircle className="w-3 h-3" /> 탈퇴됨
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md text-xs font-bold">
                    <CheckCircle className="w-3 h-3" /> 활성 상태
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> 가입일</span>
                <span className="text-zinc-900 dark:text-white font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              {user.deleted_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2"><XCircle className="w-4 h-4" /> 탈퇴일</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{new Date(user.deleted_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> 통계 요약
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalSubmissions || 0}</p>
                <p className="text-xs text-zinc-500 mt-1">총 제출</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{acSubmissions || 0}</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">정답(AC)</p>
              </div>
            </div>
          </div>
        </div>

        {/* 활동 내역 */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" /> 최근 제출 기록 (최대 10건)
            </h3>
            
            {(!recentSubmissions || recentSubmissions.length === 0) ? (
              <div className="text-center py-12 text-zinc-500">제출 기록이 없습니다.</div>
            ) : (
              <div className="space-y-4">
                {recentSubmissions.map((sub: any) => {
                  const isAC = sub.result === 'AC';
                  return (
                    <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isAC ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                            {sub.result || sub.status}
                          </span>
                          <span className="text-xs font-mono text-zinc-500 uppercase">{sub.language}</span>
                        </div>
                        <Link href={`/problems/${sub.problem_id}`} className="text-sm font-medium text-zinc-900 dark:text-white hover:underline">
                          {sub.problems?.title || `문제 #${sub.problem_id}`}
                        </Link>
                      </div>
                      <div className="text-xs text-zinc-500 text-right">
                        {new Date(sub.submitted_at).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
