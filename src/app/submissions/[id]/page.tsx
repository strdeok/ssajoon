import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import SubmissionSummary from "@/components/submissions/detail/SubmissionSummary";
import TestCaseResults from "@/components/submissions/detail/TestCaseResults";
import CompareOthersLanguage from "@/components/submissions/detail/CompareOthersLanguage";
import CodeViewer from "@/components/submissions/detail/CodeViewer";
import PerformanceAnalysis from "@/components/submissions/detail/PerformanceAnalysis";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const submissionId = Number(id);

  if (!Number.isInteger(submissionId)) {
    notFound();
  }

  const supabase = await createClient();

  const supabaseAdmin = createAdminClient();

  const { data: submission, error } = await supabase
    .from("submissions")
    .select(
      `
      *,
      problems (
        title,
        id
      )
    `,
    )
    .eq("id", submissionId)
    .single();

  const { data: languageRows, error: languageError } = await supabaseAdmin
    .from("submissions")
    .select("user_id, language")
    .eq("problem_id", submission.problem_id)
    .in("result", ["AC", "ACCEPTED"])
    .or("is_deleted.is.false,is_deleted.is.null")
    .not("language", "is", null)
    .limit(5000);

  if (error || !submission) {
    notFound();
  }

  const { data: testcaseResults } = await supabase
    .from("submission_testcase_results")
    .select("*")
    .eq("submission_id", submissionId)
    .order("testcase_id", { ascending: true });

  const { data: performanceRows, error: performanceError } = await supabaseAdmin
    .from("submissions")
    .select("execution_time_ms, memory_kb")
    .eq("problem_id", submission.problem_id)
    .eq("language", submission.language)
    .in("result", ["AC", "ACCEPTED"])
    .neq("id", submission.id)
    .or("is_deleted.is.false,is_deleted.is.null")
    .not("execution_time_ms", "is", null)
    .not("memory_kb", "is", null)
    .limit(5000);

  const problemData = Array.isArray(submission.problems)
    ? submission.problems[0]
    : submission.problems;

  const formattedSubmission = {
    id: submission.id,
    result: submission.result || "PENDING",
    language: submission.language,
    execution_time_ms: submission.execution_time_ms,
    memory_kb: submission.memory_kb,
    submitted_at: submission.submitted_at,
    problem_title: problemData?.title || "알 수 없는 문제",
    problem_id: problemData?.id || submission.problem_id,
    failed_testcase_order: submission.failed_testcase_order,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <Link
            href="/submissions"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            제출 기록으로 돌아가기
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            <SubmissionSummary submission={formattedSubmission} />
            <div className="space-y-12">
              <TestCaseResults results={testcaseResults || []} />
              <CodeViewer
                code={submission.source_code || ""}
                language={submission.language}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                성능 데이터 분석
              </h2>
              <div className="space-y-8">
                <PerformanceAnalysis
                  runtime={submission.execution_time_ms}
                  memory={submission.memory_kb}
                  comparisonRows={performanceRows || []}
                />
                <CompareOthersLanguage
                  rows={languageRows || []}
                  myLanguage={submission.language}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
