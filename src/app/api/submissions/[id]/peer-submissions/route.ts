import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const PAGE_SIZE = 10;

const sortConfig = {
  recent: { column: "submitted_at", ascending: false },
  memory: { column: "memory_kb", ascending: true },
  time: { column: "execution_time_ms", ascending: true },
} as const;

type SortType = keyof typeof sortConfig;

type CurrentSubmissionRow = {
  id: number;
  problem_id: number;
  language: string | null;
};

type PeerSubmissionRow = {
  id: number;
  user_id: string | null;
  result: string | null;
  language: string | null;
  execution_time_ms: number | null;
  memory_kb: number | null;
  submitted_at: string | null;
};

type UserRow = {
  id: string;
  nickname: string | null;
};

function getSortType(value: string | null): SortType {
  if (value === "memory" || value === "time") return value;
  return "recent";
}

function getPage(value: string | null) {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const submissionId = Number(id);

  if (!Number.isInteger(submissionId)) {
    return NextResponse.json({ error: "Invalid submission id" }, { status: 400 });
  }

  const sort = getSortType(request.nextUrl.searchParams.get("sort"));
  const page = getPage(request.nextUrl.searchParams.get("page"));
  const offset = (page - 1) * PAGE_SIZE;
  const supabase = createAdminClient();

  const { data: currentSubmission, error: currentError } = await supabase
    .from("submissions")
    .select("id, problem_id, language")
    .eq("id", submissionId)
    .or("is_deleted.is.false,is_deleted.is.null")
    .maybeSingle();

  if (currentError || !currentSubmission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const current = currentSubmission as CurrentSubmissionRow;

  if (!current.language) {
    return NextResponse.json({
      items: [],
      page,
      pageSize: PAGE_SIZE,
      totalCount: 0,
    });
  }

  const config = sortConfig[sort];
  const { data: peerRows, error: peerError, count } = await supabase
    .from("submissions")
    .select(
      "id, user_id, result, language, execution_time_ms, memory_kb, submitted_at",
      { count: "exact" },
    )
    .eq("problem_id", current.problem_id)
    .eq("language", current.language)
    .in("result", ["AC", "ACCEPTED"])
    .or("is_deleted.is.false,is_deleted.is.null")
    .neq("id", current.id)
    .order(config.column, {
      ascending: config.ascending,
      nullsFirst: false,
    })
    .range(offset, offset + PAGE_SIZE - 1);

  if (peerError) {
    return NextResponse.json({ error: peerError.message }, { status: 500 });
  }

  const peers = (peerRows ?? []) as PeerSubmissionRow[];
  const userIds = Array.from(
    new Set(
      peers
        .map((submission) => submission.user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );
  const nicknameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, nickname")
      .in("id", userIds);

    ((users ?? []) as UserRow[]).forEach((user) => {
      nicknameMap.set(user.id, user.nickname || "익명");
    });
  }

  return NextResponse.json({
    items: peers.map((submission) => ({
      id: submission.id,
      nickname: submission.user_id
        ? nicknameMap.get(submission.user_id) ?? "익명"
        : "익명",
      result: submission.result,
      language: submission.language,
      executionTimeMs: submission.execution_time_ms,
      memoryKb: submission.memory_kb,
      submittedAt: submission.submitted_at,
    })),
    page,
    pageSize: PAGE_SIZE,
    totalCount: count ?? 0,
  });
}
