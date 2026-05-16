import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // category 컬럼만 선택, 전체 문제에서 고유값 추출 (최대 10000개)
  const { data, error } = await supabase
    .from("problems")
    .select("tag1, tag2")
    .eq("is_deleted", false)
    .not("tag1", "is", null)
    .range(0, 9999);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tags = new Set<string>();
  data?.forEach(p => {
    if (p.tag1) tags.add(p.tag1);
    if (p.tag2) tags.add(p.tag2);
  });

  const categories = Array.from(tags).sort() as string[];

  return NextResponse.json(categories);
}
