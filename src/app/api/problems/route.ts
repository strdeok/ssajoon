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
  filtered_count: number;
};

const normalizeProblemIdsForRpc = (problemIds: number[] | null) =>
  problemIds && problemIds.length > 0 ? problemIds : null;

const parseProblemIds = (value: string | null) => {
  if (!value) return null;

  const ids = value
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  return Array.from(new Set(ids));
};

export async function GET(request: Request) {
  const totalStartedAt = performance.now();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20")),
  );
  const difficulty = searchParams.get("difficulty") || "";
  const tag = searchParams.get("tag") || searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = normalizeSort(searchParams.get("sort"));
  const order = normalizeOrder(searchParams.get("order"));
  const includedProblemIds = parseProblemIds(searchParams.get("problemIds"));
  const excludedProblemIds = parseProblemIds(
    searchParams.get("excludedProblemIds"),
  );
  const supabase = await createClient();

  const difficultyValues = difficulty && DIFFICULTY_FILTER[difficulty]
    ? DIFFICULTY_FILTER[difficulty]
    : null;

  const rpcStartedAt = performance.now();
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

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[api/problems] rpc ms:",
      Math.round(performance.now() - rpcStartedAt),
    );
    console.log(
      "[api/problems] total ms:",
      Math.round(performance.now() - totalStartedAt),
    );
  }

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  const rows = (data ?? []) as SortedProblemRow[];
  const totalCount = rows[0]?.filtered_count ?? 0;
  const isPublicProblemsRequest =
    !includedProblemIds?.length && !excludedProblemIds?.length;

  return NextResponse.json(
    {
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
        filteredCount: row.filtered_count,
      })),
      totalCount,
      filteredCount: totalCount,
    },
    {
      headers: isPublicProblemsRequest
        ? {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
          }
        : {
            "Cache-Control": "private, no-store",
          },
    },
  );
}
