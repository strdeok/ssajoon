import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const DIFFICULTY_FILTER: Record<string, string[]> = {
  Easy: ["EASY", "Easy"],
  Medium: ["MEDIUM", "Medium"],
  "Medium-Hard": ["MEDIUM_HARD", "Medium Hard"],
  Hard: ["HARD", "Hard"],
  "Very-Hard": ["VERY_HARD", "Very Hard"],
};

const createSpaceInsensitiveTitlePattern = (search: string) => {
  const compactSearch = search.replace(/\s+/g, "");

  if (!compactSearch) {
    return "";
  }

  return compactSearch.split("").join("%");
};

type SubmissionProblemIdRow = {
  problem_id: number | string | null;
};

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

  const supabase = await createClient();

  const { count: totalCount } = await supabase
    .from("problems")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false)
    .eq("is_hidden", false);

  let query = supabase
    .from("problems")
    .select("id, title, tag1, tag2, difficulty", { count: "exact" })
    .eq("is_deleted", false)
    .eq("is_hidden", false)
    .order("id", { ascending: true });

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
        return NextResponse.json({ data: [], totalCount: totalCount ?? 0, filteredCount: 0 });
      }
      query = query.in("id", acceptedProblemIds);
    }

    if (status === "틀렸음") {
      const wrongProblemIds = attemptedProblemIds.filter(
        (id) => !acceptedProblemIds.includes(id)
      );

      if (wrongProblemIds.length === 0) {
        return NextResponse.json({ data: [], totalCount: totalCount ?? 0, filteredCount: 0 });
      }
      query = query.in("id", wrongProblemIds);
    }

    if (status === "안 풀었음") {
      if (attemptedProblemIds.length > 0) {
        query = query.not("id", "in", `(${attemptedProblemIds.join(",")})`);
      }
    }
  }

  if (difficulty && DIFFICULTY_FILTER[difficulty]) {
    query = query.in("difficulty", DIFFICULTY_FILTER[difficulty]);
  }

  if (tag) {
    query = query.or(`tag1.eq.${tag},tag2.eq.${tag}`);
  }

  if (search.trim()) {
    const trimmed = search.trim();
    const num = parseInt(trimmed);
    const compactTitlePattern = createSpaceInsensitiveTitlePattern(trimmed);
    const titleFilters = [
      `title.ilike.%${trimmed}%`,
      compactTitlePattern && compactTitlePattern !== trimmed
        ? `title.ilike.%${compactTitlePattern}%`
        : "",
    ].filter(Boolean);

    if (!isNaN(num)) {
      query = query.or([...titleFilters, `id.eq.${num}`].join(","));
    } else {
      query = query.or(titleFilters.join(","));
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    totalCount: totalCount ?? 0,
    filteredCount: count ?? 0,
  });
}
