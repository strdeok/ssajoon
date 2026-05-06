import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // category 컬럼만 선택, 전체 문제에서 고유값 추출 (최대 10000개)
  const { data, error } = await supabase
    .from("problems")
    .select("category")
    .eq("is_deleted", false)
    .eq("is_hidden", false)
    .not("category", "is", null)
    .range(0, 9999);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categories = [
    ...new Set(data?.map((p) => p.category).filter(Boolean)),
  ].sort() as string[];

  return NextResponse.json(categories);
}
