import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { RejoinClient } from "./RejoinClient";

export default async function RejoinPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("is_deleted")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData?.is_deleted) {
    redirect("/");
  }

  return <RejoinClient initialMessage={params.message} />;
}