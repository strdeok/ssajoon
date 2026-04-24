"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/auth/isAdmin";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";

export async function softDeleteUser(userId: string) {
  // 현재 요청 사용자가 관리자인지 먼저 확인한다.
  await requireAdmin();

  // 현재 로그인 사용자 확인용 일반 클라이언트를 생성한다.
  const supabase = await createClient();

  // 실제 DB 업데이트용 관리자 클라이언트를 생성한다.
  const supabaseAdmin = createAdminClient();

  // 자기 자신을 삭제하려는 경우를 막기 위해 현재 로그인 유저를 가져온다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 관리자 본인을 탈퇴 처리하려는 경우 차단한다.
  if (user?.id === userId) {
    throw new Error("자기 자신은 탈퇴 처리할 수 없습니다.");
  }

  // 관리자 클라이언트로 대상 사용자를 soft delete 처리한다.
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // 업데이트 실패 시 에러를 던진다.
  if (error) {
    console.error("사용자 소프트 탈퇴 실패:", error);
    throw new Error("사용자 탈퇴 처리에 실패했습니다.");
  }

  // 관리자 사용자 목록과 상세 페이지 캐시를 갱신한다.
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function restoreUser(userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq("id", userId);

  if (error) {
    console.error("사용자 복구 실패:", error);
    throw new Error("사용자 복구 처리에 실패했습니다.");
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}
