import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(submissions);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. 로그인 여부 서버 검증
    if (!user) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { problemId, language, sourceCode } = body;

    if (!problemId || !language || !sourceCode) {
      return NextResponse.json(
        { success: false, message: "잘못된 요청입니다. 필수 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 2. 최근 5분간 제출 횟수 조회
    // 현재 시간 기준 5분 전 시간 문자열을 구합니다.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { count, error: countError } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("submitted_at", fiveMinutesAgo);

    if (countError) {
      return NextResponse.json(
        { success: false, message: "제출 기록 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 3. 5분 내 3회 이상 제출 시 차단
    if (count !== null && count >= 3) {
      return NextResponse.json(
        { 
          success: false, 
          message: "최근 5분간 3회를 초과하여 제출할 수 없습니다. 잠시 후 다시 시도해주세요." 
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    // 4. 외부 오케스트레이터 채점 서버로 Proxy 전송
    // 환경변수 적용: ORCHESTRATORURL
    const orchestratorUrl = process.env.ORCHESTRATORURL;
    
    if (!orchestratorUrl) {
      console.error("ORCHESTRATORURL environment variable is missing.");
      return NextResponse.json(
        { success: false, message: "채점 서버 주소가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const orchestratorRes = await fetch(orchestratorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, language, sourceCode }),
    });

    const orchestratorData = await orchestratorRes.json();

    if (!orchestratorRes.ok) {
      return NextResponse.json(
        { success: false, message: orchestratorData.message || "외부 채점 서버 연동 에러가 발생했습니다." },
        { status: orchestratorRes.status }
      );
    }

    // 5. 서버 제한 검증과 외부 API 호출이 성공하면 우리 DB에도 제출 기록(PENDING) 생성
    const { data: insertedSubmission, error: insertError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        problem_id: problemId,
        language: language,
        source_code: sourceCode,
        status: "PENDING", // 아직 채점 중
      })
      .select()
      .single();

    if (insertError) {
      console.error("Submission DB Insert Error:", insertError);
      // DB 기록에 실패하더라도 외부 채점은 들어갔으므로 에러 던지지 않고 일단 진행합니다.
    }

    // 6. 결과 반환
    return NextResponse.json({
      success: true,
      message: "제출이 완료되었습니다.",
      submissionId: orchestratorData.submissionId || insertedSubmission?.id,
    });

  } catch (error: any) {
    console.error("Submission Route Error:", error);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
