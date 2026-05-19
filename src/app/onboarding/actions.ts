"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setupProfile(formData: FormData) {
  const nickname = String(formData.get("nickname") || "").trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  if (!nickname) {
    return redirect(
      `/onboarding?message=${encodeURIComponent("닉네임을 입력해주세요.")}`,
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data: existingProfile, error: nicknameError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("nickname", nickname)
    .neq("id", user.id)
    .maybeSingle();

  if (nicknameError) {
    return redirect(
      `/onboarding?message=${encodeURIComponent(
        "닉네임 확인 중 오류가 발생했습니다.",
      )}`,
    );
  }

  if (existingProfile) {
    return redirect(
      `/onboarding?message=${encodeURIComponent(
        "이미 존재하는 닉네임입니다.",
      )}`,
    );
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { nickname, show_algorithm: true },
  });

  if (authError) {
    return redirect(
      `/onboarding?message=${encodeURIComponent(authError.message)}`,
    );
  }

  const { error: dbError } = await supabase
    .from("users")
    .update({ nickname, show_algorithm: true })
    .eq("id", user.id);

  if (dbError) {
    return redirect(
      `/onboarding?message=${encodeURIComponent(dbError.message)}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}
