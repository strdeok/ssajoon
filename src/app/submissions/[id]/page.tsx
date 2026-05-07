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

const ACCEPTED_RESULTS = new Set(["AC", "ACCEPTED"]);

function isAcceptedResult(result: string | null | undefined) {
  return ACCEPTED_RESULTS.has((result ?? "").trim().toUpperCase());
}

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
  console.log(submission);
  console.log(error)
  if (error || !submission) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            존재하지 않는 제출내역입니다
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            요청하신 제출내역은 존재하지 않거나 삭제되었을 수 있습니다.
          </p>
          <Link
            href="/submissions"
            className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            제출내역 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isAcceptedSubmission = isAcceptedResult(submission.result);

  const { data: testcaseResults } = await supabase
    .from("submission_testcase_results")
    .select("*")
    .eq("submission_id", submissionId)
    .order("testcase_id", { ascending: true });

  const languageRows = isAcceptedSubmission
    ? (
      await supabaseAdmin
        .from("submissions")
        .select("user_id, language")
        .eq("problem_id", submission.problem_id)
        .in("result", ["AC", "ACCEPTED"])
        .or("is_deleted.is.false,is_deleted.is.null")
        .not("language", "is", null)
        .limit(5000)
    ).data
    : [];

  const performanceRows = isAcceptedSubmission
    ? (
      await supabaseAdmin
        .from("submissions")
        .select("execution_time_ms, memory_kb")
        .eq("problem_id", submission.problem_id)
        .eq("language", submission.language)
        .in("result", ["AC", "ACCEPTED"])
        .neq("id", submission.id)
        .or("is_deleted.is.false,is_deleted.is.null")
        .not("execution_time_ms", "is", null)
        .not("memory_kb", "is", null)
        .limit(5000)
    ).data
    : [];

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
          {
            isAcceptedSubmission
              ? <Link
                href="/submissions"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                제출 기록으로 돌아가기
              </Link> :
              <Link
                href={`/problems/${formattedSubmission.problem_id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                문제로 돌아가기
              </Link>
          }

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
                  runtime={isAcceptedSubmission ? submission.execution_time_ms : null}
                  memory={isAcceptedSubmission ? submission.memory_kb : null}
                  comparisonRows={isAcceptedSubmission ? performanceRows || [] : []}
                />
                <CompareOthersLanguage
                  rows={isAcceptedSubmission ? languageRows || [] : []}
                  myLanguage={isAcceptedSubmission ? submission.language : null}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
