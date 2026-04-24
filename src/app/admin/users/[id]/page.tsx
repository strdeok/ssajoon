import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/auth/isAdmin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Shield, Activity, XCircle, CheckCircle, Clock } from "lucide-react";
import { softDeleteUser, restoreUser } from "../actions";
import { ProblemSearch } from "@/components/admin/ProblemSearch";
import { UserProblemHistory, GroupedProblemHistory } from "@/components/admin/UserProblemHistory";
import { Pagination } from "@/components/common/Pagination";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ historyPage?: string; problemSearch?: string }>;
}) {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const { id } = await params;
  const { historyPage, problemSearch } = await searchParams;
  
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

  // 3. 문제 풀이 히스토리 (페이지네이션 및 그룹화)
  const currentPage = parseInt(historyPage || "1", 10) || 1;
  const pageSize = 20; // 페이지당 20건의 제출 기록

  let historyQuery = supabaseAdmin
    .from('submissions')
    .select(`
      id, 
      problem_id, 
      language, 
      status, 
      result, 
      submitted_at,
      execution_time_ms,
      memory_kb,
      failed_testcase_order,
      source_code,
      problems!inner (title)
    `, { count: 'exact' })
    .eq('user_id', id);

  if (problemSearch && problemSearch.trim() !== '') {
    historyQuery = historyQuery.ilike('problems.title', `%${problemSearch.trim()}%`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: submissionsData, count: historyCount } = await historyQuery
    .order('submitted_at', { ascending: false })
    .range(from, to);

  const totalHistoryCount = historyCount || 0;
  const totalHistoryPages = Math.ceil(totalHistoryCount / pageSize);

  // 문제 단위로 그룹화
  const groupedMap = new Map<number, GroupedProblemHistory>();
  
  if (submissionsData) {
    submissionsData.forEach((sub: any) => {
      const pId = sub.problem_id;
      if (!groupedMap.has(pId)) {
        groupedMap.set(pId, {
          problem_id: pId,
          title: sub.problems?.title || `문제 #${pId}`,
          submissions: []
        });
      }
      groupedMap.get(pId)!.submissions.push({
        id: sub.id,
        problem_id: pId,
        language: sub.language,
        status: sub.status,
        result: sub.result,
        submitted_at: sub.submitted_at,
        execution_time_ms: sub.execution_time_ms,
        memory_kb: sub.memory_kb,
        failed_testcase_order: sub.failed_testcase_order,
        source_code: sub.source_code,
        problems: sub.problems
      });
    });
  }

  const groupedData = Array.from(groupedMap.values());

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
                <p className="text-sm font-mono text-zinc-500 mt-1">{String(user.id).substring(0, 8)}...</p>
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

        {/* 풀은 문제 히스토리 영역 */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" /> 풀은 문제 히스토리
              </h3>
              <ProblemSearch placeholder="문제 이름 검색..." />
            </div>
            
            <UserProblemHistory groupedData={groupedData} />

            <Pagination 
              totalPages={totalHistoryPages} 
              currentPage={currentPage} 
              pageParamName="historyPage" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
