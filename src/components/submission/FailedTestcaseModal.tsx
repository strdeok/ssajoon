"use client";

import { useState } from "react";
import { X, Search, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface TestcaseDisplayData {
  id: string;
  input_text: string;
  expected_output: string;
  is_hidden: boolean;
}

interface FailedTestcaseModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  failedOrder?: number;
  testcase?: TestcaseDisplayData;
  submissionId?: string;
  problemId?: string;
}

export function FailedTestcaseModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  failedOrder: propFailedOrder,
  testcase: propTestcase,
  submissionId,
  problemId
}: FailedTestcaseModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [testcase, setTestcase] = useState<TestcaseDisplayData | null>(propTestcase || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const onClose = propOnClose || (() => setInternalIsOpen(false));
  const failedOrder = propFailedOrder || 0;

  const handleOpen = async () => {
    setInternalIsOpen(true);
    if (!propTestcase && submissionId && problemId && propFailedOrder) {
      await fetchTestcaseDetails();
    }
  };

  const fetchTestcaseDetails = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data, error: fetchError } = await supabase
        .from("problem_testcases")
        .select("*")
        .eq("problem_id", problemId)
        .eq("testcase_order", propFailedOrder)
        .single();
      
      if (fetchError) throw fetchError;
      if (data) {
        setTestcase({
          id: data.id,
          input_text: data.input_text,
          expected_output: data.expected_output,
          is_hidden: data.is_hidden
        });
      }
    } catch {
      setError("테스트케이스 정보를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submissionId && !propIsOpen && !internalIsOpen) {
    return (
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold transition-colors border border-red-200 dark:border-red-500/20 shadow-sm"
      >
        <Search className="w-4 h-4" />
        틀린 테스트케이스 보기
      </button>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            틀린 테스트케이스 분석
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-zinc-500">정보를 가져오는 중...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-red-500">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : testcase ? (
            <>
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm font-medium">
                이 제출은 {failedOrder}번 테스트케이스에서 오답 판정을 받았습니다.
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">입력값</h3>
                <div className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-xl p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                  {testcase.input_text || "입력값이 없습니다."}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">기대 출력값</h3>
                <div className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-xl p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                  {testcase.expected_output || "기대 출력값이 없습니다."}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg font-medium">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
