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
import { Play, Send, Loader2, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Problem } from "@/types/problem";
import { createClient } from "@/utils/supabase/client";
import { SubmissionStatusListener } from "@/components/submission/SubmissionStatusListener";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";
import { useProblemStarterCode } from "@/hooks/useProblemStarterCode";

export default function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState("python"); // 현재 선택된 언어 상태를 정의한다.
  const [editorTheme, setEditorTheme] = useState<"light" | "dark" | null>(null); // 에디터 전용 테마 상태를 정의한다.


  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { // 문제별 시작 코드 hook을 사용한다.
    code, // 에디터에 표시할 코드 값을 가져온다.
    isCodeLoading, // 최신 제출 코드 로딩 상태를 가져온다.
    handleCodeChange, // 에디터 변경 핸들러를 가져온다.
  } = useProblemStarterCode({ // 현재 문제와 유저, 언어를 기준으로 시작 코드를 관리한다.
    problemId: id, // URL 파라미터에서 가져온 id를 직접 전달한다.
    userId: user?.id, // 현재 로그인 유저 id를 전달한다.
    language, // 현재 선택된 언어를 전달한다.
  }); // useProblemStarterCode 호출을 종료한다.
  const { submissionId, status, result, setSubmissionId, setStatus, reset } =
    useSubmissionStore();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    fetch(`/api/problems/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProblem(data);
        setIsLoading(false);
      });

    // Reset submission store on unmount or problem change
    return () => reset();
  }, [id, reset]);

  // 채점 완료 시 상세 페이지로 자동 이동
  useEffect(() => {
    if (submissionId && status && status !== "PENDING" && status !== "QUEUED" && status !== "RUNNING") {
      // 결과 애니메이션을 잠시 보여준 뒤(1.5초) 상세 페이지로 이동
      const timer = setTimeout(() => {
        router.push(`/submissions/${submissionId}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, submissionId, router]);

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!code.trim()) {
      setSubmitError("제출할 코드를 작성해주세요.");
      return;
    }

    reset(); // Clear previous result
    setIsSubmitting(true);
    setStatus("PENDING"); // 낙관적 업데이트: 클릭 즉시 채점 대기 중 상태로 변경

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: id, language, sourceCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "제출 실패: 서버 오류");
      }

      setStatus("PENDING");

      if (data.submissionId || data.id) {
        setSubmissionId(data.submissionId || data.id);
      } else {
        setStatus("AC");
      }
    } catch (err: any) {
      setSubmitError(err.message || "제출 중 오류가 발생했습니다.");
      setStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI 상태 계산 로직 통합
  const {
    text: resultText,
    isSuccess,
    isFail,
    isPending,
    colorClass,
  } = getSubmissionLabel(status, result?.result, result?.failed_testcase_order);

  let editorBorderClass = "border-transparent";
  if (isSuccess)
    editorBorderClass = "border-emerald-500 ring-4 ring-emerald-500/20";
  else if (isFail) editorBorderClass = "border-red-500 ring-4 ring-red-500/20";
  else if (isPending)
    editorBorderClass = "border-blue-500 ring-4 ring-blue-500/20";

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
    <div className="flex-1 flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] bg-zinc-50 dark:bg-black p-4 gap-4">
      {/* Left panel */}
      {/* Left panel: overflow-hidden 제거 → ProblemDetail이 직접 높이 제어 */}
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-0 bg-white dark:bg-[#09090b] rounded-xl shadow-2xl border border-zinc-200 dark:border-white/5 relative">
        <ProblemDetail problem={problem} />
      </div>

      {/* Right panel */}
      <div
        id="code-editor-section"
        className="flex-1 lg:w-1/2 flex flex-col gap-4 relative scroll-mt-20"
      >
        {/* Editor wrapper */}
        <div
          className={`min-h-60 flex-1 flex flex-col relative group rounded-xl border-2 transition-all duration-300 ${editorBorderClass} lg:overflow-hidden`}
        >
          <button
            onClick={() => setEditorTheme(editorTheme === "light" ? "dark" : "light")}
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all shadow-md backdrop-blur-sm border border-zinc-200 dark:border-zinc-700"
            title="에디터 테마 변경"
          >
            {editorTheme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <CodeEditor // 코드 에디터를 렌더링한다.
            value={code} // 최신 제출 코드 또는 기본 템플릿이 들어간 code 상태를 전달한다.
            onChange={handleCodeChange} // 사용자가 코드를 수정하면 hook의 변경 핸들러를 실행한다.
            language={language} // 현재 선택된 언어를 전달한다.
            theme={editorTheme || undefined}
            isLoading={isCodeLoading} // 최신 제출 코드 조회 중이면 로딩 오버레이를 보여준다.
          />
        </div>

        {/* Action bar and Results */}
        <div className="flex flex-col gap-4 lg:relative sticky bottom-4 z-40">
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-center bg-white/95 dark:bg-zinc-900/95 p-4 rounded-xl border border-zinc-200 dark:border-white/10 backdrop-blur-xl shadow-2xl transition-all">
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
              {resultText && !submitError && (
                <span className={`text-sm font-bold mr-2 ${colorClass}`}>
                  {resultText}
                </span>
              )}
              {submitError && (
                <span className="text-sm text-red-500 dark:text-red-400 font-medium mr-2 animate-pulse">
                  {submitError}
                </span>
              )}
              {!user && (
                <span className="text-sm text-red-500 dark:text-red-400 font-medium mr-2">
                  로그인 후 실행/제출 가능
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={status === "PENDING" || !code.trim() || !user}
                className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-zinc-300 disabled:to-zinc-300 dark:disabled:from-zinc-700 dark:disabled:to-zinc-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
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
          <ResultViewer problem={problem} />
          <SubmissionStatusListener submissionId={submissionId} />
        </div>
      </div>

      {/* 좁은 화면용 '코드 작성으로 이동' 플로팅 버튼 */}
      <button
        className="lg:hidden fixed top-24 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors active:scale-95"
        onClick={() => {
          document
            .getElementById("code-editor-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <span>↓ 코드 작성</span>
      </button>
    </div>
  );
}
