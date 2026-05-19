"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type ActionResult = {
  success: boolean;
  message?: string;
};

export async function restoreDeletedAccount(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "로그인이 필요합니다.",
    };
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq("id", user.id);

  if (userError) {
    return {
      success: false,
      message: "계정 복구 중 오류가 발생했습니다.",
    };
  }

  const { error: submissionsError } = await supabase
    .from("submissions")
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq("user_id", user.id);

  if (submissionsError) {
    return {
      success: false,
      message: "제출 내역 복구 중 오류가 발생했습니다.",
    };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
  };
}

export async function keepAccountDeleted(): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      message: "로그아웃 중 오류가 발생했습니다.",
    };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
  };
}