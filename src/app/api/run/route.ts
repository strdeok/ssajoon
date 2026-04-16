import { NextResponse } from "next/server";
import { runCode } from "@/lib/runner";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { problemId, code, language } = await request.json();

    if (!problemId || code === undefined || !language) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Fetch examples for "Run Code"
    const { data: testCases, error } = await supabase
      .from("problem_examples")
      .select("*")
      .eq("problem_id", problemId)
      .order("example_order", { ascending: true });

    if (error || !testCases) {
      return NextResponse.json({ error: "Examples not found" }, { status: 404 });
    }

    const results = [];

    for (const tc of testCases) {
      const runnerRes = await runCode(language, code, tc.input_text);

      // Clean up stdout spacing
      const actualRaw = runnerRes.passed ? runnerRes.stdout : runnerRes.stderr || runnerRes.error || "Exception";
      
      const passed = runnerRes.passed && actualRaw.trim() === tc.output_text.trim();

      results.push({
        input: tc.input_text,
        expectedOutput: tc.output_text,
        actualOutput: actualRaw,
        passed,
      });
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

