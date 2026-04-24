"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/auth/isAdmin";
import { revalidatePath } from "next/cache";

export async function softDeleteUser(userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // 자기 자신을 삭제하려는 경우 차단 (안전 장치)
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) {
    throw new Error("자기 자신은 탈퇴 처리할 수 없습니다.");
  }

  const { error } = await supabase
    .from('users')
    .update({ 
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error("사용자 소프트 탈퇴 실패:", error);
    throw new Error("사용자 탈퇴 처리에 실패했습니다.");
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
}

export async function restoreUser(userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({ 
      is_deleted: false,
      deleted_at: null
    })
    .eq('id', userId);

  if (error) {
    console.error("사용자 복구 실패:", error);
    throw new Error("사용자 복구 처리에 실패했습니다.");
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
}
