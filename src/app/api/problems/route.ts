import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const DIFFICULTY_FILTER: Record<string, string[]> = {
  Easy: ["EASY", "Easy"],
  Medium: ["MEDIUM", "Medium"],
  "Medium-Hard": ["MEDIUM_HARD", "Medium Hard"],
  Hard: ["HARD", "Hard"],
  "Very-Hard": ["VERY_HARD", "Very Hard"],
};

const SORTABLE_COLUMNS = {
  id: "id",
  title: "title",
  tag1: "tag1",
  tag2: "tag2",
  difficulty: "difficulty",
  created_at: "created_at",
  attemptedUsers: "attemptedUsers",
  solvedUsers: "solvedUsers",
  acceptanceRate: "acceptanceRate",
  status: "status",
} as const;

type SortField = keyof typeof SORTABLE_COLUMNS;
type SortOrder = "asc" | "desc";

const DEFAULT_SORT: SortField = "id";
const DEFAULT_ORDER: SortOrder = "asc";

const isSortField = (value: string): value is SortField =>
  value in SORTABLE_COLUMNS;

const normalizeSort = (value: string | null): SortField =>
  value && isSortField(value) ? value : DEFAULT_SORT;

const normalizeOrder = (value: string | null): SortOrder =>
  value === "desc" ? "desc" : DEFAULT_ORDER;

type SubmissionProblemIdRow = {
  problem_id: number | string | null;
};

type SortedProblemRow = {
  id: number;
  title: string;
  tag1: string;
  tag2: string | null;
  difficulty: string | null;
  created_at: string | null;
  attempted_users: number;
  solved_users: number;
  acceptance_rate: number;
  user_status: "solved" | "wrong" | "none";
  filtered_count: number;
};

const normalizeProblemIdsForRpc = (problemIds: number[] | null) =>
  problemIds && problemIds.length > 0 ? problemIds : null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20")),
  );
  const difficulty = searchParams.get("difficulty") || "";
  const status = searchParams.get("status") || "";
  const tag = searchParams.get("tag") || searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = normalizeSort(searchParams.get("sort"));
  const order = normalizeOrder(searchParams.get("order"));

  const supabase = await createClient();
  let includedProblemIds: number[] | null = null;
  let excludedProblemIds: number[] | null = null;
  if (status) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const createSubmissionProblemIdQuery = () =>
      supabase
        .from("submissions")
        .select("problem_id")
        .eq("user_id", user.id)
        .eq("is_deleted", false);

    const fetchProblemIds = async (
      filter: (query: ReturnType<typeof createSubmissionProblemIdQuery>) => ReturnType<typeof createSubmissionProblemIdQuery>
    ) => {
      const { data, error } = await filter(createSubmissionProblemIdQuery());

      if (error) {
        throw error;
      }

      return Array.from(
        new Set(
          ((data as SubmissionProblemIdRow[] | null) ?? [])
            .map((row) => Number(row.problem_id))
            .filter((id: number) => !Number.isNaN(id))
        )
      );
    };

    const acceptedProblemIds = await fetchProblemIds((q) =>
      q.in("result", ["AC", "ACCEPTED"])
    );
    const attemptedProblemIds = await fetchProblemIds((q) => q);

    if (status === "풀었음") {
      if (acceptedProblemIds.length === 0) {
        return NextResponse.json({ data: [], totalCount: 0, filteredCount: 0 });
      }
      includedProblemIds = acceptedProblemIds;
    }

    if (status === "틀렸음") {
      const wrongProblemIds = attemptedProblemIds.filter(
        (id) => !acceptedProblemIds.includes(id)
      );

      if (wrongProblemIds.length === 0) {
        return NextResponse.json({ data: [], totalCount: 0, filteredCount: 0 });
      }
      includedProblemIds = wrongProblemIds;
    }

    if (status === "안 풀었음") {
      if (attemptedProblemIds.length > 0) {
        excludedProblemIds = attemptedProblemIds;
      }
    }
  }

  const difficultyValues = difficulty && DIFFICULTY_FILTER[difficulty]
    ? DIFFICULTY_FILTER[difficulty]
    : null;

  const { data, error } = await supabase.rpc("get_visible_problems_sorted", {
    p_page: page,
    p_page_size: pageSize,
    p_sort: sort,
    p_order: order,
    p_difficulty_values: difficultyValues,
    p_tag: tag || null,
    p_search: search.trim() || null,
    p_problem_ids: normalizeProblemIdsForRpc(includedProblemIds),
    p_excluded_problem_ids: normalizeProblemIdsForRpc(excludedProblemIds),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as SortedProblemRow[];
  const totalCount = rows[0]?.filtered_count ?? 0;

  return NextResponse.json({
    data: rows.map((row) => ({
      id: row.id,
      title: row.title,
      tag1: row.tag1,
      tag2: row.tag2,
      difficulty: row.difficulty,
      created_at: row.created_at,
      attemptedUsers: row.attempted_users,
      solvedUsers: row.solved_users,
      acceptanceRate: row.acceptance_rate,
      userStatus: row.user_status,
      filteredCount: row.filtered_count,
    })),
    totalCount,
    filteredCount: totalCount,
  });
}
