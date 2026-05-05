import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. 로그인 인증 확인
    if (!user) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { category, difficulty } = await request.json();

    if (!category || !difficulty) {
      return NextResponse.json(
        { success: false, message: "알고리즘 유형과 난이도를 모두 선택해주세요.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // 2. 현재 사용자 정보(문제 생성 제한 관련 컬럼) 조회
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

    // 서버 기준 오늘 날짜 구하기 (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];
    
    let currentCount = userData.daily_problem_create_count || 0;
    const lastCreateDate = userData.problem_create_count_date;

    // 3. 날짜가 다르면 카운트를 0으로 초기화
    if (lastCreateDate !== today) {
      currentCount = 0;
    }

    // 4. 생성 횟수 3회 초과 검사
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

    // 5. RPC 함수 호출하여 비공개 문제 하나를 공개(is_hidden = false)로 전환
    // 만약 RPC가 아직 준비되지 않았다면 404가 발생하거나 에러가 날 수 있음.
    // 여기서는 동시성 보장을 위해 RPC 사용 (추천 RPC 형태에 맞춤)
    const { data: publishedProblem, error: publishError } = await supabase
      .rpc('publish_hidden_problem', { 
        p_category: category, 
        p_difficulty: difficulty 
      });

    if (publishError) {
      console.error("RPC Error:", publishError);
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

    // 6. users 테이블의 제한 카운트 및 날짜 업데이트
    const newCount = currentCount + 1;
    const { error: updateError } = await supabase
      .from("users")
      .update({
        daily_problem_create_count: newCount,
        problem_create_count_date: today
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("User Count Update Error:", updateError);
    }

    // 7. 문제의 examples 가져오기
    const { data: examples, error: examplesError } = await supabase
      .from("problem_examples")
      .select("input_text, output_text")
      .eq("problem_id", publishedProblem.id);

    // 8. 성공 시 결과 반환
    return NextResponse.json({
      success: true,
      message: "문제가 성공적으로 생성되었습니다.",
      problem: publishedProblem,
      examples: examples || [],
      remainingCount: MAX_GENERATE - newCount
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
