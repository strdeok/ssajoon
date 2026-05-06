import { NextRequest, NextResponse } from "next/server"; // Next.js의 요청 및 응답 객체를 가져온다.

export async function POST(request: NextRequest) { // 클라이언트의 POST 요청을 처리하는 핸들러를 정의한다.
  try { // 예외 처리를 위해 try-catch 블록을 사용한다.
    const body = await request.json(); // 클라이언트가 보낸 JSON 형식의 본문을 읽는다.

    const orchestratorUrl = process.env.ORCHESTRATOR_URL; // 서버 환경 변수에서 Orchestrator 주소를 가져온다.

    if (!orchestratorUrl) { // Orchestrator 주소가 설정되어 있지 않은 경우를 확인한다.
      return NextResponse.json( // 500 에러와 함께 설정 누락 메시지를 반환한다.
        { error: "ORCHESTRATOR_URL is missing" },
        { status: 500 }
      );
    }

    // 서버 사이드에서 Orchestrator의 내부 채점 실행 엔드포인트로 요청을 전달한다.
    const response = await fetch(`${orchestratorUrl}/internal/judge-executions`, {
      method: "POST", // POST 메서드를 사용한다.
      headers: {
        "Content-Type": "application/json", // JSON 데이터임을 명시한다.
      },
      body: JSON.stringify(body), // 클라이언트로부터 받은 본문을 그대로 전달한다.
    });

    const contentType = response.headers.get("content-type"); // 응답의 콘텐츠 타입을 확인한다.

    if (contentType?.includes("application/json")) { // 응답이 JSON인 경우를 처리한다.
      const data = await response.json(); // JSON 데이터를 파싱한다.
      return NextResponse.json(data, { status: response.status }); // 원본 상태 코드와 함께 데이터를 반환한다.
    }

    const text = await response.text(); // JSON이 아닌 경우 텍스트로 읽는다.

    return NextResponse.json( // 텍스트 응답이나 기본 에러 메시지를 반환한다.
      { error: text || "Judge execution request failed" },
      { status: response.status }
    );
  } catch (error) { // 네트워크 오류 등 예상치 못한 에러를 처리한다.
    console.error("[Judge Proxy] Error:", error); // 서버 로그에 에러를 기록한다.
    return NextResponse.json( // 500 에러와 함께 프록시 실패 메시지를 반환한다.
      { error: "Failed to proxy judge execution request" },
      { status: 500 }
    );
  }
}
