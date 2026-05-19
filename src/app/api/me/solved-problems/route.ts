import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SubmissionProblemIdRow = {
  problem_id: number | string | null;
};

type ProblemIdRow = {
  id: number;
};

const ACCEPTED_RESULTS = ["AC", "ACCEPTED"];
const PAGE_SIZE = 1000;
const CHUNK_SIZE = 300;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { solvedProblemIds: [] },
      {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  const solvedProblemIds: number[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("submissions")
      .select("problem_id")
      .eq("user_id", user.id)
      .or("is_deleted.is.false,is_deleted.is.null")
      .in("result", ACCEPTED_RESULTS)
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

    const rows = (data ?? []) as SubmissionProblemIdRow[];
    rows.forEach((row) => {
      const problemId = Number(row.problem_id);
      if (Number.isInteger(problemId)) {
        solvedProblemIds.push(problemId);
      }
    });

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const uniqueSolvedProblemIds = Array.from(new Set(solvedProblemIds));
  const visibleSolvedProblemIds: number[] = [];

  for (let i = 0; i < uniqueSolvedProblemIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueSolvedProblemIds.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("problems")
      .select("id")
      .in("id", chunk)
      .eq("is_deleted", false);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    ((data ?? []) as ProblemIdRow[]).forEach((problem) => {
      visibleSolvedProblemIds.push(problem.id);
    });
  }

  return NextResponse.json(
    { solvedProblemIds: visibleSolvedProblemIds },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
