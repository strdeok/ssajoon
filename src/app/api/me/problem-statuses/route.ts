import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SubmissionProblemStatusRow = {
  problem_id: number | string | null;
  result: string | null;
};

const ACCEPTED_RESULTS = new Set(["AC", "ACCEPTED"]);
const PAGE_SIZE = 1000;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { solvedProblemIds: [], attemptedProblemIds: [], wrongProblemIds: [] },
      {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  const solvedProblemIds = new Set<number>();
  const attemptedProblemIds = new Set<number>();
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("submissions")
      .select("problem_id, result")
      .eq("user_id", user.id)
      .or("is_deleted.is.false,is_deleted.is.null")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    const rows = (data ?? []) as SubmissionProblemStatusRow[];
    rows.forEach((row) => {
      const problemId = Number(row.problem_id);
      if (!Number.isInteger(problemId)) return;

      attemptedProblemIds.add(problemId);
      if (ACCEPTED_RESULTS.has((row.result ?? "").trim().toUpperCase())) {
        solvedProblemIds.add(problemId);
      }
    });

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const wrongProblemIds = Array.from(attemptedProblemIds).filter(
    (problemId) => !solvedProblemIds.has(problemId),
  );

  return NextResponse.json(
    {
      solvedProblemIds: Array.from(solvedProblemIds),
      attemptedProblemIds: Array.from(attemptedProblemIds),
      wrongProblemIds,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
