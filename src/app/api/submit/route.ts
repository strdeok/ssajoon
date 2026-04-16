import { NextResponse } from "next/server";
import { runCode } from "@/lib/runner";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemId, code, language } = await request.json();

    if (!problemId || !code || !language) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    // Insert Submission
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        problem_id: problemId,
        source_code: code,
        language,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: subError?.message || "Insert failed" }, { status: 500 });
    }

    // Background execution
    (async () => {
      const bgSupabase = await createClient(); 

      const { data: testCases } = await bgSupabase
        .from("problem_testcases")
        .select("*")
        .eq("problem_id", problemId)
        .order("testcase_order", { ascending: true });
      
      let finalStatus = "WA";
      let totalExecutionTime = 0;

      if (testCases && testCases.length > 0) {
        let allPassed = true;
        for (const tc of testCases) {
          const startTime = Date.now();
          const res = await runCode(language, code, tc.input_text);
          const execution_time_ms = Date.now() - startTime;
          totalExecutionTime += execution_time_ms;

          const actualOutput = res.passed ? res.stdout : res.stderr || res.error || "";
          
          let tcResultStr = "WA";
          if (!res.passed) {
             tcResultStr = "RE"; // Runtime or Compilation Error
             allPassed = false;
          } else if (actualOutput.trim() === tc.expected_output.trim()) {
             tcResultStr = "AC";
          } else {
             allPassed = false;
          }

          await bgSupabase.from("submission_testcase_results").insert({
            submission_id: submission.id,
            testcase_id: tc.id,
            result: tcResultStr,
            execution_time_ms,
            error_message: !res.passed ? actualOutput : null,
          });
        }
        finalStatus = allPassed ? "AC" : "WA";
      }

      await bgSupabase.from("submissions").update({ 
        status: finalStatus,
        execution_time_ms: totalExecutionTime > 0 ? Math.round(totalExecutionTime / (testCases?.length || 1)) : 0,
        judged_at: new Date().toISOString()
      }).eq("id", submission.id);
    })();

    return NextResponse.json({ submissionId: submission.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

