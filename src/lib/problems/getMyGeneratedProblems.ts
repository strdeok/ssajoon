import { createClient } from "@/utils/supabase/server";

type GeneratedProblemSource = {
  id: number | string;
  title: string;
  difficulty: string | null;
  tag1: string | null;
  tag2: string | null;
};

type UserGeneratedProblemRow = {
  id: string | number;
  problem_id: number | string;
  generated_at: string;
  revealed_at: string | null;
  status: string;
  problems: GeneratedProblemSource | GeneratedProblemSource[] | null;
};

export type MyGeneratedProblem = {
  id: string;
  problemId: number | string;
  generatedAt: string;
  revealedAt: string | null;
  status: string;
  problem: GeneratedProblemSource;
};

type GetMyGeneratedProblemsResult =
  | { data: MyGeneratedProblem[]; error: null; isLoggedIn: true }
  | { data: []; error: string; isLoggedIn: true }
  | { data: []; error: null; isLoggedIn: false };

function normalizeJoinedProblem(
  problem: UserGeneratedProblemRow["problems"],
): GeneratedProblemSource | null {
  if (Array.isArray(problem)) {
    return problem[0] ?? null;
  }

  return problem;
}

export async function getMyGeneratedProblems(): Promise<GetMyGeneratedProblemsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: null, isLoggedIn: false };
  }

  const { data, error } = await supabase
    .from("user_generated_problems")
    .select(`
      id,
      problem_id,
      generated_at,
      revealed_at,
      status,
      problems (
        id,
        title,
        difficulty,
        tag1,
        tag2
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("generated_at", { ascending: false });

  if (error) {
    return {
      data: [],
      error: "생성한 문제 목록을 불러오지 못했습니다.",
      isLoggedIn: true,
    };
  }

  const generatedProblems = ((data as UserGeneratedProblemRow[] | null) ?? [])
    .map((row) => {
      const problem = normalizeJoinedProblem(row.problems);

      if (!problem) {
        return null;
      }

      return {
        id: String(row.id),
        problemId: row.problem_id,
        generatedAt: row.generated_at,
        revealedAt: row.revealed_at,
        status: row.status,
        problem,
      };
    })
    .filter((problem): problem is MyGeneratedProblem => problem !== null);

  return { data: generatedProblems, error: null, isLoggedIn: true };
}
