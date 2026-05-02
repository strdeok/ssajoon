"use client";

import { useState } from "react";
import { useSubmissionStore } from "@/store/submissionStore";
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock, HardDrive, Eye } from "lucide-react";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";
import { Problem } from "@/types/problem";
import { FailedTestcaseModal } from "./FailedTestcaseModal";

interface ResultViewerProps {
  problem: Problem | null;
}

export function ResultViewer({ problem }: ResultViewerProps) {
  const { status, submissionId, result } = useSubmissionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!status && !submissionId) return null;

  // 공개 테스트케이스 수 계산 (히든 번호 보정용)
  const publicTestcases = problem?.problem_testcases?.filter(t => !t.is_hidden) ?? [];
  const publicTestcaseCount = publicTestcases.length;

  const { text: resultText, isSuccess, isFail, isPending, isError, colorClass } = getSubmissionLabel(
    status,
    result?.result,
    result?.failed_testcase_order,
    publicTestcaseCount
  );

  const failedOrder = result?.failed_testcase_order;

  // [버그2 수정] failedTestcase를 찾을 때 problem_testcases 우선, 없으면 problem_examples fallback
  // problem_testcases에서 testcase_order가 일치하는 항목 탐색
  const failedTestcaseFromTC = problem?.problem_testcases?.find(
    t => t.testcase_order === failedOrder
  );

  // problem_examples에서는 example_order가 일치하는 항목 탐색
  const examples = problem?.problem_examples ?? [];
  const failedExampleFromEx = examples.find(
    (e, _) => e.example_order === failedOrder
  );

  // 모달에 사용할 테스트케이스 데이터: testcases 우선, 없으면 examples
  // ProblemTestcase 타입과 형태를 맞춰서 통합
  const failedTestcaseData: { id: string; input_text: string; expected_output: string; is_hidden: boolean } | null =
    failedTestcaseFromTC
      ? {
          id: failedTestcaseFromTC.id,
          input_text: failedTestcaseFromTC.input_text,
          expected_output: failedTestcaseFromTC.expected_output,
          is_hidden: failedTestcaseFromTC.is_hidden,
        }
      : failedExampleFromEx
      ? {
          id: failedExampleFromEx.id,
          input_text: failedExampleFromEx.input_text,
          expected_output: failedExampleFromEx.output_text, // examples는 output_text 컬럼
          is_hidden: false, // examples는 항상 공개
        }
      : null;

  // 화면에 표시할 보정된 번호
  // 히든 테스트케이스의 경우: failedOrder - publicTestcaseCount
  const displayOrder = failedOrder
    ? failedOrder > publicTestcaseCount && publicTestcaseCount > 0
      ? failedOrder - publicTestcaseCount
      : failedOrder
    : 0;

  return (
    <div className="mt-4 p-6 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-lg transition-all duration-300">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">
        채점 결과
      </h3>
      
      <div className="flex items-center space-x-3 mb-4">
        {isPending && (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className={`font-medium text-lg animate-pulse ${colorClass}`}>{resultText}</span>
          </>
        )}
        
        {isSuccess && (
          <>
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className={`font-bold text-lg ${colorClass}`}>{resultText}</span>
          </>
        )}
        
        {isFail && (
          <>
            <XCircle className="w-6 h-6 text-red-500" />
            <span className={`font-bold text-lg ${colorClass}`}>{resultText}</span>
          </>
        )}

        {isError && (
          <>
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <span className="text-orange-500 font-bold text-lg">채점 실패 (서버 에러)</span>
          </>
        )}
      </div>

      {/* 리소스 사용량 표시 */}
      {(result?.execution_time_ms !== undefined || result?.memory_kb !== undefined) && (
        <div className="flex space-x-6 mt-2 mb-4 p-3 bg-zinc-50 dark:bg-black/20 rounded-lg border border-zinc-200 dark:border-white/5">
          {result?.execution_time_ms !== undefined && (
            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-300">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>실행 시간: <strong>{result.execution_time_ms}</strong> ms</span>
            </div>
          )}
          {result?.memory_kb !== undefined && (
            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-300">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <span>메모리: <strong>{(result.memory_kb / 1024).toFixed(2)}</strong> MB</span>
            </div>
          )}
        </div>
      )}

      {/* [버그2 수정] 틀린 테스트케이스 보기 버튼:
          WA이고 failedOrder가 있으며, testcases 또는 examples에서 해당 케이스를 찾은 경우에만 표시 */}
      {isFail && result?.result === "WA" && failedOrder && failedTestcaseData && (
        <div className="mt-4 mb-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            틀린 테스트케이스 보기
          </button>
        </div>
      )}

      <div className="mt-2 text-xs text-zinc-500 font-mono">
        제출 ID: {submissionId || "N/A"}
      </div>

      {/* 실패한 테스트케이스 모달 */}
      {failedTestcaseData && (
        <FailedTestcaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          failedOrder={displayOrder}
          testcase={failedTestcaseData}
        />
      )}
    </div>
  );
}
