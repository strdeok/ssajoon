import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SubmissionRow = {
  id: number | string;
  language: string | null;
  result: string | null;
  status: string | null;
  execution_time_ms: number | null;
  memory_kb: number | null;
  submitted_at: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .select(
      "id, language, result, status, execution_time_ms, memory_kb, submitted_at",
    )
    .eq("problem_id", id)
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = ((data ?? []) as SubmissionRow[]).map((submission) => ({
    id:
      typeof submission.id === "number"
        ? submission.id
        : Number.parseInt(submission.id, 10),
    language: submission.language,
    result: submission.result,
    status: submission.status,
    executionTimeMs: submission.execution_time_ms,
    memoryKb: submission.memory_kb,
    submittedAt: submission.submitted_at,
  }));

  return NextResponse.json({ items });
}
