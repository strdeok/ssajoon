"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const nickname = formData.get("nickname") as string;
  
  if (!nickname || nickname.trim() === "") {
    return { success: false, message: "닉네임을 입력해주세요." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    // 1. auth.users 메타데이터 업데이트
    const { error: authError } = await supabase.auth.updateUser({
      data: { nickname }
    });

    if (authError) throw authError;

    // 2. public.users 테이블 업데이트
    const { error: dbError } = await supabase
      .from("users")
      .update({ nickname })
      .eq("id", user.id);

    if (dbError) {
      // PostgreSQL Unique Constraint Error (닉네임 중복 시)
      if (dbError.code === '23505') {
        return { success: false, message: "이미 사용 중인 닉네임입니다." };
      }
      throw dbError;
    }

    revalidatePath("/", "layout");
    return { success: true, message: "닉네임이 성공적으로 변경되었습니다." };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { success: false, message: "닉네임 변경 중 오류가 발생했습니다." };
  }
}

export async function withdrawAccount() {
  console.log("[탈퇴] 서버 액션 진입");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn("[탈퇴] 실패 — 로그인되지 않은 사용자");
    return { success: false, message: "로그인이 필요합니다." };
  }

  console.log(`[탈퇴] 사용자 확인: ${user.id}`);

  try {
    // 1. 소프트 탈퇴: 닉네임 변경으로 식별 불가 처리
    const { error: updateError } = await supabase.from("users").update({
      nickname: `탈퇴한 사용자 (${String(user.id).substring(0, 6)})`,
    }).eq("id", user.id);

    if (updateError) {
      console.error("[탈퇴] 닉네임 업데이트 실패:", updateError);
      return { success: false, message: "탈퇴 처리 중 오류가 발생했습니다." };
    }

    // 2. auth 메타데이터에서 닉네임 제거
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { nickname: null }
    });

    if (authUpdateError) {
      console.error("[탈퇴] auth 메타데이터 업데이트 실패:", authUpdateError);
      // 닉네임은 이미 변경되었으므로 계속 진행
    }

    // 3. 세션 로그아웃
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("[탈퇴] 로그아웃 실패:", signOutError);
      // 탈퇴 처리는 완료되었으므로 로그아웃 실패는 무시
    }

    console.log(`[탈퇴] 성공 — 사용자: ${user.id}`);
  } catch (error) {
    console.error("[탈퇴] 예외 발생:", error);
    return { success: false, message: "탈퇴 처리 중 오류가 발생했습니다." };
  }
  
  // 성공 시 홈으로 리다이렉트
  redirect("/");
}
