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

// 모달에 전달할 테스트케이스 형태
interface TestcaseDisplayData {
  id: string;
  input_text: string;
  expected_output: string;
  is_hidden: boolean;
}

export function ResultViewer({ problem }: ResultViewerProps) {
  const { status, submissionId, result } = useSubmissionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── problem_testcases 직접 조회 상태 ────────────────────────────────
  // problem.problem_testcases 에 의존하지 않고 별도 테이블에서 직접 fetch.
  // WA 결과가 올 때 failedOrder 에 해당하는 테스트케이스를 찾기 위해 사용.
  const [allTestcases, setAllTestcases] = useState<{
    id: string;
    testcase_order: number;
    input_text: string;
    expected_output: string;
    is_hidden: boolean;
  }[]>([]);

  // problem.id 가 확정된 뒤 모든 테스트케이스(공개+히든) 조회.
  // 히든 케이스도 failedOrder 매칭에 필요하므로 is_hidden 조건 없이 가져옴.
  useEffect(() => {
    if (!problem?.id) return;

    async function fetchAllTestcases() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("problem_testcases")
        .select("id, testcase_order, input_text, expected_output, is_hidden")
        .eq("problem_id", problem!.id)  // FK: problem_testcases.problem_id → problems.id
        .eq("is_deleted", false)
        .order("testcase_order", { ascending: true });

      if (!error && data) {
        setAllTestcases(data);
      }
    }
    fetchAllTestcases();
  }, [problem?.id]);

  if (!status && !submissionId) return null;

  // ─── 공개 테스트케이스 수 계산 (히든 번호 보정용) ─────────────────────
  const publicCount = allTestcases.filter(t => !t.is_hidden).length;

  const { text: resultText, isSuccess, isFail, isPending, isError, colorClass } = getSubmissionLabel(
    status,
    result?.result,
    result?.failed_testcase_order,
    publicCount
  );

  const failedOrder = result?.failed_testcase_order;

  // failedOrder 에 해당하는 테스트케이스를 testcase_order 기준으로 탐색
  const failedTestcase = failedOrder != null
    ? allTestcases.find(t => t.testcase_order === failedOrder) ?? null
    : null;

  // 모달 전달용 데이터 정규화
  const failedTestcaseData: TestcaseDisplayData | null = failedTestcase
    ? {
        id: failedTestcase.id,
        input_text: failedTestcase.input_text,
        expected_output: failedTestcase.expected_output,
        is_hidden: failedTestcase.is_hidden,
      }
    : null;

  // 화면에 표시할 보정된 번호:
  // 히든 케이스(failedOrder > publicCount)는 "히든 n번" 으로 보정
  const displayOrder = failedOrder != null
    ? failedOrder > publicCount && publicCount > 0
      ? failedOrder - publicCount
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
          WA + failedOrder 가 있고 DB에서 해당 케이스를 찾은 경우에만 표시 */}
      {isFail && result?.result === "WA" && failedOrder != null && failedTestcaseData && (
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
