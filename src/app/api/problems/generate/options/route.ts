import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. 로그인 인증 확인
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요합니다.",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    // 2. is_hidden = true 이고 삭제되지 않은 문제만 조회
    const { data: problems, error } = await supabase
      .from("problems")
      .select("id, category, difficulty")
      .eq("is_hidden", true)
      .eq("is_deleted", false)
      .not("category", "is", null)
      .not("difficulty", "is", null);

    if (error) {
      console.error("DB Error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "옵션 조회에 실패했습니다.",
          code: "DB_ERROR",
        },
        { status: 500 },
      );
    }

    // 3. category와 difficulty 조합별 count 집계
    const optionMap = new Map<
      string,
      { category: string; difficulty: string; count: number }
    >();

    for (const p of problems) {
      // 카테고리나 난이도가 빈 값이면 스킵
      if (!p.category || !p.difficulty) continue;

      const key = `${p.category}::${p.difficulty}`;
      if (optionMap.has(key)) {
        optionMap.get(key)!.count += 1;
      } else {
        optionMap.set(key, {
          category: p.category,
          difficulty: p.difficulty,
          count: 1,
        });
      }
    }

    const items = Array.from(optionMap.values());

    // 4. 집계된 조합 반환
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
