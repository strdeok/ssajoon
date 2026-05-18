"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Database,
  Eye,
  X,
} from "lucide-react";

type SortType = "recent" | "memory" | "time";

type PeerSubmissionItem = {
  id: number;
  nickname: string;
  result: string | null;
  language: string | null;
  executionTimeMs: number | null;
  memoryKb: number | null;
  submittedAt: string | null;
};

type PeerSubmissionResponse = {
  items: PeerSubmissionItem[];
  page: number;
  pageSize: number;
  totalCount: number;
};

type PeerSubmissionsTableProps = {
  submissionId: number;
};

const sortLabels: Record<SortType, string> = {
  recent: "최근 제출순",
  memory: "메모리 적은 순",
  time: "시간 빠른 순",
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

function formatResult(result: string | null) {
  const normalized = (result ?? "").trim().toUpperCase();
  if (normalized === "AC" || normalized === "ACCEPTED") return "정답";
  return normalized || "-";
}

function PeerTableSkeleton() {
  return (
    <div className="divide-y divide-zinc-100 dark:divide-white/5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-7 gap-4 px-6 py-4">
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <div
              key={`${index}-${cellIndex}`}
              className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Metric({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string | number | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm text-zinc-700 dark:text-zinc-300">
      {icon}
      {value ?? "-"}
    </span>
  );
}

function PeerCodeModal({
  submission,
  sourceCode,
  isLoading,
  error,
  onClose,
}: {
  submission: PeerSubmissionItem;
  sourceCode: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="peer-code-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-white/10 sm:px-6">
          <div>
            <h3
              id="peer-code-title"
              className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white"
            >
              <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              다른 사람의 풀이 코드
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {submission.nickname}님의 정답 제출입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 border-b border-zinc-100 px-5 py-4 text-sm dark:border-white/10 sm:grid-cols-2 sm:px-6 lg:grid-cols-6">
          <div>
            <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              닉네임
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {submission.nickname}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              언어
            </span>
            <span className="text-zinc-800 dark:text-zinc-200">
              {submission.language ?? "-"}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              결과
            </span>
            <span className="text-emerald-700 dark:text-emerald-300">
              {formatResult(submission.result)}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              실행 시간
            </span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">
              {submission.executionTimeMs !== null
                ? `${submission.executionTimeMs}ms`
                : "-"}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              메모리
            </span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">
              {submission.memoryKb !== null ? `${submission.memoryKb}KB` : "-"}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              제출 시간
            </span>
            <span className="text-zinc-800 dark:text-zinc-200">
              {formatDateTime(submission.submittedAt)}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:text-zinc-400">
              코드를 불러오는 중입니다.
            </div>
          ) : error ? (
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-red-200 text-sm font-medium text-red-700 dark:border-red-500/20 dark:text-red-400">
              {error}
            </div>
          ) : sourceCode ? (
            <pre className="max-h-[60vh] min-h-80 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-5 text-sm leading-6 text-zinc-100 dark:border-white/10">
              <code>{sourceCode}</code>
            </pre>
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-zinc-200 text-sm font-medium text-zinc-500 dark:border-white/10 dark:text-zinc-400">
              코드를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PeerSubmissionsTable({
  submissionId,
}: PeerSubmissionsTableProps) {
  const [sort, setSort] = useState<SortType>("recent");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PeerSubmissionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<PeerSubmissionItem | null>(null);
  const [selectedSourceCode, setSelectedSourceCode] = useState<string | null>(
    null,
  );
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPeerSubmissions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/submissions/${submissionId}/peers?sort=${sort}&page=${page}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("다른 사람의 제출 내역을 불러오지 못했습니다.");
        }

        const json = (await response.json()) as PeerSubmissionResponse;
        if (!ignore) {
          setData(json);
        }
      } catch {
        if (!ignore) {
          setError("다른 사람의 제출 내역을 불러오지 못했습니다.");
          setData(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadPeerSubmissions();

    return () => {
      ignore = true;
    };
  }, [page, sort, submissionId]);

  const pageSize = data?.pageSize ?? 10;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [pageSize, totalCount],
  );
  const isPreviousDisabled = page <= 1 || isLoading;
  const isNextDisabled = page * pageSize >= totalCount || isLoading;

  const handleSortChange = (nextSort: SortType) => {
    setSort(nextSort);
    setPage(1);
  };

  const handleOpenCode = async (submission: PeerSubmissionItem) => {
    setSelectedSubmission(submission);
    setSelectedSourceCode(null);
    setCodeError(null);
    setIsCodeLoading(true);

    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/peers/${submission.id}/code`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("코드를 불러올 수 없습니다.");
      }

      const json = (await response.json()) as { sourceCode?: string | null };
      setSelectedSourceCode(json.sourceCode ?? "");
    } catch {
      setCodeError("코드를 불러올 수 없습니다.");
    } finally {
      setIsCodeLoading(false);
    }
  };

  const handleCloseCode = () => {
    setSelectedSubmission(null);
    setSelectedSourceCode(null);
    setCodeError(null);
    setIsCodeLoading(false);
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-white/5 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 border-b border-zinc-100 px-6 py-5 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              다른 사람의 풀이
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              같은 문제를 같은 언어로 정답 처리한 제출을 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist">
            {(Object.keys(sortLabels) as SortType[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSortChange(key)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  sort === key
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
                role="tab"
                aria-selected={sort === key}
              >
                {sortLabels[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/30">
              <tr className="border-b border-zinc-100 dark:border-white/5">
                {[
                  "닉네임",
                  "언어",
                  "결과",
                  "실행 시간",
                  "메모리",
                  "코드",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <PeerTableSkeleton />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm font-medium text-red-700 dark:text-red-400"
                  >
                    {error}
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    아직 같은 언어로 정답을 받은 다른 제출이 없습니다.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/70 dark:border-white/5 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.nickname}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {item.language ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {formatResult(item.result)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Metric
                        icon={
                          <Clock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                        }
                        value={
                          item.executionTimeMs !== null
                            ? `${item.executionTimeMs}ms`
                            : null
                        }
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Metric
                        icon={
                          <Database className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                        }
                        value={
                          item.memoryKb !== null ? `${item.memoryKb}KB` : null
                        }
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => void handleOpenCode(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <Eye className="h-4 w-4" />
                        코드 보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-100 px-6 py-4 text-sm text-zinc-700 dark:border-white/5 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
          <span>
            총 {totalCount}개 · {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={isPreviousDisabled}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={isNextDisabled}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {selectedSubmission && (
        <PeerCodeModal
          submission={selectedSubmission}
          sourceCode={selectedSourceCode}
          isLoading={isCodeLoading}
          error={codeError}
          onClose={handleCloseCode}
        />
      )}
    </>
  );
}
