import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const orchestratorUrl = process.env.ORCHESTRATOR_URL;

  if (!orchestratorUrl) {
    return new Response("ORCHESTRATOR_URL is missing", { status: 500 });
  }

  try {
    const upstreamResponse = await fetch(
      `${orchestratorUrl}/api/submissions/${id}/events`,
      {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
        },
      }
    );

    if (!upstreamResponse.ok) {
      const text = await upstreamResponse.text();
      return new Response(text || "Failed to connect upstream SSE", {
        status: upstreamResponse.status,
      });
    }

    if (!upstreamResponse.body) {
      return new Response("No SSE stream", { status: 502 });
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return new Response("Failed to proxy SSE stream", { status: 500 });
  }
}