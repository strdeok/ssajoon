"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function setupProfile(formData: FormData) {
  const nickname = formData.get("nickname") as string;
  const school_number = formData.get("school_number") as string;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Validate that both nickname and school_number are provided
  if (!nickname.trim()) {
    return redirect(`/onboarding?message=${encodeURIComponent("닉네임을 입력해주세요.")}`);
  }

  if (!school_number.trim() || school_number.length !== 7) {
    return redirect(`/onboarding?message=${encodeURIComponent("올바른 학번을 입력해주세요.")}`);
  }

  // Check unique nickname using public users table
  const { data: existingProfile, error: nicknameError } = await supabase
    .from("users")
    .select("nickname")
    .eq("nickname", nickname.trim())
    .maybeSingle();

  if (nicknameError) {
    return redirect(`/onboarding?message=${encodeURIComponent("닉네임 확인 중 오류가 발생했습니다.")}`);
  }

  if (existingProfile) {
    return redirect(`/onboarding?message=${encodeURIComponent("이미 존재하는 닉네임입니다.")}`);
  }

  // Check unique school_number using public users table
  const { data: existingSchoolNumber, error: schoolError } = await supabase
    .from("users")
    .select("school_number")
    .eq("school_number", parseInt(school_number))
    .maybeSingle();

  if (schoolError) {
    return redirect(`/onboarding?message=${encodeURIComponent("학번 확인 중 오류가 발생했습니다.")}`);
  }

  if (existingSchoolNumber) {
    return redirect(`/onboarding?message=${encodeURIComponent("이미 존재하는 학번입니다.")}`);
  }
  // Update Auth layer
  const { error: authError } = await supabase.auth.updateUser({
    data: { nickname, school_number }
  });

  if (authError) {
    return redirect(`/onboarding?message=${encodeURIComponent(authError.message)}`);
  }

  // Update Database layer natively replacing temporary nickname
  const { error: dbError } = await supabase
    .from("users")
    .update({ nickname, school_number })
    .eq("id", user.id);

  if (dbError) {
     return redirect(`/onboarding?message=${encodeURIComponent(dbError.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
