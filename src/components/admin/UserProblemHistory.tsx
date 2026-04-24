"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Code2, Clock, HardDrive, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";
import Link from "next/link";

export type SubmissionHistoryItem = {
  id: string;
  problem_id: number;
  language: string;
  status: string;
  result: string;
  submitted_at: string;
  execution_time_ms: number | null;
  memory_kb: number | null;
  failed_testcase_order?: number | null;
  source_code: string | null;
  problems: { title: string } | null;
};

export type GroupedProblemHistory = {
  problem_id: number;
  title: string;
  submissions: SubmissionHistoryItem[];
};

interface UserProblemHistoryProps {
  groupedData: GroupedProblemHistory[];
}

// 개별 제출 내역 컴포넌트
function SubmissionItemRow({ submission }: { submission: SubmissionHistoryItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const { text: resultText, isSuccess, isPending, colorClass } = getSubmissionLabel(
    submission.status,
    submission.result,
    submission.failed_testcase_order
  );

  const badgeClass = isSuccess 
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
    : isPending
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 animate-pulse'
      : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20';

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
      <div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${badgeClass} whitespace-nowrap`}>
            {resultText}
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {new Date(submission.submitted_at).toLocaleString('ko-KR')}
          </span>
          <span className="text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            {submission.language}
          </span>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end text-xs text-zinc-500">
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {submission.execution_time_ms ? `${submission.execution_time_ms}ms` : '-'}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" />
              {submission.memory_kb ? `${submission.memory_kb}KB` : '-'}
            </span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a] p-4">
          {submission.source_code ? (
            <div className="overflow-x-auto rounded-md custom-scrollbar">
              <pre className="text-xs font-mono text-zinc-800 dark:text-zinc-300 leading-relaxed m-0 p-2">
                {submission.source_code}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-2">코드 정보가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

// 문제별 그룹 컴포넌트
function ProblemGroup({ group }: { group: GroupedProblemHistory }) {
  const [isGroupOpen, setIsGroupOpen] = useState(true);
  
  // 그룹 내 AC 여부 확인
  const hasSuccess = group.submissions.some(
    sub => sub.result === 'AC' || sub.status === 'AC' || sub.status === 'SUCCESS' || sub.result === 'SUCCESS'
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsGroupOpen(!isGroupOpen)}
      >
        <div className="flex items-center gap-3">
          {hasSuccess ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <h3 className="font-bold text-zinc-900 dark:text-white">
            <Link 
              href={`/problems/${group.problem_id}`} 
              className="hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {group.problem_id}번. {group.title}
            </Link>
          </h3>
          <span className="text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
            제출 {group.submissions.length}회
          </span>
        </div>
        <div>
          {isGroupOpen ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
        </div>
      </div>
      
      {isGroupOpen && (
        <div className="p-4 space-y-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          {group.submissions.map(sub => (
            <SubmissionItemRow key={sub.id} submission={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

export function UserProblemHistory({ groupedData }: UserProblemHistoryProps) {
  if (groupedData.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <Code2 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400">해당 조건에 맞는 문제 풀이 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedData.map((group) => (
        <ProblemGroup key={group.problem_id} group={group} />
      ))}
    </div>
  );
}
