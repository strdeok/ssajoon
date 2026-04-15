import { NextResponse } from "next/server";
import { submissions } from "@/mocks/submissions";
import { Submission } from "@/types/submission";

export async function POST(request: Request) {
  try {
    const { problemId, code, language } = await request.json();

    if (!problemId || !code || !language) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const newSubmission: Submission = {
      id: Math.random().toString(36).substring(7),
      problemId,
      code,
      language,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    submissions.push(newSubmission);

    return NextResponse.json({ submissionId: newSubmission.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
