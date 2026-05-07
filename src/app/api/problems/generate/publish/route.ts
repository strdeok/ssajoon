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

    // RPC를 호출해서 조건에 맞는 숨김 문제를 공개 처리한다.
    const { data: publishedProblemRows, error: publishError } = await supabase
      // Supabase RPC 함수를 호출한다.
      .rpc("publish_random_hidden_problem", {
        // 첫 번째 태그를 RPC 인자로 전달한다.
        p_tag1: tag1,

        // 두 번째 태그가 없으면 null로 전달한다.
        p_tag2: tag2 || null,

        // 난이도를 RPC 인자로 전달한다.
        p_difficulty: difficulty,
      });

    // RPC 실행 중 에러가 있으면 서버 에러를 반환한다.
    if (publishError) {
      // 서버 로그에 RPC 에러 상세 내용을 출력한다.
      console.error("RPC Error 상세 내역:", publishError);

      // 클라이언트에 RPC 에러 응답을 반환한다.
      return NextResponse.json(
        // 에러 응답 본문을 구성한다.
        { success: false, message: "문제 생성 중 오류가 발생했습니다.", code: "RPC_ERROR" },

        // HTTP 500 상태 코드를 반환한다.
        { status: 500 }
      );
    }

    const publishedProblem = Array.isArray(publishedProblemRows)
      // 배열이면 첫 번째 문제를 사용한다.
      ? publishedProblemRows[0]

      // 배열이 아니면 그대로 사용한다.
      : publishedProblemRows;

    // 공개할 문제가 없으면 404를 반환한다.
    if (!publishedProblem || !publishedProblem.id) {
      // 조건에 맞는 hidden 문제가 없다는 로그를 남긴다.
      console.log("조건에 맞는 hidden 문제가 없음:", {
        // 요청받은 tag1을 출력한다.
        tag1,

        // 요청받은 tag2를 출력한다.
        tag2,

        // 요청받은 difficulty를 출력한다.
        difficulty,

        // RPC 원본 반환값을 출력한다.
        publishedProblemRows,
      });

      // 클라이언트에 404 응답을 반환한다.
      return NextResponse.json(
        // hidden 문제가 없다는 응답 본문을 구성한다.
        { success: false, message: "조건에 맞는 숨김 문제가 없습니다.", code: "NO_HIDDEN_PROBLEMS" },

        // HTTP 404 상태 코드를 반환한다.
        { status: 404 }
      );
    }
    if (publishError) {
      console.error("RPC Error 상세 내역:", publishError);
      return NextResponse.json(
        { success: false, message: "문제 생성 중 오류가 발생했습니다.", code: "RPC_ERROR" },
        { status: 500 }
      );
    }

    if (!publishedProblem || !publishedProblem.id) {
      return NextResponse.json(
        { success: false, message: "서버 오류가 발생했습니다.", code: "NO_HIDDEN_PROBLEMS" },
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
