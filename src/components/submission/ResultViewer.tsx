"use client";

import { useState, useEffect } from "react";
import { useSubmissionStore } from "@/store/submissionStore";
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock, HardDrive, Eye } from "lucide-react";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";
import { Problem } from "@/types/problem";
import { createClient } from "@/utils/supabase/client";
import { FailedTestcaseModal } from "./FailedTestcaseModal";

interface ResultViewerProps {
  problem: Problem | null;
}

interface TestcaseDisplayData {
  id: string;
  input_text: string;
  expected_output: string;
  is_hidden: boolean;
}

export function ResultViewer({ problem }: ResultViewerProps) {
  const { status, submissionId, result } = useSubmissionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * WA 결과가 왔을 때, failed_testcase_order 값으로
   * problem_testcases 테이블에서 해당 행을 직접 조회해서 저장.
   *
   * 조회 조건:
   *   problem_testcases.problem_id = problem.id   (외래키)
   *   problem_testcases.testcase_order = failed_testcase_order
   *   problem_testcases.is_deleted = false
   */
  const [failedTestcaseData, setFailedTestcaseData] = useState<TestcaseDisplayData | null>(null);

  const failedOrder = result?.failed_testcase_order ?? null;
  const isWA = result?.result === "WA";

  useEffect(() => {
    // WA + failedOrder + problem.id 세 가지 모두 확정됐을 때만 조회
    if (!isWA || failedOrder == null || !problem?.id) {
      setFailedTestcaseData(null);
      return;
    }

    async function fetchFailedTestcase() {
      const supabase = createClient();

      // submissions.failed_testcase_order = problem_testcases.testcase_order
      const { data, error } = await supabase
        .from("problem_testcases")
        .select("id, input_text, expected_output, is_hidden")
        .eq("problem_id", problem!.id)          // 이 문제의 테스트케이스 중
        .eq("testcase_order", failedOrder)       // 틀린 순번과 일치하는 행 하나
        .eq("is_deleted", false)
        .single();                               // 단일 행 반환

      if (!error && data) {
        setFailedTestcaseData({
          id: data.id,
          input_text: data.input_text,
          expected_output: data.expected_output,
          is_hidden: data.is_hidden,
        });
      } else {
        setFailedTestcaseData(null);
      }
    }

    fetchFailedTestcase();
  }, [isWA, failedOrder, problem?.id]);

  if (!status && !submissionId) return null;

  const { text: resultText, isSuccess, isFail, isPending, isError, colorClass } = getSubmissionLabel(
    status,
    result?.result,
    result?.failed_testcase_order
  );

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

      {/* 리소스 사용량 */}
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

      {/* 틀린 테스트케이스 보기 버튼:
          WA이고 DB에서 해당 테스트케이스를 찾은 경우에만 표시 */}
      {isWA && failedTestcaseData && (
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
          failedOrder={failedOrder ?? 0}
          testcase={failedTestcaseData}
        />
      )}
    </div>
  );
}
