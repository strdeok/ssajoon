import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProblemId = string | number;

type ProblemStats = {
  problem_id: ProblemId;
  attempted_users: number;
  solved_users: number;
  total_submissions: number;
  accepted_submissions: number;
  acceptance_rate: number;
};

type SubmissionRow = {
  problem_id: ProblemId;
  user_id: string;
  result: string | null;
};

type InternalStats = {
  attemptedUsers: Set<string>;
  solvedUsers: Set<string>;
  totalSubmissions: number;
  acceptedSubmissions: number;
};

const ACCEPTED_RESULTS = new Set(["AC", "ACCEPTED"]);
const MAX_PROBLEM_IDS = 50;
const PAGE_SIZE = 1000;

let cachedSupabaseAdmin: SupabaseClient | null = null;

function getStatsKey(problemId: ProblemId) {
  return String(problemId);
}

function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경변수가 없습니다.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  }

  cachedSupabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cachedSupabaseAdmin;
}

function normalizeProblemIds(rawProblemIds: unknown) {
  if (!Array.isArray(rawProblemIds)) {
    return null;
  }

  const normalizedProblemIds = rawProblemIds
    .filter((problemId): problemId is ProblemId => typeof problemId === "string" || typeof problemId === "number")
    .map((problemId) => (typeof problemId === "string" ? problemId.trim() : problemId))
    .filter((problemId) => problemId !== "" && problemId !== null && problemId !== undefined);

  const uniqueMap = new Map<string, ProblemId>();

  normalizedProblemIds.forEach((problemId) => {
    uniqueMap.set(getStatsKey(problemId), problemId);
  });

  return Array.from(uniqueMap.values());
}

function createInitialStatsMap(problemIds: ProblemId[]) {
  const statsMap = new Map<string, InternalStats>();

  problemIds.forEach((problemId) => {
    statsMap.set(getStatsKey(problemId), {
      attemptedUsers: new Set<string>(),
      solvedUsers: new Set<string>(),
      totalSubmissions: 0,
      acceptedSubmissions: 0,
    });
  });

  return statsMap;
}

function isAccepted(result: string | null) {
  if (!result) return false;

  const normalizedResult = result.trim().toUpperCase();

  return ACCEPTED_RESULTS.has(normalizedResult);
}

function applySubmissionToStats(statsMap: Map<string, InternalStats>, row: SubmissionRow) {
  const stats = statsMap.get(getStatsKey(row.problem_id));

  if (!stats) return;

  stats.totalSubmissions += 1;
  stats.attemptedUsers.add(row.user_id);

  if (isAccepted(row.result)) {
    stats.acceptedSubmissions += 1;
    stats.solvedUsers.add(row.user_id);
  }
}

function buildProblemStats(problemIds: ProblemId[], statsMap: Map<string, InternalStats>) {
  return problemIds.map((problemId): ProblemStats => {
    const stats = statsMap.get(getStatsKey(problemId))!;
    const attemptedUsers = stats.attemptedUsers.size;
    const solvedUsers = stats.solvedUsers.size;

    const acceptanceRate = attemptedUsers === 0
      ? 0
      : Math.round((solvedUsers / attemptedUsers) * 1000) / 10;

    return {
      problem_id: problemId,
      attempted_users: attemptedUsers,
      solved_users: solvedUsers,
      total_submissions: stats.totalSubmissions,
      accepted_submissions: stats.acceptedSubmissions,
      acceptance_rate: acceptanceRate,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const problemIds = normalizeProblemIds(body.problemIds);

    if (!problemIds) {
      return NextResponse.json(
        { error: "problemIds must be an array" },
        { status: 400 },
      );
    }

    if (problemIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    if (problemIds.length > MAX_PROBLEM_IDS) {
      return NextResponse.json(
        { error: `problemIds must be less than or equal to ${MAX_PROBLEM_IDS}` },
        { status: 400 },
      );
    }

    console.log("문제 통계 요청 problemIds:", problemIds);

    const supabaseAdmin = getSupabaseAdmin();
    const statsMap = createInitialStatsMap(problemIds);

    let from = 0;
    let totalFetchedRows = 0;

    while (true) {
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabaseAdmin
        .from("submissions")
        .select("problem_id, user_id, result")
        .in("problem_id", problemIds)
        .range(from, to);

      if (error) {
        console.error("문제 통계 조회 실패:", error);

        return NextResponse.json(
          { error: "Failed to fetch problem stats" },
          { status: 500 },
        );
      }

      const rows = (data ?? []) as SubmissionRow[];

      totalFetchedRows += rows.length;

      if (from === 0) {
        console.log("문제 통계 submissions 조회 row 수:", rows.length);
        console.log("문제 통계 submissions 샘플:", rows.slice(0, 5));
      }

      rows.forEach((row) => {
        applySubmissionToStats(statsMap, row);
      });

      if (rows.length < PAGE_SIZE) {
        break;
      }

      from += PAGE_SIZE;
    }

    const result = buildProblemStats(problemIds, statsMap);

    console.log("문제 통계 총 조회 row 수:", totalFetchedRows);
    console.log("문제 통계 계산 결과 샘플:", result.slice(0, 5));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("문제 통계 API 오류:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}