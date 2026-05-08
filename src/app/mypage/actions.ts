"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const nickname = String(formData.get("nickname") || "").trim();
  const schoolNumber = String(formData.get("school_number") || "").trim();
  const preferredLanguage = String(formData.get("preferred_language") || "").trim();
  
  if (!nickname) {
    return { success: false, message: "닉네임을 입력해주세요." };
  }

  if (!schoolNumber) {
    return { success: false, message: "학번을 입력해주세요." };
  }

  if (schoolNumber && !/^\d{7}$/.test(schoolNumber)) {
    return { success: false, message: "학번은 숫자 7자리여야 합니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    const { data: duplicatedNickname, error: nicknameError } = await supabase
      .from("users")
      .select("id")
      .eq("nickname", nickname)
      .neq("id", user.id)
      .maybeSingle();

    if (nicknameError) {
      return { success: false, message: "닉네임 중복 확인 중 오류가 발생했습니다." };
    }

    if (duplicatedNickname) {
      return { success: false, message: "이미 사용 중인 닉네임입니다." };
    }

    if (schoolNumber) {
      const { data: duplicatedSchoolNumber, error: schoolNumberError } = await supabase
        .from("users")
        .select("id")
        .eq("school_number", Number(schoolNumber))
        .neq("id", user.id)
        .maybeSingle();

      if (schoolNumberError) {
        return { success: false, message: "학번 중복 확인 중 오류가 발생했습니다." };
      }

      if (duplicatedSchoolNumber) {
        return { success: false, message: "이미 사용 중인 학번입니다." };
      }
    }

    // 1. auth.users 메타데이터 업데이트
    const { error: authError } = await supabase.auth.updateUser({
      data: { nickname, school_number: schoolNumber, preferred_language: preferredLanguage }
    });

    if (authError) throw authError;

    // 2. public.users 테이블 업데이트
    const { error: dbError } = await supabase
      .from("users")
      .update({ 
        nickname, 
        school_number: schoolNumber,
        preferred_language: preferredLanguage || null
      })
      .eq("id", user.id);

    if (dbError) {
      // PostgreSQL Unique Constraint Error (닉네임 중복 시)
      if (dbError.code === '23505') {
        return { success: false, message: "이미 사용 중인 닉네임 또는 학번입니다." };
      }
      throw dbError;
    }

    revalidatePath("/", "layout");
    return { success: true, message: "프로필이 성공적으로 저장되었습니다." };
  } catch {
    return { success: false, message: "프로필 저장 중 오류가 발생했습니다." };
  }
}

export async function checkProfileNicknameDuplicate(nickname: string) {
  const normalizedNickname = nickname.trim();

  if (!normalizedNickname) {
    return { isDuplicate: false, error: null };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isDuplicate: false, error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("nickname", normalizedNickname)
    .neq("id", user.id)
    .maybeSingle();

  if (error) {
    return { isDuplicate: false, error: error.message };
  }

  return { isDuplicate: Boolean(data), error: null };
}

export async function checkProfileSchoolNumberDuplicate(schoolNumber: string) {
  const normalizedSchoolNumber = schoolNumber.trim();

  if (!normalizedSchoolNumber) {
    return { isDuplicate: false, error: null };
  }

  if (!/^\d{7}$/.test(normalizedSchoolNumber)) {
    return { isDuplicate: false, error: "학번은 숫자 7자리여야 합니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isDuplicate: false, error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("school_number", Number(normalizedSchoolNumber))
    .neq("id", user.id)
    .maybeSingle();

  if (error) {
    return { isDuplicate: false, error: error.message };
  }

  return { isDuplicate: Boolean(data), error: null };
}

export async function withdrawAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, message: "탈퇴 처리 중 오류가 발생했습니다." };
    }

    const { error: submissionsError } = await supabase
      .from("submissions")
      .update({ is_deleted: true })
      .eq("user_id", user.id);

    if (submissionsError) {
      return { success: false, message: "제출 내역 탈퇴 처리 중 오류가 발생했습니다." };
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      // 탈퇴 처리는 완료되었으므로 로그아웃 실패는 무시
    }
  } catch {
    return { success: false, message: "탈퇴 처리 중 오류가 발생했습니다." };
  }
  
  // 성공 시 홈으로 리다이렉트
  redirect("/");
}
