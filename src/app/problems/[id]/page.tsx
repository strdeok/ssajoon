"use client";

import { use, useEffect, useState, useRef } from "react";
import { ProblemDetail } from "@/components/problem/ProblemDetail";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ResultViewer } from "@/components/submission/ResultViewer";
import {
  TestResultViewer,
  TestResult,
} from "@/components/submission/TestResultViewer";
import { useSubmissionStore } from "@/store/submissionStore";
import { Play, Send, Loader2 } from "lucide-react";
import { Problem } from "@/types/problem";

export default function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { submissionId, status, setSubmissionId, setStatus, reset } =
    useSubmissionStore();

  const pollingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProblem(data);
        setIsLoading(false);
      });

    // Reset submission store on unmount or problem change
    return () => reset();
  }, [id, reset]);

  // Polling Effect
  useEffect(() => {
    if (submissionId && status === "PENDING") {
      pollingTimer.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/result?id=${submissionId}`);
          const data = await res.json();
          if (data.status !== "PENDING") {
            setStatus(data.status);
            if (pollingTimer.current) clearInterval(pollingTimer.current);
          }
        } catch (err) {
          console.error(err);
        }
      }, 500); // Poll every 500ms
    }

    return () => {
      if (pollingTimer.current) clearInterval(pollingTimer.current);
    };
  }, [submissionId, status, setStatus]);

  const handleSubmit = async () => {
    if (!code.trim()) return;

    reset(); // Clear previous result
    setStatus("PENDING");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: id, code, language }),
      });
      const data = await res.json();

      if (data.submissionId) {
        setSubmissionId(data.submissionId);
      }
    } catch (err) {
      console.error(err);
      setStatus(null);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;

    setIsTesting(true);
    setTestResults(null);
    reset(); // Optionally clear submission results when running a test

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: id, code, language }),
      });
      const data = await res.json();

      if (data.results) {
        setTestResults(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading || !problem) {
    return (
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-black p-4 gap-4">
        {/* Left panel skeleton */}
        <div className="flex-1 lg:w-1/2 flex flex-col min-h-0 bg-white dark:bg-[#09090b] rounded-xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/5 p-8">
          <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-10"></div>
          <div className="space-y-6">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-4 w-11/12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-4 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-10 mb-4"></div>
            <div className="h-24 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Right panel skeleton */}
        <div className="flex-1 lg:w-1/2 flex flex-col min-h-0 gap-4">
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-200 dark:border-white/5"></div>
          <div className="h-20 bg-white dark:bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-200 dark:border-white/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-black p-4 gap-4">
      {/* Left panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-0 bg-white dark:bg-[#09090b] rounded-xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/5">
        <ProblemDetail problem={problem} />
      </div>

      {/* Right panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-0 gap-4">
        {/* Editor wrapper */}
        <div className="flex-1 min-h-0 relative group">
          <CodeEditor
            value={code}
            onChange={(val) => setCode(val || "")}
            language={language}
          />
        </div>

        {/* Action bar and Results */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-white/5 backdrop-blur-md shadow-sm">
            <div className="flex items-center space-x-2">
              <label
                htmlFor="language-select"
                className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
              >
                언어
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none transition-all cursor-pointer"
              >
                <option value="python">Python</option>
                <option value="java">Java 17</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRunCode}
                disabled={isTesting || !code.trim()}
                className="flex items-center space-x-2 bg-zinc-200 hover:bg-zinc-300 disabled:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-900 text-zinc-900 dark:text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>코드 실행</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={status === "PENDING" || !code.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-zinc-300 disabled:to-zinc-300 dark:disabled:from-zinc-700 dark:disabled:to-zinc-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                {status === "PENDING" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{status === "PENDING" ? "채점 중..." : "제출하기"}</span>
              </button>
            </div>
          </div>

          <TestResultViewer results={testResults} />
          <ResultViewer />
        </div>
      </div>
    </div>
  );
}
