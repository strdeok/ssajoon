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

  // soft delete 되지 않은 예제 표시 (기존 유지, 하위 호환성)
  const { data: examples } = await supabase
    .from("problem_examples")
    .select("*")
    .eq("problem_id", id)
    .eq("is_deleted", false)
    .order("example_order", { ascending: true });

  problem.problem_examples = examples || [];

  // 문제의 테스트케이스 조회 (틀린 테스트케이스 보기 및 보정용)
  const { data: testcases } = await supabase
    .from("problem_testcases")
    .select("id, problem_id, testcase_order, input_text, expected_output, is_hidden")
    .eq("problem_id", id)
    .eq("is_deleted", false)
    .order("testcase_order", { ascending: true });
    
  problem.problem_testcases = testcases || [];

  return NextResponse.json(problem);
}
