"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Code2,
  Cpu,
  ExternalLink,
  FileText,
  History,
  Loader2,
} from "lucide-react";
import type { Problem } from "@/types/problem";
import { getKoreanTag } from "@/utils/tagUtils";
import { ServerProblemMarkdown } from "@/components/problem/ServerProblemMarkdown";
import { CopyButton } from "@/components/problem/CopyButton";
import { createClient } from "@/utils/supabase/client";

export type PublicTestcase = {
  id: string;
  input_text: string;
  expected_output: string;
  testcase_order: number;
};

type ProblemContentProps = {
  problem: Problem;
  publicTestcases: PublicTestcase[];
};

type ActiveSection = "description" | "my-submissions";

type MySubmission = {
  id: string;
  language: string | null;
  status: string | null;
  result: string | null;
  execution_time_ms: number | null;
  memory_kb: number | null;
  submitted_at: string | null;
};

function formatDateTime(dateString: string | null) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatLanguage(language: string | null) {
  switch ((language ?? "").toLowerCase()) {
    case "python":
      return "Python 3.11";
    case "java":
      return "Java 17";
    case "cpp":
      return "C++ 17";
    default:
      return language || "-";
  }
}

function formatResult(result: string | null, status: string | null) {
  const value = (result || status || "").trim().toUpperCase();

  switch (value) {
    case "AC":
    case "ACCEPTED":
    case "SUCCESS":
      return {
        text: "정답",
        className: "text-emerald-600 dark:text-emerald-400",
      };
    case "PENDING":
    case "QUEUED":
    case "RUNNING":
      return { text: "채점 중", className: "text-blue-600 dark:text-blue-400" };
    case "WA":
    case "WRONG_ANSWER":
      return { text: "오답", className: "text-red-600 dark:text-red-400" };
    case "CE":
    case "COMPILE_ERROR":
    case "COMPILATION_ERROR":
      return {
        text: "컴파일 에러",
        className: "text-amber-600 dark:text-amber-400",
      };
    case "RE":
    case "RUNTIME_ERROR":
      return {
        text: "런타임 에러",
        className: "text-orange-600 dark:text-orange-400",
      };
    case "TLE":
    case "TIME_LIMIT_EXCEEDED":
      return {
        text: "시간 초과",
        className: "text-orange-600 dark:text-orange-400",
      };
    case "MLE":
    case "MEMORY_LIMIT_EXCEEDED":
      return {
        text: "메모리 초과",
        className: "text-purple-600 dark:text-purple-400",
      };
    default:
      return {
        text: value || "-",
        className: "text-zinc-600 dark:text-zinc-300",
      };
  }
}

