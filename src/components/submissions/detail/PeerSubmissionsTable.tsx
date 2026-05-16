"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Database } from "lucide-react";

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
        <div
          key={index}
          className="grid grid-cols-5 gap-4 px-6 py-4"
        >
          <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        </div>
      ))}
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

  useEffect(() => {
    let ignore = false;

    async function loadPeerSubmissions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/submissions/${submissionId}/peer-submissions?sort=${sort}&page=${page}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("비교 제출을 불러오지 못했습니다.");
        }

        const json = (await response.json()) as PeerSubmissionResponse;
        if (!ignore) {
          setData(json);
        }
      } catch (caughtError) {
        if (!ignore) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "비교 제출을 불러오지 못했습니다.",
          );
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

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  }, [data]);

  const handleSortChange = (nextSort: SortType) => {
    setSort(nextSort);
    setPage(1);
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-xl">
      <div className="flex flex-col gap-4 border-b border-zinc-100 dark:border-white/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            같은 언어 풀이 비교
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            같은 문제를 같은 언어로 맞힌 다른 제출과 비교합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(sortLabels) as SortType[]).map((key) => (
            <button
              key={key}
              onClick={() => handleSortChange(key)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                sort === key
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {sortLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-zinc-50/80 dark:bg-zinc-800/30">
            <tr className="border-b border-zinc-100 dark:border-white/5">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                제출자
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                결과
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                실행 시간
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                메모리
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                제출 시각
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5}>
                  <PeerTableSkeleton />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm font-medium text-red-700 dark:text-red-400"
                >
                  {error}
                </td>
              </tr>
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-14 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400"
                >
                  아직 비교 가능한 다른 정답 제출이 없습니다.
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
                  <td className="px-6 py-4">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {formatResult(item.result)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-zinc-700 dark:text-zinc-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                      {item.executionTimeMs !== null
                        ? `${item.executionTimeMs}ms`
                        : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-zinc-700 dark:text-zinc-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                      {item.memoryKb !== null ? `${item.memoryKb}KB` : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                    {formatDateTime(item.submittedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 text-sm text-zinc-700 dark:border-white/5 dark:text-zinc-300">
        <span>
          총 {data?.totalCount ?? 0}개 · {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
          <button
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
