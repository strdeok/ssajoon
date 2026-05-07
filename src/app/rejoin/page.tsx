import { AlertCircle, RotateCcw, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { keepAccountDeleted, restoreDeletedAccount } from "./actions";

export default async function RejoinPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("is_deleted")
    .eq("id", user.id)
    .single();

  if (!userData?.is_deleted) {
    redirect("/");
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-black min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-md flex flex-col gap-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl p-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <RotateCcw className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            다시 회원가입하시겠습니까?
          </h1>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            이 계정은 이전에 탈퇴 처리되었습니다. <br/> 다시 시작하면 계정과 기존 제출 내역이 복구됩니다.
          </p>
        </div>

        {params.message && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{params.message}</span>
          </div>
        )}

        <div className="grid gap-3">
          <form action={restoreDeletedAccount}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-all hover:bg-blue-500"
            >
              <RotateCcw className="h-4 w-4" />
              <span>다시 시작하기</span>
            </button>
          </form>

          <form action={keepAccountDeleted}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 py-3 font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <LogOut className="h-4 w-4" />
              <span>아니오, 로그인하지 않기</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
