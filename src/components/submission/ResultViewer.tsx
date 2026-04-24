"use client";

import { useSubmissionStore } from "@/store/submissionStore";
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock, HardDrive } from "lucide-react";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";

export function ResultViewer() {
  const { status, submissionId, result } = useSubmissionStore();

  if (!status && !submissionId) return null;

  const { text: resultText, isSuccess, isFail, isPending, isError, colorClass } = getSubmissionLabel(status, result?.result, result?.fail_order);

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

      <div className="mt-2 text-xs text-zinc-500 font-mono">
        제출 ID: {submissionId || "N/A"}
      </div>
    </div>
  );
}
