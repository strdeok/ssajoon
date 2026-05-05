import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import SubmissionSummary from "@/components/submissions/detail/SubmissionSummary";
import TestCaseResults from "@/components/submissions/detail/TestCaseResults";
import CodeViewer from "@/components/submissions/detail/CodeViewer";
import PerformanceAnalysis from "@/components/submissions/detail/PerformanceAnalysis";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function SubmissionDetailPage({
  // 제출 상세 페이지 서버 컴포넌트를 정의한다.
  params, // 동적 라우트 params를 받는다.
}: {
  // props 타입을 정의한다.
  params: Promise<{ id: string }>; // Next.js 15 기준 params를 Promise로 받는다.
}) {
  // 컴포넌트 정의를 시작한다.
  const { id } = await params; // URL에서 제출 id를 꺼낸다.

  const submissionId = Number(id); // 제출 id를 숫자로 변환한다.

  if (!Number.isInteger(submissionId)) {
    // 제출 id가 올바른 숫자인지 확인한다.
    notFound(); // 잘못된 id면 404를 반환한다.
  }

  const supabase = await createClient(); // 현재 유저 기준 Supabase 클라이언트를 생성한다.

  const supabaseAdmin = createAdminClient(); // 성능 비교 집계용 관리자 Supabase 클라이언트를 생성한다.

  const { data: submission, error } = await supabase // 현재 제출 상세 정보를 조회한다.
    .from("submissions") // submissions 테이블을 조회한다.
    .select(
      // 제출 정보와 문제 정보를 함께 가져온다.
      `
      *,
      problems (
        title,
        id
      )
    `,
    )
    .eq("id", submissionId) // URL의 제출 id와 일치하는 제출만 조회한다.
    .single(); // 단일 row로 가져온다.

  if (error || !submission) {
    // 제출 조회에 실패했거나 데이터가 없으면 확인한다.
    console.error("제출 상세 조회 실패:", error); // 서버 콘솔에 에러를 출력한다.
    notFound(); // 제출이 없으면 404를 반환한다.
  }

  const { data: testcaseResults } = await supabase // 테스트케이스 결과를 조회한다.
    .from("submission_testcase_results") // 제출별 테스트케이스 결과 테이블을 조회한다.
    .select("*") // 모든 컬럼을 가져온다.
    .eq("submission_id", submissionId) // 현재 제출 id와 연결된 결과만 가져온다.
    .order("testcase_id", { ascending: true }); // 테스트케이스 id 기준으로 정렬한다.

  const { data: performanceRows, error: performanceError } = await supabaseAdmin // 다른 유저 정답 제출 성능 데이터를 조회한다.
    .from("submissions") // submissions 테이블에서 조회한다.
    .select("execution_time_ms, memory_kb") // 비교에 필요한 실행 시간과 메모리만 가져온다.
    .eq("problem_id", submission.problem_id) // 같은 문제 제출만 가져온다.
    .eq("language", submission.language) // 같은 언어 제출만 비교한다.
    .in("result", ["AC", "ACCEPTED"]) // 정답 제출만 비교 대상으로 삼는다.
    .neq("id", submission.id) // 내 현재 제출은 비교 대상에서 제외한다.
    .or("is_deleted.is.false,is_deleted.is.null") // 삭제되지 않은 제출만 가져온다.
    .not("execution_time_ms", "is", null) // 실행 시간이 null인 제출은 제외한다.
    .not("memory_kb", "is", null) // 메모리가 null인 제출은 제외한다.
    .limit(5000); // 과도한 조회를 막기 위해 최대 5000개까지만 가져온다.

  if (performanceError) {
    // 성능 비교 데이터 조회 실패 여부를 확인한다.
    console.error("성능 비교 데이터 조회 실패:", performanceError); // 서버 콘솔에 에러를 출력한다.
  }

  const problemData = Array.isArray(submission.problems) // join 결과가 배열인지 확인한다.
    ? submission.problems[0] // 배열이면 첫 번째 문제 정보를 사용한다.
    : submission.problems; // 객체면 그대로 사용한다.

  const formattedSubmission = {
    // 하위 컴포넌트에 넘길 제출 데이터를 정리한다.
    id: submission.id, // 제출 id를 넣는다.
    result: submission.result || "PENDING", // 결과가 없으면 PENDING으로 처리한다.
    language: submission.language, // 제출 언어를 넣는다.
    execution_time_ms: submission.execution_time_ms, // 실행 시간을 넣는다.
    memory_kb: submission.memory_kb, // 메모리 사용량을 넣는다.
    submitted_at: submission.submitted_at, // 제출 시간을 넣는다.
    problem_title: problemData?.title || "알 수 없는 문제", // 문제 제목을 넣는다.
    problem_id: problemData?.id || submission.problem_id, // 문제 id를 넣는다.
  };

  return (
    // 페이지 JSX를 반환한다.
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
      {" "}
      {/* 전체 페이지 배경을 렌더링한다. */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        {" "}
        {/* 페이지 컨테이너를 렌더링한다. */}
        <div className="mb-8">
          {" "}
          {/* 뒤로가기 영역을 렌더링한다. */}
          <Link // 제출 기록 페이지로 돌아가는 링크를 렌더링한다.
            href="/submissions" // 제출 기록 페이지 경로를 지정한다.
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors group" // 링크 스타일을 지정한다.
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
            {/* 뒤로가기 아이콘을 렌더링한다. */}
            제출 기록으로 돌아가기 {/* 링크 텍스트를 렌더링한다. */}
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {" "}
          {/* 메인 레이아웃 그리드를 렌더링한다. */}
          <div className="lg:col-span-2 space-y-12">
            {" "}
            {/* 왼쪽 메인 영역을 렌더링한다. */}
            <SubmissionSummary submission={formattedSubmission} />{" "}
            {/* 제출 요약을 렌더링한다. */}
            <div className="space-y-12">
              {" "}
              {/* 테스트케이스와 코드 영역 wrapper를 렌더링한다. */}
              <TestCaseResults results={testcaseResults || []} />{" "}
              {/* 테스트케이스 결과를 렌더링한다. */}
              <CodeViewer // 코드 뷰어를 렌더링한다.
                code={submission.source_code || ""} // 제출 코드를 넘긴다.
                language={submission.language} // 제출 언어를 넘긴다.
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            {" "}
            {/* 오른쪽 성능 분석 영역을 렌더링한다. */}
            <div className="sticky top-24">
              {" "}
              {/* 성능 분석 영역을 sticky로 만든다. */}
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                {" "}
                {/* 성능 분석 제목을 렌더링한다. */}
                성능 데이터 분석 {/* 제목 텍스트를 렌더링한다. */}
              </h2>
              <PerformanceAnalysis // 성능 분석 컴포넌트를 렌더링한다.
                runtime={submission.execution_time_ms} // 내 실행 시간을 넘긴다.
                memory={submission.memory_kb} // 내 메모리 사용량을 넘긴다.
                comparisonRows={performanceRows || []} // 다른 유저 정답 제출 성능 데이터를 넘긴다.
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
