import { NextResponse } from "next/server";
import { submissions } from "@/mocks/submissions";
import { mockJudge } from "@/mocks/results";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const submission = submissions.find((s) => s.id === id);

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If already judged, return it immediately
  if (submission.status !== "PENDING") {
    return NextResponse.json({ status: submission.status });
  }

  // Simulate judge delay (2 seconds offset)
  const elapsed = Date.now() - new Date(submission.createdAt).getTime();
  
  if (elapsed >= 2000) {
    const result = mockJudge(submission.code);
    submission.status = result.status; // Update in-memory mock store
    return NextResponse.json({ status: submission.status });
  }

  // Still pending
  return NextResponse.json({ status: "PENDING" });
}
