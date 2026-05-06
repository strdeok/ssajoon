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

  // Check unique nickname using public users table
  const { data: existingProfile } = await supabase
    .from("users")
    .select("nickname")
    .eq("nickname", nickname)
    .single();

  if (existingProfile) {
    return redirect(`/onboarding?message=${encodeURIComponent("이미 존재하는 닉네임입니다.")}`);
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
