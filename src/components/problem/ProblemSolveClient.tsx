"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Moon, Send, Sun } from "lucide-react";
import type { Problem } from "@/types/problem";
import type { SubmissionStatus } from "@/types/submission";
import { getDefaultCodeTemplate, normalizeLanguage } from "@/lib/codeTemplates";
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel";
import { useSubmissionStore } from "@/store/submissionStore";
import { ResultViewer } from "@/components/submission/ResultViewer";
import {
  TestResult,
  TestResultViewer,
} from "@/components/submission/TestResultViewer";
import { EditorSkeleton } from "@/components/problem/EditorSkeleton";

const CodeEditor = dynamic(
  () => import("@/components/editor/CodeEditor").then((mod) => mod.CodeEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

type JudgeEventPayload = {
  submissionId: string | number;
  phase: SubmissionStatus;
  completedTestcases: number;
  totalTestcases: number;
  progressPercent: number;
  result: SubmissionStatus | null;
};

type SolveState = {
  authenticated: boolean;
  role: string;
  preferredLanguage: string | null;
  initialLanguage: string;
  initialSourceCode: string;
  hasAcceptedSubmission: boolean;
};

type SavedCodeResponse = {
  sourceCode: string;
  hasAcceptedSubmission: boolean;
};

type ProblemSolveClientProps = {
  problem: Problem;
};

function getIdleHandle(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(callback, { timeout: 1200 });
  }

  return window.setTimeout(callback, 500);
}

function cancelIdleHandle(handle: ReturnType<typeof getIdleHandle>) {
  if (typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
}

export function ProblemSolveClient({ problem }: ProblemSolveClientProps) {
  const router = useRouter();
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(getDefaultCodeTemplate("python"));
  const [isSolveStateLoading, setIsSolveStateLoading] = useState(true);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testResults] = useState<TestResult[] | null>(null);
  const [isTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState<JudgeEventPayload | null>(null);
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("dark");
  const [editorReady, setEditorReady] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const receivedDoneRef = useRef(false);
  const languageRequestRef = useRef(0);
  const userEditedRef = useRef(false);
  const isCodeSectionLocked = isSolveStateLoading || !isAuthenticated;
  const shouldShowLoginModal = !isSolveStateLoading && !isAuthenticated;
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
        setStatus((payload.result || "DONE") as SubmissionStatus);
        setIsSubmitting(false);
        closeEventSource();
      } catch {
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
      eventSource.addEventListener("RUNNING", handleRunningEvent);
      eventSource.addEventListener("DONE", handleDoneEvent);
      eventSource.addEventListener("PROXY_ERROR", handleProxyErrorEvent);
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
    const idleHandle = getIdleHandle(() => setEditorReady(true));
    return () => cancelIdleHandle(idleHandle);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("editorTheme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setEditorTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadSolveState() {
      setIsSolveStateLoading(true);
      const response = await fetch(`/api/problems/${problem.id}/solve-state`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("풀이 상태를 불러오지 못했습니다.");
      }

      const data = (await response.json()) as SolveState;

      if (ignore) return;

      const nextLanguage = normalizeLanguage(data.initialLanguage);
      setIsAuthenticated(data.authenticated);
      setLanguage(nextLanguage);
      setCode(data.initialSourceCode || getDefaultCodeTemplate(nextLanguage));
      setIsSolveStateLoading(false);
    }

    loadSolveState().catch(() => {
      if (!ignore) {
        setIsAuthenticated(false);
        setIsSolveStateLoading(false);
      }
    });

    return () => {
      ignore = true;
      closeEventSource();
      reset();
    };
  }, [closeEventSource, problem.id, reset]);

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

  const loadSavedCode = useCallback(
    async (nextLanguage: string) => {
      const requestId = languageRequestRef.current + 1;
      languageRequestRef.current = requestId;
      userEditedRef.current = false;
      const normalizedLanguage = normalizeLanguage(nextLanguage);
      setLanguage(normalizedLanguage);
      setCode(getDefaultCodeTemplate(normalizedLanguage));

      if (!isAuthenticated) return;

      setIsCodeLoading(true);

      try {
        const response = await fetch(
          `/api/problems/${problem.id}/saved-code?language=${encodeURIComponent(
            normalizedLanguage,
          )}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as SavedCodeResponse;

        if (
          requestId === languageRequestRef.current &&
          !userEditedRef.current
        ) {
          setCode(data.sourceCode || getDefaultCodeTemplate(normalizedLanguage));
        }
      } finally {
        if (requestId === languageRequestRef.current) {
          setIsCodeLoading(false);
        }
      }
    },
    [isAuthenticated, problem.id],
  );

  const handleCodeChange = (value: string | undefined) => {
    userEditedRef.current = true;
    setCode(value ?? "");
  };

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
          problemId: problem.id,
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "제출 중 오류가 발생했습니다.";
      setSubmitError(message);
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

  return (
    <div
      id="code-editor-section"
      className="flex-1 lg:w-1/2 flex flex-col gap-4 relative scroll-mt-20"
    >
      <div
        className={`flex flex-1 flex-col gap-4 ${
          shouldShowLoginModal ? "pointer-events-none select-none blur-sm" : ""
        }`}
      >
        <div
          className={`h-full flex flex-col relative rounded-xl border-2 ${editorBorderClass} lg:overflow-hidden`}
        >
          <button
            onClick={handleToggleEditorTheme}
            disabled={isCodeSectionLocked}
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors shadow-md backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="에디터 테마 변경"
          >
            {editorTheme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {editorReady ? (
            <CodeEditor
              readOnly={isCodeSectionLocked}
              value={code}
              onChange={(value) => {
                if (isCodeSectionLocked) return;
                handleCodeChange(value);
              }}
              language={language}
              theme={editorTheme || undefined}
              isLoading={isCodeLoading || isSolveStateLoading}
            />
          ) : (
            <EditorSkeleton />
          )}
        </div>

        <div className="flex flex-col gap-4 lg:relative sticky bottom-4 z-40">
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-center bg-white/95 dark:bg-zinc-900/95 p-4 rounded-xl border border-zinc-200 dark:border-white/10 backdrop-blur-xl shadow-2xl">
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
                onChange={(event) => void loadSavedCode(event.target.value)}
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
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
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

            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
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
  );
}
