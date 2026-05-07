"use client";

import { Lightbulb } from "lucide-react";

interface ComparisonRow {
  execution_time_ms: number | null;
  memory_kb: number | null;
}

interface PerformanceAnalysisProps {
  runtime: number | null;
  memory: number | null;
  comparisonRows: ComparisonRow[];
}

function isValidNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function calculateAverage(values: number[]) {
  if (values.length === 0) return null;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function calculateTopPercent(myValue: number | null, values: number[]) {
  if (!isValidNumber(myValue) || values.length === 0) return null;

  const betterCount = values.filter((value) => value < myValue).length;
  const rank = betterCount + 1;
  const total = values.length;

  return Math.max(1, Math.min(100, Math.ceil((rank / total) * 100)));
}

function calculateBarFill(topPercent: number | null) {
  if (topPercent === null) return 0;

  return Math.max(6, 100 - topPercent);
}

function AnalysisRow({
  label,
  topPercent,
}: {
  label: string;
  topPercent: number | null;
}) {
  const fill = calculateBarFill(topPercent);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          {label}
        </span>

        <span className="text-sm font-semibold text-blue-600">
          {topPercent === null ? "-" : `상위 ${topPercent}%`}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}

export default function PerformanceAnalysis({
  runtime,
  memory,
  comparisonRows,
}: PerformanceAnalysisProps) {
  const runtimeValues = comparisonRows
    .map((row) => row.execution_time_ms)
    .filter(isValidNumber);

  const memoryValues = comparisonRows
    .map((row) => row.memory_kb)
    .filter(isValidNumber);

  const runtimeValuesWithMine = isValidNumber(runtime)
    ? [...runtimeValues, runtime]
    : runtimeValues;

  const memoryValuesWithMine = isValidNumber(memory)
    ? [...memoryValues, memory]
    : memoryValues;

  const averageRuntime = calculateAverage(runtimeValues);

  const runtimeTopPercent = calculateTopPercent(runtime, runtimeValuesWithMine);
  const memoryTopPercent = calculateTopPercent(memory, memoryValuesWithMine);

  const hasComparisonData = runtimeValuesWithMine.length > 0 || memoryValuesWithMine.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 dark:border-blue-500/10 dark:bg-blue-500/5">
        <div className="mb-3 flex justify-center">
          <Lightbulb className="h-6 w-6 text-zinc-500" />
        </div>

        {hasComparisonData ? (
          <div className="space-y-2 text-center">
            <p className="text-xl leading-relaxed text-zinc-800 dark:text-zinc-100">
              다른 사람들은 평균적으로{" "}
              <span className="font-bold">
                {averageRuntime === null ? "-" : `${averageRuntime}ms`}
              </span>
              의 실행 시간을 기록했습니다.
            </p>

            <p className="text-sm text-zinc-500">
              같은 문제 · 같은 언어의 정답 제출 기준이며, 내 제출을 포함해 계산합니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-center">
            <p className="text-lg text-zinc-700 dark:text-zinc-200">
              아직 비교 가능한 다른 정답 제출이 없습니다.
            </p>

            <p className="text-sm text-zinc-500">
              같은 문제 · 같은 언어의 정답 데이터가 쌓이면 비교해드릴게요.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900">
        <h3 className="mb-6 text-xl font-bold text-zinc-900 dark:text-white">
          성능 분석
        </h3>

        <div className="space-y-6">
          <AnalysisRow label="상위 % (시간)" topPercent={runtimeTopPercent} />

          <AnalysisRow label="상위 % (메모리)" topPercent={memoryTopPercent} />
        </div>
      </section>
    </div>
  );
}
