import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const normalizeFilter = (value?: string | null) => {
  if (!value) return null;
  if (value === "전체") return null;
  return value;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { tag1, tag2, difficulty } = await request.json();

    const { data, error } = await supabase.rpc("get_random_visible_problems", {
      p_tag1: normalizeFilter(tag1),
      p_tag2: normalizeFilter(tag2),
      p_difficulty: normalizeFilter(difficulty),
    });

    if (error) {
      console.error("get_random_visible_problems error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "조건에 맞는 문제를 찾는 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      problems: data ?? [],
    });
  } catch (error) {
    console.error("Problem recommendation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "조건에 맞는 문제를 찾는 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
