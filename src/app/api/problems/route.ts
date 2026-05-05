import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const DIFFICULTY_FILTER: Record<string, string[]> = {
  Easy: ["EASY", "Easy"],
  Medium: ["MEDIUM", "Medium"],
  "Medium-Hard": ["MEDIUM_HARD", "Medium Hard"],
  Hard: ["HARD", "Hard"],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20")),
  );
  const difficulty = searchParams.get("difficulty") || "";
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  const supabase = await createClient();

  const { count: totalCount } = await supabase
    .from("problems")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false);

  let query = supabase
    .from("problems")
    .select("id, title, category, difficulty", { count: "exact" })
    .eq("is_deleted", false)
    .order("id", { ascending: true });

  if (difficulty && DIFFICULTY_FILTER[difficulty]) {
    query = query.in("difficulty", DIFFICULTY_FILTER[difficulty]);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (search.trim()) {
    const trimmed = search.trim();
    const num = parseInt(trimmed);
    if (!isNaN(num)) {
      query = query.or(`title.ilike.%${trimmed}%,id.eq.${num}`);
    } else {
      query = query.ilike("title", `%${trimmed}%`);
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
