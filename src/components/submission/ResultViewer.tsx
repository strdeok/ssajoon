"use client";

import { useSubmissionStore } from "@/store/submissionStore";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function ResultViewer() {
  const { status, submissionId } = useSubmissionStore();

  if (!status && !submissionId) return null;

  return (
    <div className="mt-4 p-6 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-lg transition-all duration-300">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">
        Execution Result
      </h3>
      
      <div className="flex items-center space-x-3">
        {status === "PENDING" && (
          <>
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-blue-400 font-medium text-lg animate-pulse">Judging...</span>
          </>
        )}
        
        {status === "AC" && (
          <>
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="text-green-400 font-bold text-lg">Accepted</span>
          </>
        )}
        
        {status === "WA" && (
          <>
            <XCircle className="w-6 h-6 text-red-500" />
            <span className="text-red-400 font-bold text-lg">Wrong Answer</span>
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-500 font-mono">
        Submission ID: {submissionId || "N/A"}
      </div>
    </div>
  );
}
