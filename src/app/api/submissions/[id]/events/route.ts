import { NextRequest } from "next/server"; // Next.js의 요청 객체를 가져온다.

export async function GET( // SSE 연결을 위한 GET 핸들러를 정의한다.
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 동적 경로 파라미터(submissionId)를 받는다.
) {
  const { id } = await params; // 비동기로 전달된 params에서 id를 추출한다.

  const orchestratorUrl = process.env.ORCHESTRATOR_URL; // 서버 환경 변수에서 Orchestrator 주소를 가져온다.

  if (!orchestratorUrl) { // Orchestrator 주소가 설정되어 있지 않은 경우를 확인한다.
    return new Response("ORCHESTRATOR_URL is missing", { status: 500 }); // 500 에러를 반환한다.
  }

  try { // 외부 스트림 연결을 위해 예외 처리를 사용한다.
    const upstreamResponse = await fetch( // Orchestrator의 SSE 엔드포인트로 연결을 시도한다.
      `${orchestratorUrl}/api/submissions/${id}/events`,
      {
        method: "GET", // GET 메서드를 사용한다.
        headers: {
          Accept: "text/event-stream", // SSE 스트림 응답을 요청한다.
        },
      }
    );

    if (!upstreamResponse.ok) { // 외부 서버 연결에 실패한 경우를 처리한다.
      const text = await upstreamResponse.text(); // 에러 메시지를 읽는다.
      return new Response(text || "Failed to connect upstream SSE", {
        status: upstreamResponse.status,
      });
    }

    if (!upstreamResponse.body) { // 응답 본문(스트림)이 없는 경우를 처리한다.
      return new Response("No SSE stream", { status: 502 }); // 502 Bad Gateway 에러를 반환한다.
    }

    // 외부 서버의 스트림을 그대로 클라이언트에 반환한다.
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": "text/event-stream", // SSE 콘텐츠 타입을 명시한다.
        "Cache-Control": "no-cache, no-transform", // 캐싱을 방지하고 데이터 변형을 막는다.
        Connection: "keep-alive", // 연결을 유지한다.
        "X-Accel-Buffering": "no", // Nginx 등에서의 버퍼링을 방지한다.
      },
    });
  } catch (error) { // 스트림 중계 중 발생하는 에러를 처리한다.
    console.error("[SSE Proxy] Error:", error); // 서버 로그에 기록한다.
    return new Response("Failed to proxy SSE stream", { status: 500 }); // 500 에러를 반환한다.
  }
}