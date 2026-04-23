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

    const { category } = await request.json();

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
        { status: 429 } // 429 Too Many Requests
      );
    }

    // 5. 생성할 더미 문제 데이터 (선택한 카테고리 기반)
    const dummyProblem = {
      title: `[${category}] AI 생성 더미 문제`,
      difficulty: "Medium",
      description: `이 문제는 AI가 '${category}' 카테고리를 기반으로 생성한 더미 문제입니다.\n\n배열 내 두 숫자를 더해 target을 만드는 알고리즘을 구현하세요.`,
      input_description: "첫 줄에 N, 두 번째 줄에 배열, 세 번째 줄에 target이 주어집니다.",
      output_description: "인덱스 두 개를 공백으로 구분하여 출력합니다.",
      time_limit_ms: 1000,
      memory_limit_mb: 256
    };

    // 6. DB 업데이트 로직 (문제 생성 및 카운트 증가)
    
    // (A) problems 테이블에 문제 데이터 삽입
    const { data: insertedProblem, error: insertError } = await supabase
      .from("problems")
      .insert(dummyProblem)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, message: "문제 생성 중 오류가 발생했습니다.", code: "INSERT_ERROR" },
        { status: 500 }
      );
    }

    // (B) users 테이블의 제한 카운트 및 날짜 업데이트
    const newCount = currentCount + 1;
    const { error: updateError } = await supabase
      .from("users")
      .update({
        daily_problem_create_count: newCount,
        problem_create_count_date: today
      })
      .eq("id", user.id);

    if (updateError) {
      // 심각한 에러는 아니므로 로깅만 수행
      console.error("Failed to update user limits", updateError);
    }

    // 7. 성공 시 결과 반환
    return NextResponse.json({
      success: true,
      message: "문제가 성공적으로 생성되었습니다.",
      problem: insertedProblem,
      remainingCount: MAX_GENERATE - newCount
    });

  } catch (error) {
    console.error("Generate API Error:", error);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
