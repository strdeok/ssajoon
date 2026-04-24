import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // soft delete 된 문제는 일반 사용자에게 404 처리
  const { data: problem, error } = await supabase
    .from("problems")
    .select("*")
    .eq("id", id)
    .eq("is_deleted", false)  // soft delete 방어
    .single();

  if (error || !problem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // soft delete 되지 않은 예제만 표시
  const { data: examples } = await supabase
    .from("problem_examples")
    .select("*")
    .eq("problem_id", id)
    .eq("is_deleted", false)  // soft delete 방어
    .order("example_order", { ascending: true });

  problem.problem_examples = examples || [];

  return NextResponse.json(problem);
}
