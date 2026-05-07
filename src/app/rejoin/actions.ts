"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function restoreDeletedAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq("id", user.id);

  if (userError) {
    redirect(`/rejoin?message=${encodeURIComponent("계정 복구 중 오류가 발생했습니다.")}`);
  }

  const { error: submissionsError } = await supabase
    .from("submissions")
    .update({ is_deleted: false })
    .eq("user_id", user.id);

  if (submissionsError) {
    redirect(`/rejoin?message=${encodeURIComponent("제출 내역 복구 중 오류가 발생했습니다.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function keepAccountDeleted() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
