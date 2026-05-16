"use client";

import { CheckCircle, XCircle, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

export interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

export function TestResultViewer({ results }: { results: TestResult[] | null }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!results) return null;

  return (
    <div className="mt-4 flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-2">
        테스트 결과
      </h3>
      {results.map((res, idx) => (
        <div 
          key={idx} 
          className={`overflow-hidden rounded-xl border transition-colors duration-200 ${res.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
        >
          <button 
            className="w-full px-4 py-3 flex items-center justify-between focus:outline-none"
            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
          >
            <div className="flex items-center space-x-3">
              {res.passed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`font-semibold ${res.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                케이스 {idx + 1}
              </span>
            </div>
            {expandedIndex === idx ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          
          <div className={`transition-all duration-300 ${expandedIndex === idx ? 'max-h-96 border-t border-black/5 dark:border-white/5 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">입력 (Input)</div>
                <pre className="font-mono text-sm bg-black/5 dark:bg-black/40 p-2 rounded text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">{res.input || " "}</pre>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">예상 출력 (Expected Output)</div>
                <pre className="font-mono text-sm bg-black/5 dark:bg-black/40 p-2 rounded text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">{res.expectedOutput}</pre>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">실제 출력 (Actual Output)</div>
                <pre className={`font-mono text-sm bg-black/5 dark:bg-black/40 p-2 rounded whitespace-pre-wrap ${res.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{res.actualOutput}</pre>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