export function ProblemContent({
  problem,
  publicTestcases,
}: ProblemContentProps) {
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("description");
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [hasLoadedSubmissions, setHasLoadedSubmissions] = useState(false);
  const [openCodeSubmissionId, setOpenCodeSubmissionId] = useState<
    string | null
  >(null);
  const [openSourceCode, setOpenSourceCode] = useState<string | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const codeCacheRef = useRef<Map<string, string>>(new Map());
  const codeRequestIdRef = useRef(0);

  useEffect(() => {
    if (activeSection !== "my-submissions" || hasLoadedSubmissions) return;

    let ignore = false;

    async function loadMySubmissions() {
      setIsSubmissionsLoading(true);
      setSubmissionsError(null);

      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          if (!ignore) {
            setMySubmissions([]);
            setHasLoadedSubmissions(true);
          }
          return;
        }

        const { data, error } = await supabase
          .from("submissions")
          .select(
            "id, language, status, result, execution_time_ms, memory_kb, submitted_at",
          )
          .eq("problem_id", problem.id)
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .order("submitted_at", { ascending: false });

        if (error) throw error;

        if (!ignore) {
          setMySubmissions((data ?? []) as MySubmission[]);
          setHasLoadedSubmissions(true);
        }
      } catch {
        if (!ignore) {
          setSubmissionsError("제출 내역을 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setIsSubmissionsLoading(false);
        }
      }
    }

    void loadMySubmissions();

    return () => {
      ignore = true;
    };
  }, [activeSection, hasLoadedSubmissions, problem.id]);

  const tabButtonClass = (section: ActiveSection) =>
    `pb-4 text-sm font-medium transition-colors relative flex items-center space-x-2 cursor-pointer ${
      activeSection === section
        ? "text-blue-600 dark:text-blue-400"
        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
    }`;

  const handleToggleSubmissionCode = async (submissionId: string) => {
    if (openCodeSubmissionId === submissionId) {
      codeRequestIdRef.current += 1;
      setOpenCodeSubmissionId(null);
      setOpenSourceCode(null);
      setCodeError(null);
      setIsCodeLoading(false);
      return;
    }

    setOpenCodeSubmissionId(submissionId);
    setCodeError(null);

    const cachedCode = codeCacheRef.current.get(submissionId);
    if (cachedCode !== undefined) {
      setOpenSourceCode(cachedCode);
      setIsCodeLoading(false);
      return;
    }

    const requestId = codeRequestIdRef.current + 1;
    codeRequestIdRef.current = requestId;
    setOpenSourceCode(null);
    setIsCodeLoading(true);

    try {
      const response = await fetch(`/api/submissions/${submissionId}/code`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch submission code");
      }

      const data = (await response.json()) as {
        source_code?: string | null;
      };
      const sourceCode = data.source_code ?? "";
      codeCacheRef.current.set(submissionId, sourceCode);

      if (codeRequestIdRef.current === requestId) {
        setOpenSourceCode(sourceCode);
      }
    } catch {
      if (codeRequestIdRef.current === requestId) {
        setCodeError("코드를 불러오지 못했습니다.");
      }
    } finally {
      if (codeRequestIdRef.current === requestId) {
        setIsCodeLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col lg:h-full h-auto bg-white dark:bg-zinc-900/50 rounded-xl lg:overflow-hidden">
      <div className="flex-shrink-0 border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/80 sticky top-0 backdrop-blur-md z-10">
        <div className="p-8 pb-4 flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            <span className="mr-2">#{problem.id}</span>
            {problem.title}
          </h1>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-default">
              {getKoreanTag(problem.tag1)}
            </span>
            {problem.tag2 && (
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-default">
                {getKoreanTag(problem.tag2)}
              </span>
            )}
            {problem.difficulty && (
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm cursor-default">
                {problem.difficulty}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap px-8 gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={() => setActiveSection("description")}
            className={tabButtonClass("description")}
          >
            <FileText className="w-4 h-4" />
            <span>문제 설명</span>
            {activeSection === "description" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("my-submissions")}
            className={tabButtonClass("my-submissions")}
          >
            <History className="w-4 h-4" />
            <span>내 제출 내역</span>
            {activeSection === "my-submissions" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {activeSection === "description" ? (
          <div className="p-8 space-y-10">
            {(problem.time_limit_ms != null ||
              problem.memory_limit_mb != null) && (
              <section className="flex flex-wrap gap-6 items-center bg-zinc-50 dark:bg-black/20 p-5 rounded-xl border border-zinc-200 dark:border-white/5">
                <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mr-2">
                  제한사항
                </h2>
                {problem.time_limit_ms != null && (
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium text-sm bg-white dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <Clock className="w-4 h-4 text-blue-500" />
                    시간 제한: {problem.time_limit_ms}ms
                  </div>
                )}
                {problem.memory_limit_mb != null && (
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium text-sm bg-white dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <Cpu className="w-4 h-4 text-purple-500" />
                    메모리 제한: {problem.memory_limit_mb}MB
                  </div>
                )}
              </section>
            )}

            {problem.description && (
              <section>
                <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                  문제 설명
                </h2>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                  <ServerProblemMarkdown content={problem.description} />
                </div>
              </section>
            )}

            {problem.input_description && (
              <section>
                <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
                  입력 설명
                </h2>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                  <ServerProblemMarkdown content={problem.input_description} />
                </div>
              </section>
            )}

            {problem.output_description && (
              <section>
                <h2 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-pink-500 mr-3" />
                  출력 설명
                </h2>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                  <ServerProblemMarkdown content={problem.output_description} />
                </div>
              </section>
            )}

            {publicTestcases.length > 0 && (
              <section className="space-y-6">
                {publicTestcases.map((testcase, index) => (
                  <div
                    key={testcase.id}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        입력 {index + 1}
                      </h3>
                      <div className="relative group">
                        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm min-h-[80px] max-h-[300px] overflow-y-auto custom-scrollbar">
                          {testcase.input_text || "입력값이 없습니다."}
                        </div>
                        <CopyButton text={testcase.input_text} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        출력 {index + 1}
                      </h3>
                      <div className="relative group">
                        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm min-h-[80px] max-h-[300px] overflow-y-auto custom-scrollbar">
                          {testcase.expected_output || "기대 출력값이 없습니다."}
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
            {isSubmissionsLoading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-black/20 dark:text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                제출 내역을 불러오는 중입니다.
              </div>
            ) : submissionsError ? (
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                제출 내역을 불러오지 못했습니다.
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-black/20 dark:text-zinc-400">
                아직 제출한 내역이 없습니다.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                      <tr className="border-b border-zinc-200 dark:border-white/10">
                        {[
                          "제출 시간",
                          "언어",
                          "결과",
                          "실행 시간",
                          "메모리",
                          "상세",
                        ].map((header) => (
                          <th
                            key={header}
                            className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                      {mySubmissions.map((submission) => {
                        const resultInfo = formatResult(
                          submission.result,
                          submission.status,
                        );

                        const isCodeOpen =
                          openCodeSubmissionId === submission.id;

                        return (
                          <tr
                            key={submission.id}
                            className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                          >
                            <td className="px-5 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                              {formatDateTime(submission.submitted_at)}
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                              {formatLanguage(submission.language)}
                            </td>
                            <td className="px-5 py-4 text-sm font-bold">
                              <span className={resultInfo.className}>
                                {resultInfo.text}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                              {submission.execution_time_ms !== null
                                ? `${submission.execution_time_ms}ms`
                                : "-"}
                            </td>
                            <td className="px-5 py-4 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                              {submission.memory_kb !== null
                                ? `${submission.memory_kb}KB`
                                : "-"}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleToggleSubmissionCode(
                                      submission.id,
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                >
                                  <Code2 className="h-4 w-4" />
                                  {isCodeOpen ? "코드 닫기" : "코드 보기"}
                                </button>
                              <Link
                                href={`/submissions/${submission.id}`}
                                prefetch={false}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                <ExternalLink className="h-4 w-4" />
                                상세 보기
                              </Link>
                              </div>
                              {isCodeOpen && (
                                <div className="mt-3 min-w-[360px]">
                                  {isCodeLoading ? (
                                    <div className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                      코드를 불러오는 중입니다.
                                    </div>
                                  ) : codeError ? (
                                    <div className="flex min-h-24 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                                      코드를 불러오지 못했습니다.
                                    </div>
                                  ) : openSourceCode ? (
                                    <pre className="max-h-[360px] overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-sm leading-6 text-zinc-100 dark:border-white/10">
                                      <code className="block min-w-max whitespace-pre font-mono">
                                        {openSourceCode}
                                      </code>
                                    </pre>
                                  ) : (
                                    <div className="flex min-h-24 items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                                      코드를 불러오지 못했습니다.
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
