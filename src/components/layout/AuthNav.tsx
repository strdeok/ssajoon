import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { signout } from "@/app/login/actions";
import { LogOut, UserCircle } from "lucide-react";

export async function AuthNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link 
        href="/login"
        className="px-4 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* 닉네임을 클릭 가능한 링크로 변경 */}
      <Link href="/mypage" className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group">
        <UserCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="max-w-[120px] truncate underline-offset-4 group-hover:underline" title={user.user_metadata?.nickname || user.email}>
          {user.user_metadata?.nickname || user.email}
        </span>
      </Link>
      <form action={signout}>
        <button
          type="submit"
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </form>
    </div>
  );
}
