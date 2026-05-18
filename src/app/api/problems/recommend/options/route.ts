import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: problems, error } = await supabase
      .from("problems")
      .select("id, tag1, tag2, difficulty")
      .eq("is_deleted", false)
      .not("tag1", "is", null)
      .not("difficulty", "is", null);

    if (error) {
      console.error("Problem option lookup DB error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "문제 조건을 불러오지 못했습니다.",
          code: "DB_ERROR",
        },
        { status: 500 },
      );
    }

    const optionMap = new Map<
      string,
      { tag1: string; tag2: string | null; difficulty: string; count: number }
    >();

    for (const problem of problems ?? []) {
      if (!problem.tag1 || !problem.difficulty) continue;

      const key = `${problem.tag1}::${problem.tag2 || ""}::${problem.difficulty}`;
      const current = optionMap.get(key);

      if (current) {
        current.count += 1;
      } else {
        optionMap.set(key, {
          tag1: problem.tag1,
          tag2: problem.tag2 || null,
          difficulty: problem.difficulty,
          count: 1,
        });
      }
    }

    return NextResponse.json({
      success: true,
      items: Array.from(optionMap.values()),
    });
  } catch (error) {
    console.error("Problem option lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "문제 조건을 불러오지 못했습니다.",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
