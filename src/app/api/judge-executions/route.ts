import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const orchestratorUrl = process.env.ORCHESTRATOR_URL;

    if (!orchestratorUrl) {
      return NextResponse.json(
        { error: "ORCHESTRATOR_URL is missing" },
        { status: 500 }
      );
    }

    const response = await fetch(`${orchestratorUrl}/internal/judge-executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();

    return NextResponse.json(
      { error: text || "Judge execution request failed" },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to proxy judge execution request" },
      { status: 500 }
    );
  }
}
