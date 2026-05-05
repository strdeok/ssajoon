import React from "react";
import { CheckCircle2, XCircle, Clock, Database, ChevronRight, AlertCircle } from "lucide-react";

interface TestCaseResult {
  id: string;
  testcase_id: string;
  result: string;
  execution_time_ms: number | null;
  memory_kb: number | null;
  error_message: string | null;
}

interface TestCaseResultsProps {
  results: TestCaseResult[];
}

const getStatusBadge = (result: string) => {
  const normalized = result.toUpperCase();
  switch (normalized) {
    case "AC":
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="w-3.5 h-3.5" />
          정답
        </span>
      );
    case "WA":
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500">
          <XCircle className="w-3.5 h-3.5" />
          오답
        </span>
      );
    case "TLE":
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
          <Clock className="w-3.5 h-3.5" />
          시간 초과
        </span>
      );
    case "MLE":
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
          <Database className="w-3.5 h-3.5" />
          메모리 초과
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-500">
          {result}
        </span>
      );
  }
};

export default function TestCaseResults({ results }: TestCaseResultsProps) {
  if (!results || results.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 p-12 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">상세 결과 데이터 없음</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          테스트케이스별 상세 결과가 존재하지 않거나 처리 중입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          테스트케이스 상세 결과
          <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
            ({results.length}개)
          </span>
        </h2>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-16">#</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">결과</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">실행 시간</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">메모리</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {results.map((result, index) => (
                <React.Fragment key={result.id}>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-zinc-500 dark:text-zinc-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(result.result)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300 font-mono">
                      {result.execution_time_ms !== null ? `${result.execution_time_ms}ms` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300 font-mono">
                      {result.memory_kb !== null ? `${result.memory_kb}KB` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-zinc-300 dark:text-zinc-700 hover:text-blue-500 transition-colors p-1">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                  {result.error_message && (
                    <tr className="bg-red-50/30 dark:bg-red-500/5">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                          <p className="text-xs font-bold text-red-500 dark:text-red-400 mb-2 uppercase tracking-tight">Error Log</p>
                          <pre className="text-xs text-zinc-600 dark:text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {result.error_message}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
