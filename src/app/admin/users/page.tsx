import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/auth/isAdmin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserX, UserCheck, Shield } from "lucide-react";

export default async function AdminUsersPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const supabaseAdmin = createAdminClient();
  
  // Fetch users using service role to bypass RLS
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, nickname, role, is_deleted, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">사용자 관리</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">플랫폼 가입 사용자 목록 및 상태를 관리합니다.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-4 font-semibold">닉네임</th>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">권한</th>
                <th className="px-6 py-4 font-semibold">상태</th>
                <th className="px-6 py-4 font-semibold">가입일</th>
                <th className="px-6 py-4 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
              {users?.map(user => (
                <tr key={user.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${user.is_deleted ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{user.nickname || '이름 없음'}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{String(user.id).substring(0, 8)}...</td>
                  <td className="px-6 py-4">
                    {user.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-md text-xs font-bold">
                        <Shield className="w-3 h-3" /> 관리자
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-md text-xs font-medium">
                        일반 회원
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_deleted ? (
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                        <UserX className="w-4 h-4" /> 탈퇴됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <UserCheck className="w-4 h-4" /> 정상
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/users/${user.id}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors"
                    >
                      상세 보기 &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    가입한 사용자가 없습니다.
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
