import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClientForm from "./ClientForm";
import {
  GeneratedProblemsSection,
  GeneratedProblemsSectionSkeleton,
} from "@/components/mypage/GeneratedProblemsSection";

export default async function Mypage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("nickname, school_number, created_at, preferred_language")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex-1 max-w-8xl flex flex-col items-center mx-auto w-full p-8 space-y-8">
      <div className="max-w-7xl w-full">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
          계정 관리
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          회원님의 계정 정보를 확인하고 수정할 수 있습니다.
        </p>
      </div>
      <div className="flex flex-row gap-12 justify-center flex-1">
        <ClientForm
          initialNickname={
            userData?.nickname || user.user_metadata?.nickname || ""
          }
          initialSchoolNumber={
            userData?.school_number || user.user_metadata?.school_number || ""
          }
          initialPreferredLanguage={
            userData?.preferred_language || user.user_metadata?.preferred_language || ""
          }
          userEmail={user.email || ""}
        />

        <Suspense fallback={<GeneratedProblemsSectionSkeleton />}>
          <GeneratedProblemsSection />
        </Suspense>
      </div>
    </div>
  );
}
