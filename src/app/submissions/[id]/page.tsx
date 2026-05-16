import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import SubmissionSummary from "@/components/submissions/detail/SubmissionSummary";
import PeerSubmissionsTable from "@/components/submissions/detail/PeerSubmissionsTable";
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
        <div className="space-y-10">
          <SubmissionSummary submission={formattedSubmission} />
          <PeerSubmissionsTable submissionId={submissionId} />
        </div>
      </div>
    </div>
  );
}
