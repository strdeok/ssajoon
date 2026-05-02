"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChevronDown, ChevronUp, Loader2, Clock, HardDrive, Calendar } from "lucide-react";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";

interface SubmissionSummary {
  id: string;
  language: string;
  status: string;
  result: string;
  execution_time_ms: number | null;
  memory_kb: number | null;
  submitted_at: string;
  failed_testcase_order?: number | null;
}

interface SubmissionCodeItemProps {
  submission: SubmissionSummary;
  /** 부모(SubmissionHistoryPanel)가 제어하는 open 상태 */
  isOpen: boolean;
  /** 이 아이템 토글 클릭 시 부모에게 id 전달 */
  onToggle: (id: string) => void;
}

export function SubmissionCodeItem({ submission, isOpen, onToggle }: SubmissionCodeItemProps) {
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    // 항상 부모에 id 전달 (부모가 단일 오픈 로직을 처리)
    onToggle(submission.id);

    // 열리는 경우이고 아직 코드를 가져오지 않았다면 fetch
    if (!isOpen && sourceCode === null) {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("submissions")
          .select("source_code")
          .eq("id", submission.id)
          .single();

        if (fetchError) throw fetchError;
        if (data) setSourceCode(data.source_code);
      } catch (err: any) {
        setError("코드를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const { text: resultText, isSuccess, isPending } = getSubmissionLabel(
    submission.status,
    submission.result,
    submission.failed_testcase_order
  );

  const badgeClass = isSuccess
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
    : isPending
    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 animate-pulse"
    : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
      <button
        onClick={handleClick}
        className="w-full p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left cursor-pointer focus:outline-none"
      >
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${badgeClass}`}>
            {resultText}
          </span>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            {new Date(submission.submitted_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
          </span>
        </div>

        <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 실행 시간
              </span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {submission.execution_time_ms ? `${submission.execution_time_ms} ms` : "-"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> 메모리
              </span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {submission.memory_kb ? `${submission.memory_kb} KB` : "-"}
              </span>
            </div>
          </div>
          <div className="text-zinc-400 ml-2">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* 코드 영역: max-h-96 으로 긴 코드가 패널을 무한 확장하지 않도록 제한 */}
      {isOpen && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a] p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs text-zinc-500">코드 정보를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm py-4 text-center">{error}</div>
          ) : sourceCode ? (
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar rounded-md max-h-96">
              <pre className="text-sm font-mono text-zinc-800 dark:text-zinc-300 leading-relaxed m-0 p-2">
                {sourceCode}
              </pre>
            </div>
          ) : (
            <div className="text-zinc-500 text-sm py-4 text-center">코드가 존재하지 않습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
