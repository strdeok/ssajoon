"use client";

import { useSubmissionStore } from "@/store/submissionStore";
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock, HardDrive } from "lucide-react";

export function ResultViewer() {
  const { status, submissionId, result } = useSubmissionStore();

  if (!status && !submissionId) return null;

  // 상태 판별
  const isPending = status === "PENDING" || status === "QUEUED";
  const isRunning = status === "RUNNING";
  const isError = status === "FAILED" || status === "ERROR";
  
  // result 객체가 있고 그 안에 상태(result 필드)가 있다면 그것을 우선하거나 
  // status 자체를 기반으로 정답 여부 판단
  const finalStatus = result?.result || status;
  
  const isSuccess = finalStatus === "AC";
  const isFail = ["WA", "CE", "RE", "TLE", "MLE"].includes(finalStatus as string);

  return (
    <div className="mt-4 p-6 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-lg transition-all duration-300">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">
        채점 결과
      </h3>
      
      <div className="flex items-center space-x-3 mb-4">
        {isPending && (
          <>
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            <span className="text-zinc-500 font-medium text-lg animate-pulse">채점 대기 중...</span>
          </>
        )}
        
        {isRunning && (
          <>
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-blue-500 font-medium text-lg animate-pulse">채점 중...</span>
          </>
        )}

        {isSuccess && (
          <>
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="text-green-500 font-bold text-lg">맞았습니다!!</span>
          </>
        )}
        
        {isFail && (
          <>
            <XCircle className="w-6 h-6 text-red-500" />
            <span className="text-red-500 font-bold text-lg">
              {finalStatus === "WA" ? "틀렸습니다" : 
               finalStatus === "CE" ? "컴파일 에러" : 
               finalStatus === "RE" ? "런타임 에러" : 
               finalStatus === "TLE" ? "시간 초과" : 
               finalStatus === "MLE" ? "메모리 초과" : "오답"}
            </span>
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
