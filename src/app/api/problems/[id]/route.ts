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

  const { data: examples } = await supabase
    .from("problem_examples")
    .select("*")
    .eq("problem_id", id)
    .order("example_order", { ascending: true });

  problem.problem_examples = examples || [];

  return NextResponse.json(problem);
}
