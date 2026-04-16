import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: problem, error } = await supabase.from("problems").select("*").eq("id", id).single();

  if (error || !problem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Map snake_case to camelCase for the frontend
  if (problem.test_cases) {
    problem.testCases = problem.test_cases;
    delete problem.test_cases;
  }

  return NextResponse.json(problem);
}
