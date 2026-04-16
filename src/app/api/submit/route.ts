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
        code,
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
      // Background threads need to re-initialize an anon client since cookies might not persist in bg context natively easily,
      // but in Next.js Server Actions/Routes, local supabase instance is fine. Wait, better to construct anon client or Service role key.
      // But Since RLS allows Auth'd User to UPDATE their submissions, and this context technically still has cookies, it might work.
      const bgSupabase = await createClient(); 

      const { data: problem } = await bgSupabase.from("problems").select("test_cases").eq("id", problemId).single();
      
      let finalStatus = "WA";

      if (problem && problem.test_cases) {
        let allPassed = true;
        for (const tc of problem.test_cases) {
          const res = await runCode(language, code, tc.input);
          const actualOutput = res.passed ? res.stdout : res.stderr || res.error || "";
          
          if (!res.passed || actualOutput.trim() !== tc.output.trim()) {
            allPassed = false;
            break;
          }
        }
        finalStatus = allPassed ? "AC" : "WA";
      }

      await bgSupabase.from("submissions").update({ status: finalStatus }).eq("id", submission.id);
    })();

    return NextResponse.json({ submissionId: submission.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

