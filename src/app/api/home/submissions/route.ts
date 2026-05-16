import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type JoinedProblem =
  | {
      title: string | null;
    }
  | {
      title: string | null;
    }[]
  | null;

type SubmissionRow = {
  problem_id: number;
  result: string | null;
  submitted_at: string | null;
};

type RecentSubmissionRow = SubmissionRow & {
  id: number;
  language: string | null;
  problems: JoinedProblem;
};

type SubmissionItem = RecentSubmissionRow & {
  problem_title: string;
};

type HomeSubmissionStats = {
  solved: number;
  accuracy: number;
  weeklySubmissionCount: number;
};

const ACCEPTED_RESULTS = new Set(["AC", "ACCEPTED"]);

function normalizeResult(result: string | null | undefined) {
  return (result ?? "").trim().toUpperCase();
}

function isAcceptedResult(result: string | null | undefined) {
  return ACCEPTED_RESULTS.has(normalizeResult(result));
}

function getProblemTitle(joinedProblem: JoinedProblem, problemId: number) {
  const problem = Array.isArray(joinedProblem)
    ? joinedProblem[0]
    : joinedProblem;
  return problem?.title || `문제 #${problemId}`;
}

function getStartOfCurrentWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function calculateUserStats(allSubmissions: SubmissionRow[]) {
  const total = allSubmissions.length;
  const acceptedSubmissions = allSubmissions.filter((submission) =>
    isAcceptedResult(submission.result),
  );
  const solved = new Set(
    acceptedSubmissions.map((submission) => submission.problem_id),
  ).size;
  const startOfWeek = getStartOfCurrentWeek(new Date());
  const weeklySubmissionCount = allSubmissions.filter((submission) => {
    if (!submission.submitted_at) return false;
    return new Date(submission.submitted_at) >= startOfWeek;
  }).length;

  return {
    solved,
    accuracy:
      total > 0 ? Math.round((acceptedSubmissions.length / total) * 100) : 0,
    weeklySubmissionCount,
  } satisfies HomeSubmissionStats;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
        stats: {
          solved: 0,
          accuracy: 0,
          weeklySubmissionCount: 0,
        },
        recentSubmissions: [],
      },
      { status: 401 },
    );
  }

  const statsQuery = supabase
    .from("submissions")
    .select("problem_id, result, submitted_at")
    .eq("user_id", user.id)
    .eq("is_deleted", false);

  const recentQuery = supabase
    .from("submissions")
    .select("id, problem_id, language, result, submitted_at, problems(title)")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(6);

  const [
    { data: statsData, error: statsError },
    { data: recentData, error: recentError },
  ] = await Promise.all([statsQuery, recentQuery]);

  if (statsError || recentError) {
    return NextResponse.json(
      { error: statsError?.message ?? recentError?.message },
      { status: 500 },
    );
  }

  const allSubmissions = (statsData ?? []) as SubmissionRow[];
  const recentSubmissions: SubmissionItem[] = (
    (recentData ?? []) as RecentSubmissionRow[]
  ).map((submission) => ({
    ...submission,
    problem_title: getProblemTitle(submission.problems, submission.problem_id),
  }));

  return NextResponse.json({
    authenticated: true,
    stats: calculateUserStats(allSubmissions),
    recentSubmissions,
  });
}
