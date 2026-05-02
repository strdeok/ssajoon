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

  const publicTestcaseCount = problem?.problem_testcases?.filter(t => !t.is_hidden).length || 0;
  
  const { text: resultText, isSuccess, isFail, isPending, isError, colorClass } = getSubmissionLabel(
    status, 
    result?.result, 
    result?.failed_testcase_order,
    publicTestcaseCount
  );

  const failedOrder = result?.failed_testcase_order;
  // failedOrder가 있을 때 해당하는 테스트케이스 찾기
  // 클라이언트의 testcase 목록은 0-index 기반 배열이며, order는 1-index일 가능성이 높음
  // 그러나 API에서 testcase_order 순으로 정렬해서 가져오므로 배열 인덱스와 일치하는지 확인해야 함
  // 여기서는 명시적으로 testcase_order와 일치하는 항목을 찾음
  const failedTestcase = problem?.problem_testcases?.find(t => t.testcase_order === failedOrder);

  // 화면에 표시할 번호 보정
  const displayOrder = failedOrder 
    ? (failedOrder > publicTestcaseCount ? failedOrder - publicTestcaseCount : failedOrder)
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

      {/* 틀린 테스트케이스 보기 버튼 */}
      {isFail && result?.result === "WA" && failedTestcase && (
        <div className="mt-4 mb-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-bold transition-colors shadow-sm"
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
      {failedTestcase && (
        <FailedTestcaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          failedOrder={displayOrder}
          testcase={failedTestcase}
        />
      )}
    </div>
  );
}
