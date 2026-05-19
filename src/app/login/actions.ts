"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const next = String(formData.get("next") || "/");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `https://ssajoon.vercel.app/auth/callback?next=${encodeURIComponent(safeNext)}`,
      // redirectTo: "http://localhost:3000/auth/callback",
    },
  });

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
