import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  // 일반 사용자에게는 soft delete 된 문제를 노출하지 않는다.
  const { data: problems, error } = await supabase
    .from("problems")
    .select("*")
    .eq("is_deleted", false)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(problems);
}
