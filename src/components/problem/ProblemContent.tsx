"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  FileText,
  History,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Problem } from "@/types/problem";
import { getKoreanTag } from "@/utils/tagUtils";

import { CopyButton } from "@/components/problem/CopyButton";
import { EditorSkeleton } from "@/components/problem/EditorSkeleton";
import ServerProblemMarkdown from "./ServerProblemMarkdown";

const CodeEditor = dynamic(
  () => import("@/components/editor/CodeEditor").then((mod) => mod.CodeEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

export type PublicTestcase = {
  id: string;
  input_text: string;
  expected_output: string;
  testcase_order: number;
};

type ProblemContentProps = {
  problem: Problem;
  publicTestcases: PublicTestcase[];
  showAlgorithm?: boolean;
};

type ActiveSection = "description" | "my-submissions";
type CopyStatus = "idle" | "success" | "error";

type MySubmission = {
  id: number;
  language: string | null;
  result: string | null;
  status: string | null;
  executionTimeMs: number | null;
  memoryKb: number | null;
  submittedAt: string | null;
};

type MySubmissionsResponse = {
  items: MySubmission[];
};

type LanguageSubmissionGroup = {
  key: string;
  label: string;
  submissions: MySubmission[];
  totalCount: number;
  acceptedCount: number;
  latestSubmittedAt: string | null;
};

type CodeModalState = {
  submission: MySubmission;
  sourceCode: string | null;
  isLoading: boolean;
  error: string | null;
  copyStatus: CopyStatus;
  editorTheme: "light" | "dark";
};

function formatDateTime(dateString: string | null) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
}

function getLanguageKey(language: string | null) {
  const normalized = (language ?? "unknown").trim().toLowerCase();
  if (["py", "python", "python3", "Python3"].includes(normalized)) {
    return "python";
  }
  if (["java", "java17", "java 17"].includes(normalized)) return "java";
  if (["c++", "cpp", "cxx", "cpp17", "C++", "c++ 17"].includes(normalized)) {
    return "cpp";
  }
  if (["js", "javascript"].includes(normalized)) return "javascript";
  if (["ts", "typescript"].includes(normalized)) return "typescript";
  return normalized || "unknown";
}

function formatLanguage(language: string | null) {
  switch (getLanguageKey(language)) {
    case "python":
      return "Python";
    case "java":
      return "Java";
    case "cpp":
      return "C++";
    case "javascript":
      return "JavaScript";
    case "typescript":
      return "TypeScript";
    case "unknown":
      return "알 수 없음";
    default:
      return language || "-";
  }
}

function normalizeEditorLanguage(language: string | null) {
  switch (getLanguageKey(language)) {
    case "python":
      return "python";
    case "java":
      return "java";
    case "cpp":
      return "cpp";
    case "javascript":
      return "javascript";
    case "typescript":
      return "typescript";
    default:
      return "plaintext";
  }
}

function getCurrentEditorTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";

  const savedTheme = window.localStorage.getItem("editorTheme");
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
}

function getResultValue(result: string | null, status: string | null) {
  return (result || status || "").trim().toUpperCase();
}

function isAcceptedSubmission(submission: MySubmission) {
  const value = getResultValue(submission.result, submission.status);
  return value === "AC" || value === "ACCEPTED" || value === "SUCCESS";
}

