import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
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

    // RPC를 호출하여 원자적으로 문제를 생성하고 한도를 차감한다.
    const { data: rpcResponse, error: rpcError } = await supabase.rpc(
      "complete_user_problem_generation",
      {
        p_tag1: tag1,
        p_tag2: tag2 || null,
        p_difficulty: difficulty,
        p_max_limit: 3,
      }
    );

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return NextResponse.json(
        { success: false, message: "문제 생성 중 서버 오류가 발생했습니다.", code: "RPC_ERROR" },
        { status: 500 }
      );
    }

    const result = rpcResponse as {
      success: boolean;
      message?: string;
      code?: string;
      problem?: any;
      remainingCount?: number;
    };

    if (!result.success) {
      let status = 400;
      if (result.code === "UNAUTHORIZED") status = 401;
      if (result.code === "DAILY_LIMIT_EXCEEDED") status = 429;
      if (result.code === "NO_HIDDEN_PROBLEMS") status = 404;

      return NextResponse.json(result, { status });
    }

    const publishedProblem = result.problem;

    // 문제 예제 데이터를 추가로 조회한다.
    const { data: examples } = await supabase
      .from("problem_examples")
      .select("input_text, output_text")
      .eq("problem_id", publishedProblem.id);

    return NextResponse.json({
      success: true,
      message: "문제가 성공적으로 생성되었습니다.",
      problem: publishedProblem,
      examples: examples || [],
      remainingCount: result.remainingCount,
    });
  } catch (error) {
    console.error("Unexpected Error:", error);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
