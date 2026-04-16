import { NextResponse } from "next/server";
import { problems } from "@/mocks/problems";
import { runCode } from "@/lib/runner";

export async function POST(request: Request) {
  try {
    const { problemId, code, language } = await request.json();

    if (!problemId || code === undefined || !language) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const problem = problems.find((p) => p.id === problemId);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const testCases = problem.testCases || [];
    
    const results = [];

    for (const tc of testCases) {
      const runnerRes = await runCode(language, code, tc.input);

      // Clean up stdout spacing
      const actualRaw = runnerRes.passed ? runnerRes.stdout : runnerRes.stderr || runnerRes.error || "Exception";
      
      const passed = runnerRes.passed && actualRaw.trim() === tc.output.trim();

      results.push({
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput: actualRaw,
        passed,
      });
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