function getResultBadge(result: string | null, status: string | null) {
  const value = getResultValue(result, status);

  if (value === "AC" || value === "ACCEPTED" || value === "SUCCESS") {
    return {
      text: "정답",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  if (value === "PENDING" || value === "QUEUED" || value === "RUNNING") {
    return {
      text: "채점 중",
      className:
        "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
    };
  }

  const labelMap: Record<string, string> = {
    WA: "오답",
    WRONG_ANSWER: "오답",
    CE: "컴파일 에러",
    COMPILE_ERROR: "컴파일 에러",
    COMPILATION_ERROR: "컴파일 에러",
    RE: "런타임 에러",
    RUNTIME_ERROR: "런타임 에러",
    TLE: "시간 초과",
    TIME_LIMIT_EXCEEDED: "시간 초과",
    MLE: "메모리 초과",
    MEMORY_LIMIT_EXCEEDED: "메모리 초과",
  };

  return {
    text: labelMap[value] ?? value ?? "-",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  };
}

function compareSubmittedAtDesc(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  return new Date(right ?? 0).getTime() - new Date(left ?? 0).getTime();
}

function groupSubmissionsByLanguage(submissions: MySubmission[]) {
  const groupMap = new Map<string, MySubmission[]>();

  submissions.forEach((submission) => {
    const languageKey = getLanguageKey(submission.language);
    const current = groupMap.get(languageKey) ?? [];
    current.push(submission);
    groupMap.set(languageKey, current);
  });

  return Array.from(groupMap.entries())
    .map(([key, groupSubmissions]) => {
      const sortedSubmissions = [...groupSubmissions].sort((left, right) =>
        compareSubmittedAtDesc(left.submittedAt, right.submittedAt),
      );

      return {
        key,
        label: formatLanguage(sortedSubmissions[0]?.language ?? key),
        submissions: sortedSubmissions,
        totalCount: sortedSubmissions.length,
        acceptedCount: sortedSubmissions.filter(isAcceptedSubmission).length,
        latestSubmittedAt: sortedSubmissions[0]?.submittedAt ?? null,
      } satisfies LanguageSubmissionGroup;
    })
    .sort((left, right) =>
      compareSubmittedAtDesc(left.latestSubmittedAt, right.latestSubmittedAt),
    );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-900">
      <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {icon}
        {value}
      </span>
    </div>
  );
}

function ProblemSection({
  tone,
  title,
  children,
}: {
  tone: "blue" | "purple" | "pink";
  title: string;
  children: ReactNode;
}) {
  const colorClass =
    tone === "blue"
      ? "text-blue-600 dark:text-blue-400 before:bg-blue-500"
      : tone === "purple"
        ? "text-purple-600 dark:text-purple-400 before:bg-purple-500"
        : "text-pink-600 dark:text-pink-400 before:bg-pink-500";

  return (
    <section>
      <h2
        className={`mb-4 flex items-center text-lg font-semibold before:mr-3 before:h-2 before:w-2 before:rounded-full ${colorClass}`}
      >
        {title}
      </h2>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 leading-relaxed text-zinc-700 dark:border-white/5 dark:bg-black/20 dark:text-zinc-300">
        {children}
      </div>
    </section>
  );
}

function CodeViewerModal({
  state,
  onClose,
  onCopy,
}: {
  state: CodeModalState;
  onClose: () => void;
  onCopy: () => void;
}) {
  const { submission, sourceCode, isLoading, error, copyStatus } = state;
  const resultBadge = getResultBadge(submission.result, submission.status);
  const canCopy = Boolean(sourceCode) && !isLoading && !error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-code-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:rounded-2xl">
        <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <h3
              id="my-code-modal-title"
              className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white"
            >
              <Code2 className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              소스코드 보기
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              내 제출 코드를 읽기 전용으로 확인합니다.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              disabled={!canCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              <Copy className="h-4 w-4" />
              {copyStatus === "success"
                ? "복사됨"
                : copyStatus === "error"
                  ? "복사 실패"
                  : "코드 복사"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
          <Metric label="언어" value={formatLanguage(submission.language)} />
          <Metric
            label="결과"
            value={
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${resultBadge.className}`}
              >
                {resultBadge.text}
              </span>
            }
          />
          <Metric
            label="실행 시간"
            value={
              submission.executionTimeMs !== null
                ? `${submission.executionTimeMs}ms`
                : "-"
            }
          />
          <Metric
            label="메모리"
            value={
              submission.memoryKb !== null ? `${submission.memoryKb}KB` : "-"
            }
          />
          <Metric
            label="제출 시간"
            value={formatDateTime(submission.submittedAt)}
          />
        </div>

        <div className="min-h-0 flex-1 p-5 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-96 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              코드를 불러오는 중입니다.
            </div>
          ) : error || !sourceCode ? (
            <div className="flex min-h-96 items-center justify-center rounded-xl border border-dashed border-zinc-200 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:text-zinc-400">
              코드를 불러오지 못했습니다.
            </div>
          ) : (
            <div className="h-[62vh] min-h-96">
              <CodeEditor
                value={sourceCode}
                onChange={() => {}}
                language={normalizeEditorLanguage(submission.language)}
                theme={state.editorTheme}
                readOnly={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProblemContent({
  problem,
  publicTestcases,
  showAlgorithm = true,
}: ProblemContentProps) {
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("description");
  const [isAlgorithmRevealed, setIsAlgorithmRevealed] = useState(showAlgorithm);
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [hasLoadedSubmissions, setHasLoadedSubmissions] = useState(false);
  const [openLanguageKeys, setOpenLanguageKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [codeModal, setCodeModal] = useState<CodeModalState | null>(null);
  const codeCacheRef = useRef<Map<number, string>>(new Map());
  const codeRequestIdRef = useRef(0);
  const copyResetTimerRef = useRef<number | null>(null);

  const groupedSubmissions = useMemo(
    () => groupSubmissionsByLanguage(mySubmissions),
    [mySubmissions],
  );

  const loadMySubmissions = useCallback(
    async (force = false) => {
      if (!force && (isSubmissionsLoading || hasLoadedSubmissions)) return;

      setIsSubmissionsLoading(true);
      setSubmissionsError(null);

      try {
        const response = await fetch(
          `/api/problems/${problem.id}/my-submissions`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch my submissions");
        }

        const data = (await response.json()) as MySubmissionsResponse;
        const sortedItems = [...(data.items ?? [])].sort((left, right) =>
          compareSubmittedAtDesc(left.submittedAt, right.submittedAt),
        );
        const nextGroups = groupSubmissionsByLanguage(sortedItems);

        setMySubmissions(sortedItems);
        setHasLoadedSubmissions(true);
        setOpenLanguageKeys(
          nextGroups[0] ? new Set([nextGroups[0].key]) : new Set(),
        );
      } catch {
        setSubmissionsError("제출 내역을 불러오지 못했습니다.");
      } finally {
        setIsSubmissionsLoading(false);
      }
    },
    [hasLoadedSubmissions, isSubmissionsLoading, problem.id],
  );

  useEffect(() => {
    if (activeSection === "my-submissions") {
      void loadMySubmissions();
    }
  }, [activeSection, loadMySubmissions]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const tabButtonClass = (section: ActiveSection) =>
    `relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      activeSection === section
        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
    }`;

  const toggleLanguageGroup = (languageKey: string) => {
    setOpenLanguageKeys((current) => {
      const next = new Set(current);
      if (next.has(languageKey)) {
        next.delete(languageKey);
      } else {
        next.add(languageKey);
      }
      return next;
    });
  };

  const handleOpenCode = async (submission: MySubmission) => {
    const cachedSourceCode = codeCacheRef.current.get(submission.id);

    setCodeModal({
      submission,
      sourceCode: cachedSourceCode ?? null,
      isLoading: cachedSourceCode === undefined,
      error: null,
      copyStatus: "idle",
      editorTheme: getCurrentEditorTheme(),
    });

    if (cachedSourceCode !== undefined) return;

    const requestId = codeRequestIdRef.current + 1;
    codeRequestIdRef.current = requestId;

    try {
      const response = await fetch(`/api/submissions/${submission.id}/code`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch source code");
      }

      const data = (await response.json()) as {
        source_code?: string | null;
      };
      const sourceCode = data.source_code ?? "";
      codeCacheRef.current.set(submission.id, sourceCode);

      if (codeRequestIdRef.current === requestId) {
        setCodeModal((current) =>
          current?.submission.id === submission.id
            ? { ...current, sourceCode, isLoading: false, error: null }
            : current,
        );
      }
    } catch {
      if (codeRequestIdRef.current === requestId) {
        setCodeModal((current) =>
          current?.submission.id === submission.id
            ? {
                ...current,
                sourceCode: null,
                isLoading: false,
                error: "코드를 불러오지 못했습니다.",
              }
            : current,
        );
      }
    }
  };

  const handleCloseCode = () => {
    codeRequestIdRef.current += 1;
    setCodeModal(null);
  };

  const handleCopyCode = async () => {
    if (!codeModal?.sourceCode || codeModal.isLoading) return;

    try {
      await navigator.clipboard.writeText(codeModal.sourceCode);
      setCodeModal((current) =>
        current ? { ...current, copyStatus: "success" } : current,
      );
    } catch {
      setCodeModal((current) =>
        current ? { ...current, copyStatus: "error" } : current,
      );
    }

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCodeModal((current) =>
        current ? { ...current, copyStatus: "idle" } : current,
      );
    }, 1500);
  };

  const convertTimeMs = (msTime: number) => {
    const converted = msTime / 1000;
    return converted;
  };

  const shouldShowAlgorithm = showAlgorithm || isAlgorithmRevealed;

  return (
    <div className="flex h-auto flex-col rounded-xl bg-white dark:bg-zinc-900/50 lg:h-full lg:overflow-hidden">
      <div className="sticky top-0 z-10 shrink-0 border-b border-zinc-200 bg-white/95 dark:border-white/10 dark:bg-zinc-900/95">
        <div className="flex flex-wrap items-center gap-4 p-8 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            <span className="mr-2">#{problem.id}</span>
            {problem.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {shouldShowAlgorithm ? (
              <>
                <span className="cursor-default rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {getKoreanTag(problem.tag1)}
                </span>
                {problem.tag2 && (
                  <span className="cursor-default rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {getKoreanTag(problem.tag2)}
                  </span>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsAlgorithmRevealed(true)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                알고리즘 보기
              </button>
            )}
            {problem.difficulty && (
              <span className="cursor-default rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                {problem.difficulty}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-8 pb-4">
          <button
            type="button"
            onClick={() => setActiveSection("description")}
            className={tabButtonClass("description")}
          >
            <FileText className="h-4 w-4" />
            문제 설명
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("my-submissions")}
            className={tabButtonClass("my-submissions")}
          >
            <History className="h-4 w-4" />내 제출 내역
          </button>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
        {activeSection === "description" ? (
          <div className="space-y-10 p-8">
            {(problem.time_limit_ms != null ||
              problem.memory_limit_mb != null) && (
              <section className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-white/5 dark:bg-black/20">
                <h2 className="mr-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  제한사항
                </h2>
                <div className="flex flex-row gap-4">
                  {problem.time_limit_ms != null && (
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
                      <Clock className="h-4 w-4 text-blue-500" />
                      시간 제한: {convertTimeMs(problem.time_limit_ms)}초
                    </div>
                  )}
                  {problem.memory_limit_mb != null && (
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
                      <Cpu className="h-4 w-4 text-purple-500" />
                      메모리 제한: {problem.memory_limit_mb}MB
                    </div>
                  )}
                </div>
              </section>
            )}

            {problem.description && (
              <ProblemSection tone="blue" title="문제 설명">
                <ServerProblemMarkdown content={problem.description} />
              </ProblemSection>
            )}

            {problem.input_description && (
              <ProblemSection tone="purple" title="입력 설명">
                <ServerProblemMarkdown content={problem.input_description} />
              </ProblemSection>
            )}

            {problem.output_description && (
              <ProblemSection tone="pink" title="출력 설명">
                <ServerProblemMarkdown content={problem.output_description} />
              </ProblemSection>
            )}

            {publicTestcases.length > 0 && (
              <section className="space-y-6">
                {publicTestcases.map((testcase, index) => (
                  <div
                    key={testcase.id}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  >
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        입력 {index + 1}
                      </h3>
                      <div className="group relative">
                        <div className="custom-scrollbar min-h-20 max-h-75 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-700 dark:border-white/5 dark:bg-black/20 dark:text-zinc-300">
                          {testcase.input_text || "입력값이 없습니다."}
                        </div>
                        <CopyButton text={testcase.input_text} />
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        출력 {index + 1}
                      </h3>
                      <div className="group relative">
                        <div className="custom-scrollbar min-h-20 max-h-75 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-700 dark:border-white/5 dark:bg-black/20 dark:text-zinc-300">
                          {testcase.expected_output ||
                            "기대 출력값이 없습니다."}
                        </div>
                        <CopyButton text={testcase.expected_output} />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        ) : (
          <div className="p-8">
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950">
              <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    내 제출 내역
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    이 문제에 제출한 내 기록만 언어별로 모아 보여줍니다.
                  </p>
                </div>
              </div>

              <div className="p-5">
                {isSubmissionsLoading ? (
                  <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/3 dark:text-zinc-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    제출 내역을 불러오는 중입니다.
                  </div>
                ) : submissionsError ? (
                  <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/3 dark:text-zinc-400">
                    제출 내역을 불러오지 못했습니다.
                  </div>
                ) : groupedSubmissions.length === 0 ? (
                  <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/3 dark:text-zinc-400">
                    아직 제출한 내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupedSubmissions.map((group) => {
                      const isOpen = openLanguageKeys.has(group.key);

                      return (
                        <section
                          key={group.key}
                          className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950"
                        >
                          <button
                            type="button"
                            onClick={() => toggleLanguageGroup(group.key)}
                            className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-white/3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4 text-zinc-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-zinc-500" />
                              )}
                              <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white">
                                  {group.label}
                                </h3>
                                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                  최근 제출{" "}
                                  {formatDateTime(group.latestSubmittedAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
                                제출 {group.totalCount}개
                              </span>
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                정답 {group.acceptedCount}개
                              </span>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="border-t border-zinc-200 dark:border-white/10">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                  <thead className="bg-zinc-50 dark:bg-white/3">
                                    <tr className="border-b border-zinc-200 dark:border-white/10">
                                      {[
                                        "결과",
                                        "실행 시간",
                                        "메모리",
                                        "제출 시간",
                                        "코드 보기",
                                      ].map((header) => (
                                        <th
                                          key={header}
                                          className="px-8 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                        >
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                    {group.submissions.map((submission) => {
                                      const resultBadge = getResultBadge(
                                        submission.result,
                                        submission.status,
                                      );

                                      return (
                                        <tr
                                          key={submission.id}
                                          className="hover:bg-zinc-50/80 dark:hover:bg-white/3"
                                        >
                                          <td className="px-6 py-3">
                                            <span
                                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${resultBadge.className}`}
                                            >
                                              {resultBadge.text}
                                            </span>
                                          </td>
                                          <td className="px-8 py-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                                            {submission.executionTimeMs !== null
                                              ? `${submission.executionTimeMs}ms`
                                              : "-"}
                                          </td>
                                          <td className="px-8 py-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                                            {submission.memoryKb !== null
                                              ? `${submission.memoryKb}KB`
                                              : "-"}
                                          </td>
                                          <td className="px-8 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatDateTime(
                                              submission.submittedAt,
                                            )}
                                          </td>
                                          <td className="px-8 py-3">
                                            <div className="flex flex-wrap gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  void handleOpenCode(
                                                    submission,
                                                  )
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                                              >
                                                <Code2 className="h-4 w-4" />
                                                소스코드 보기
                                              </button>
                                              <Link
                                                href={`/submissions/${submission.id}`}
                                                prefetch={false}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                                              >
                                                <ExternalLink className="h-4 w-4" />
                                                상세 보기
                                              </Link>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {codeModal && (
        <CodeViewerModal
          state={codeModal}
          onClose={handleCloseCode}
          onCopy={() => void handleCopyCode()}
        />
      )}
    </div>
  );
}
