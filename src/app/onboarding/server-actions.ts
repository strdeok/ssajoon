"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function checkNicknameDuplicate(nickname: string) {
  const normalizedNickname = nickname.trim();

  if (!normalizedNickname) {
    return { isDuplicate: false, error: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isDuplicate: false, error: "로그인이 필요합니다." };
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
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
