"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Sun, Moon } from "lucide-react";
import { ProblemDetail } from "@/components/problem/ProblemDetail";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ResultViewer } from "@/components/submission/ResultViewer";
import {
  TestResultViewer,
  TestResult,
} from "@/components/submission/TestResultViewer";
import { useSubmissionStore } from "@/store/submissionStore";
import { Problem } from "@/types/problem";
import type { SubmissionStatus } from "@/types/submission";
import { createClient } from "@/utils/supabase/client";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";
import { useProblemStarterCode } from "@/hooks/useProblemStarterCode";
type JudgeEventPayload = {
  submissionId: string | number;
  phase: SubmissionStatus;
  completedTestcases: number;
  totalTestcases: number;
  progressPercent: number;
  result: SubmissionStatus | null;
};
export default function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState("python");
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [progress, setProgress] = useState<JudgeEventPayload | null>(null);
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("dark");
  const eventSourceRef = useRef<EventSource | null>(null);
  const receivedDoneRef = useRef(false);
  const isLoggedIn = Boolean(user?.id);
  const isCodeSectionLocked = isAuthLoading || !isLoggedIn;
  const shouldShowLoginModal = !isAuthLoading && !isLoggedIn;
  const { code, isCodeLoading, handleCodeChange } = useProblemStarterCode({
    problemId: id,
    userId: user?.id,
    language,
  });
  const isCodeActionDisabled =
    isCodeSectionLocked || isSubmitting || isTesting || isCodeLoading;
  const { submissionId, status, result, setSubmissionId, setStatus, reset } =
    useSubmissionStore();
  const closeEventSource = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);
  const parseJudgeEvent = useCallback((event: Event) => {
    const messageEvent = event as MessageEvent<string>;
    return JSON.parse(messageEvent.data) as JudgeEventPayload;
  }, []);
  const handleRunningEvent = useCallback(
    (event: Event) => {
      try {
        const payload = parseJudgeEvent(event);
        setProgress({ ...payload });
        setStatus("RUNNING");
      } catch (error) {
        console.error("RUNNING 이벤트 파싱 실패:", error);
      }
    },
    [parseJudgeEvent, setStatus],
  );
  const handleDoneEvent = useCallback(
    (event: Event) => {
      try {
        const payload = parseJudgeEvent(event);
        receivedDoneRef.current = true;
        setProgress({ ...payload });
        setStatus((payload.result || "DONE") as any);
        setIsSubmitting(false);
        closeEventSource();
      } catch (error) {
        setSubmitError("채점 결과를 처리하지 못했습니다.");
        setIsSubmitting(false);
        closeEventSource();
      }
    },
    [closeEventSource, parseJudgeEvent, setStatus],
  );
  const handleProxyErrorEvent = useCallback(
    (event: Event) => {
      const messageEvent = event as MessageEvent<string>;
      console.error("SSE PROXY_ERROR:", messageEvent.data);
      setSubmitError("채점 상태를 실시간으로 불러오지 못했습니다.");
      setIsSubmitting(false);
      closeEventSource();
    },
    [closeEventSource],
  );
  const startJudgeEventStream = useCallback(
    (sid: string) => {
      closeEventSource();
      receivedDoneRef.current = false;
      const eventSource = new EventSource(`/api/submissions/${sid}/events`);
      eventSourceRef.current = eventSource;
      eventSource.onopen = () => {
        console.log("SSE 연결 성공");
      };
      eventSource.addEventListener("RUNNING", handleRunningEvent);
      eventSource.addEventListener("DONE", handleDoneEvent);
      eventSource.addEventListener("PROXY_ERROR", handleProxyErrorEvent);
      eventSource.onmessage = (event) => {
        console.log("SSE message:", event.data);
      };
      eventSource.onerror = (event) => {
        if (receivedDoneRef.current) {
          closeEventSource();
          return;
        }
        console.error("SSE error:", event);
        setSubmitError("채점 상태를 실시간으로 불러오지 못했습니다.");
        setIsSubmitting(false);
        closeEventSource();
      };
    },
    [
      closeEventSource,
      handleDoneEvent,
      handleProxyErrorEvent,
      handleRunningEvent,
    ],
  );
  useEffect(() => {
    const fetchUser = async () => {
      setIsAuthLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("유저 조회 실패:", error);
      }
      setUser(data.user ?? null);
      setIsAuthLoading(false);
    };
    const fetchProblem = async () => {
      setIsLoading(true);
      const response = await fetch(`/api/problems/${id}`);
      if (response.status === 404) {
        setProblem(null);
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setProblem(data);
      setIsLoading(false);
    };
    void fetchUser();
    void fetchProblem();
    return () => {
      closeEventSource();
      reset();
    };
  }, [closeEventSource, id, reset]);
  useEffect(() => {
    const savedTheme = localStorage.getItem("editorTheme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setEditorTheme(savedTheme);
    }
  }, []);
  useEffect(() => {
    if (!submissionId || !status) return;
    if (status === "PENDING" || status === "QUEUED" || status === "RUNNING") {
      return;
    }
    const timer = window.setTimeout(() => {
      router.push(`/submissions/${submissionId}`);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [router, status, submissionId]);
  const handleToggleEditorTheme = () => {
    if (isCodeSectionLocked) return;
    const nextTheme = editorTheme === "light" ? "dark" : "light";
    setEditorTheme(nextTheme);
    localStorage.setItem("editorTheme", nextTheme);
  };
  const handleSubmit = async () => {
    setSubmitError(null);
    if (isCodeSectionLocked) {
      setSubmitError("로그인 후 코드를 제출할 수 있습니다.");
      return;
    }
    if (!code.trim()) {
      setSubmitError("제출할 코드를 작성해주세요.");
      return;
    }
    reset();
    closeEventSource();
    setIsSubmitting(true);
    setProgress(null);
    setStatus("PENDING");
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: id,
          language,
          sourceCode: code,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "제출 생성에 실패했습니다.");
      }
      const sid = String(data.submissionId);
      if (!sid) {
        throw new Error("제출 ID가 올바르지 않습니다.");
      }
      setSubmissionId(sid);
      startJudgeEventStream(sid);
      const judgeResponse = await fetch("/api/judge-executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: sid }),
      });
      if (!judgeResponse.ok) {
        const judgeData = await judgeResponse.json().catch(() => ({}));
        throw new Error(judgeData.error || "채점 요청에 실패했습니다.");
      }
    } catch (error: any) {
      setSubmitError(error.message || "제출 중 오류가 발생했습니다.");
      setStatus(null);
      setIsSubmitting(false);
      closeEventSource();
    }
  };
  const label = getSubmissionLabel(
    status,
    result?.result,
    result?.failed_testcase_order,
  );
  let editorBorderClass = "border-transparent";
  if (label.isSuccess) {
    editorBorderClass = "border-emerald-500 ring-4 ring-emerald-500/20";
  } else if (label.isFail) {
    editorBorderClass = "border-red-500 ring-4 ring-red-500/20";
  } else if (label.isPending) {
    editorBorderClass = "border-blue-500 ring-4 ring-blue-500/20";
  }
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }
  if (!problem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            문제가 존재하지 않습니다
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400">
            요청하신 문제는 존재하지 않거나 삭제되었을 수 있습니다.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col lg:flex-row lg:h-full bg-zinc-50 dark:bg-black p-4 gap-4">
      <div className="flex-1 lg:w-1/2 h-[calc(100dvh-120px)] overflow-y-scroll flex flex-col min-h-0 bg-white dark:bg-[#09090b] rounded-xl shadow-2xl border border-zinc-200 dark:border-white/5 relative">
        <ProblemDetail problem={problem} />
      </div>

      <div
        id="code-editor-section"
        className="flex-1 lg:w-1/2 flex flex-col gap-4 relative scroll-mt-20"
      >
        <div
          className={`flex flex-1 flex-col gap-4 transition-all duration-300 ${
            shouldShowLoginModal
              ? "pointer-events-none select-none blur-sm"
              : ""
          }`}
        >
          <div
            className={`h-full flex flex-col relative rounded-xl border-2 transition-all duration-300 ${editorBorderClass} lg:overflow-hidden`}
          >
            <button
              onClick={handleToggleEditorTheme}
              disabled={isCodeSectionLocked}
              className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all shadow-md backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="에디터 테마 변경"
            >
              {editorTheme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            <CodeEditor
              readOnly={isCodeSectionLocked}
              value={code}
              onChange={(value) => {
                if (isCodeSectionLocked) return;
                handleCodeChange(value);
              }}
              language={language}
              theme={editorTheme || undefined}
              isLoading={isCodeLoading}
            />
          </div>

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
                  disabled={isCodeSectionLocked}
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="python">Python</option>

                  <option value="java">Java</option>

                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-3 lg:mt-0">
                <button
                  onClick={handleSubmit}
                  disabled={isCodeActionDisabled}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  제출
                </button>
              </div>
            </div>

            {status && (
              <ResultViewer
                problem={problem}
                progress={progress}
                submitError={submitError}
              />
            )}

            {testResults && <TestResultViewer results={testResults} />}
          </div>
        </div>

        {shouldShowLoginModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-black/20">
            <div className="w-[340px] rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                로그인이 필요합니다
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                코드를 작성하거나 제출하려면 로그인 후 이용해주세요.
              </p>

              <button
                onClick={() => router.push("/login")}
                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                로그인하러 가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
