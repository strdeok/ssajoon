import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { tag1, tag2, difficulty } = await request.json();

    if (!tag1 || !difficulty) {
      return NextResponse.json(
        { success: false, message: "알고리즘 유형과 난이도를 모두 선택해주세요.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("daily_problem_create_count, problem_create_count_date")
      .eq("id", user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { success: false, message: "사용자 정보를 조회할 수 없습니다.", code: "DB_ERROR" },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    
    let currentCount = userData.daily_problem_create_count || 0;
    const lastCreateDate = userData.problem_create_count_date;

    if (lastCreateDate !== today) {
      currentCount = 0;
    }

    const MAX_GENERATE = 3;
    if (currentCount >= MAX_GENERATE) {
      return NextResponse.json(
        { 
          success: false, 
          message: "하루 최대 문제 생성 횟수(3회)를 초과했습니다. 내일 다시 시도해주세요.", 
          code: "DAILY_LIMIT_EXCEEDED" 
        },
        { status: 429 }
      );
    }

    const { data: publishedProblem, error: publishError } = await supabase
      .rpc('publish_hidden_problem', { 
        p_tag1: tag1,
        p_tag2: tag2 || null,
        p_difficulty: difficulty 
      });

    if (publishError) {
      return NextResponse.json(
        { success: false, message: "문제 생성 중 오류가 발생했습니다. 조건에 맞는 비공개 문제가 없을 수 있습니다.", code: "RPC_ERROR" },
        { status: 500 }
      );
    }

    if (!publishedProblem || !publishedProblem.id) {
      return NextResponse.json(
        { success: false, message: "해당 조건의 비공개 문제가 남아있지 않습니다.", code: "NO_HIDDEN_PROBLEMS" },
        { status: 404 }
      );
    }

    const newCount = currentCount + 1;
    await supabase
      .from("users")
      .update({
        daily_problem_create_count: newCount,
        problem_create_count_date: today
      })
      .eq("id", user.id);

    const { data: examples } = await supabase
      .from("problem_examples")
      .select("input_text, output_text")
      .eq("problem_id", publishedProblem.id);

    return NextResponse.json({
      success: true,
      message: "문제가 성공적으로 생성되었습니다.",
      problem: publishedProblem,
      examples: examples || [],
      remainingCount: MAX_GENERATE - newCount
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
