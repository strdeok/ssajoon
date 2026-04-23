import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClientForm from "./ClientForm";

export default async function Mypage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("nickname, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
          계정 관리
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          회원님의 계정 정보를 확인하고 수정할 수 있습니다.
        </p>
      </div>
      
      <ClientForm 
        initialNickname={userData?.nickname || user.user_metadata?.nickname || ""} 
        userEmail={user.email || ""}
      />
    </div>
  );
}
