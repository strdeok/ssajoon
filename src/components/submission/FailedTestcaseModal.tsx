"use client";

import { X } from "lucide-react";

// ProblemTestcase 타입에 직접 의존하지 않고 필요한 필드만 정의
// 이로써 problem_testcases 와 problem_examples 양쪽에서 데이터를 넘길 수 있음
interface TestcaseDisplayData {
  id: string;
  input_text: string;
  expected_output: string;
  is_hidden: boolean;
}

interface FailedTestcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  failedOrder: number;
  testcase: TestcaseDisplayData;
}

export function FailedTestcaseModal({ isOpen, onClose, failedOrder, testcase }: FailedTestcaseModalProps) {
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
            틀린 테스트케이스 보기
          </h2>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm font-medium">
            이 제출은 {failedOrder}번 테스트케이스에서 오답 판정을 받았습니다.
            {testcase.is_hidden && " (이 테스트케이스는 숨겨져 있었지만, 오답 분석을 위해 내용이 공개됩니다.)"}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-2">
              입력값
            </h3>
            <div className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-xl p-4 font-mono text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
              {testcase.input_text || "입력값이 없습니다."}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-2">
              기대 출력값
            </h3>
            <div className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-xl p-4 font-mono text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
              {testcase.expected_output || "기대 출력값이 없습니다."}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
