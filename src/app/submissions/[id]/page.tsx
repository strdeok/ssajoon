import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import SubmissionSummary from "@/components/submissions/detail/SubmissionSummary";
import PeerSubmissionsTable from "@/components/submissions/detail/PeerSubmissionsTable";
import PerformanceAnalysis from "@/components/submissions/detail/PerformanceAnalysis";
import CompareOthersLanguage from "@/components/submissions/detail/CompareOthersLanguage";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const ACCEPTED_RESULTS = new Set(["AC", "ACCEPTED"]);

function isAcceptedResult(result: string | null | undefined) {
  return ACCEPTED_RESULTS.has((result ?? "").trim().toUpperCase());
}

function anonymizeLanguageRows(
  rows: { user_id: string | null; language: string | null }[],
) {
  const userIds = new Map<string, string>();

  return rows.map((row, index) => {
    if (!row.user_id) {
      return {
        user_id: `anonymous-${index}`,
        language: row.language,
      };
    }

    let anonymizedId = userIds.get(row.user_id);

    if (!anonymizedId) {
      anonymizedId = `user-${userIds.size + 1}`;
      userIds.set(row.user_id, anonymizedId);
    }

    return {
      user_id: anonymizedId,
      language: row.language,
    };
  });
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

  const { data: submission, error } = await supabase
    .from("submissions")
    .select(
      `
      id,
      problem_id,
      result,
      language,
      execution_time_ms,
      memory_kb,
      submitted_at,
      failed_testcase_order,
      problems (
        title,
        id
      )
    `,
    )
    .eq("id", submissionId)
    .single();

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
            prefetch={false}
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

  const problemData = Array.isArray(submission.problems)
    ? submission.problems[0]
    : submission.problems;

  const isAcceptedSubmission = isAcceptedResult(submission.result);
  const supabaseAdmin = createAdminClient();

  const [languageRowsResult, performanceRowsResult] = isAcceptedSubmission
    ? await Promise.all([
        supabaseAdmin
          .from("submissions")
          .select("user_id, language")
          .eq("problem_id", submission.problem_id)
          .in("result", ["AC", "ACCEPTED"])
          .or("is_deleted.is.false,is_deleted.is.null")
          .not("language", "is", null)
          .limit(5000),
        supabaseAdmin
          .from("submissions")
          .select("execution_time_ms, memory_kb")
          .eq("problem_id", submission.problem_id)
          .eq("language", submission.language)
          .in("result", ["AC", "ACCEPTED"])
          .neq("id", submission.id)
          .or("is_deleted.is.false,is_deleted.is.null")
          .not("execution_time_ms", "is", null)
          .not("memory_kb", "is", null)
          .limit(5000),
      ])
    : [
        { data: [] as { user_id: string | null; language: string | null }[] },
        {
          data: [] as {
            execution_time_ms: number | null;
            memory_kb: number | null;
          }[],
        },
      ];

  const languageRows = anonymizeLanguageRows(languageRowsResult.data || []);
  const performanceRows = performanceRowsResult.data || [];

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
            prefetch={false}
            href="/submissions"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors group dark:text-zinc-400"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            제출 기록으로 돌아가기
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <SubmissionSummary submission={formattedSubmission} />
            <PeerSubmissionsTable submissionId={submissionId} />
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                성능 데이터 분석
              </h2>
              <div className="space-y-8">
                <PerformanceAnalysis
                  runtime={
                    isAcceptedSubmission ? submission.execution_time_ms : null
                  }
                  memory={isAcceptedSubmission ? submission.memory_kb : null}
                  comparisonRows={performanceRows}
                />
                <CompareOthersLanguage
                  rows={languageRows}
                  myLanguage={isAcceptedSubmission ? submission.language : null}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
