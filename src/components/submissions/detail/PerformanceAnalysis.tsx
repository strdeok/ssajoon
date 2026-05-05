"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Zap, Activity } from "lucide-react";

interface ComparisonRow {
  execution_time_ms: number | null;
  memory_kb: number | null;
}

interface PerformanceAnalysisProps {
  runtime: number | null;
  memory: number | null;
  comparisonRows: ComparisonRow[];
}

type MetricType = "runtime" | "memory";

type Bucket = {
  label: string;
  min: number;
  max: number;
  otherCount: number;
  chartCount: number;
  isMine: boolean;
};

function isValidNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function formatMetricValue(value: number, type: MetricType) {
  if (type === "runtime") return `${Math.round(value)}ms`;
  return `${Math.round(value).toLocaleString()}KB`;
}

function calculateTopPercent(myValue: number | null, values: number[]) {
  if (!isValidNumber(myValue) || values.length === 0) return null;

  const betterCount = values.filter((value) => value < myValue).length;
  const sameOrWorseTotal = values.length + 1;
  const rank = betterCount + 1;

  return Math.max(1, Math.round((rank / sameOrWorseTotal) * 100));
}

function calculateBetterThanPercent(myValue: number | null, values: number[]) {
  if (!isValidNumber(myValue) || values.length === 0) return null;

  const worseCount = values.filter((value) => value > myValue).length;

  return Math.round((worseCount / values.length) * 100);
}

function buildBuckets(
  myValue: number | null,
  values: number[],
  type: MetricType,
  bucketCount = 6,
) {
  if (!isValidNumber(myValue) || values.length === 0) return [];

  const allValues = [...values, myValue];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  if (minValue === maxValue) {
    return [
      {
        label: formatMetricValue(minValue, type),
        min: minValue,
        max: maxValue,
        otherCount: values.length,
        chartCount: values.length + 1,
        isMine: true,
      },
    ];
  }

  const range = maxValue - minValue;
  const bucketSize = Math.ceil(range / bucketCount) || 1;

  const buckets: Bucket[] = Array.from({ length: bucketCount }).map(
    (_, index) => {
      const min = minValue + index * bucketSize;
      const max = index === bucketCount - 1 ? maxValue : min + bucketSize - 1;

      return {
        label: `${formatMetricValue(min, type)}~${formatMetricValue(max, type)}`,
        min,
        max,
        otherCount: 0,
        chartCount: 0,
        isMine: myValue >= min && myValue <= max,
      };
    },
  );

  values.forEach((value) => {
    const bucket = buckets.find(
      (item) => value >= item.min && value <= item.max,
    );
    if (!bucket) return;
    bucket.otherCount += 1;
    bucket.chartCount += 1;
  });

  buckets.forEach((bucket) => {
    if (!bucket.isMine) return;
    bucket.chartCount += 1;
  });

  return buckets.sort((a, b) => b.min - a.min);
}

function PerformanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const bucket = payload[0].payload as Bucket;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-md dark:border-white/10 dark:bg-zinc-900">
      <p className="text-xs font-semibold text-zinc-800 dark:text-white">
        {bucket.label}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        다른 정답 제출 {bucket.otherCount}개
      </p>
      {bucket.isMine && (
        <p className="mt-1 text-xs font-semibold text-blue-600">내 기록 포함</p>
      )}
    </div>
  );
}

function PerformanceBarCard({
  title,
  description,
  icon,
  type,
  myValue,
  values,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: MetricType;
  myValue: number | null;
  values: number[];
}) {
  const buckets = buildBuckets(myValue, values, type);
  const topPercent = calculateTopPercent(myValue, values);
  const betterThanPercent = calculateBetterThanPercent(myValue, values);
  const hasEnoughData = buckets.length > 0 && values.length >= 3;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 p-6 shadow-lg w-full">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      {!isValidNumber(myValue) ? (
        <div className="h-48 flex items-center justify-center text-sm text-zinc-400">
          내 기록이 없어 비교할 수 없습니다.
        </div>
      ) : !hasEnoughData ? (
        <div className="h-48 flex items-center justify-center text-sm text-zinc-400 text-center leading-relaxed">
          같은 문제와 같은 언어의
          <br />
          다른 정답 제출 데이터가 부족합니다.
        </div>
      ) : (
        <div className="w-full min-w-0 overflow-visible">
          {" "}
          {/* 부모 높이 의존을 제거하고 너비만 보장한다. */}
          <ResponsiveContainer width="100%" height={224}>
            {" "}
            {/* 퍼센트 높이 대신 고정 숫자 높이를 사용해서 height 0 문제를 막는다. */}
            <BarChart
              data={buckets} // 차트에 표시할 구간 데이터를 전달한다.
              margin={{ top: 16, right: 12, left: 12, bottom: 40 }} // x축 라벨 공간을 확보한다.
              barCategoryGap="22%" // 막대 사이 간격을 확보한다.
            >
              <CartesianGrid
                strokeDasharray="3 3" // 점선 그리드를 사용한다.
                stroke="#888888" // 그리드 색상을 지정한다.
                vertical={false} // 세로 그리드는 숨긴다.
                opacity={0.12} // 그리드 투명도를 낮춘다.
              />
              <XAxis
                dataKey="label" // 구간 라벨을 x축에 표시한다.
                tick={{ fontSize: 10, fill: "#94a3b8" }} // x축 라벨 스타일을 지정한다.
                interval={0} // 모든 구간 라벨을 표시한다.
                angle={-12} // 라벨 기울기를 줄인다.
                textAnchor="end" // 기울어진 라벨의 기준점을 끝으로 둔다.
                height={56} // x축 라벨 공간을 확보한다.
                tickMargin={10} // 라벨과 축 사이 간격을 확보한다.
                minTickGap={0} // 라벨 간 최소 간격 제한을 제거한다.
              />
              <YAxis
                hide // y축 숫자는 숨긴다.
                allowDecimals={false} // 제출 수는 정수이므로 소수점을 허용하지 않는다.
                width={0} // 숨긴 y축이 공간을 차지하지 않게 한다.
              />
              <Tooltip content={<PerformanceTooltip />} />{" "}
              {/* 커스텀 툴팁을 사용한다. */}
              <Bar dataKey="chartCount" radius={[8, 8, 0, 0]} maxBarSize={36}>
                {" "}
                {/* 제출 수 막대를 렌더링한다. */}
                {buckets.map(
                  (
                    bucket, // 각 구간을 순회한다.
                  ) => (
                    <Cell
                      key={bucket.label} // 구간 라벨을 key로 사용한다.
                      fill={bucket.isMine ? "#2563eb" : "#cbd5e1"} // 내 기록 구간은 파란색, 나머지는 회색으로 표시한다.
                    />
                  ),
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-500">내 기록</span>
          <span className="text-xs font-mono text-zinc-500 font-bold">
            {isValidNumber(myValue) ? formatMetricValue(myValue, type) : "-"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-blue-600">
            {topPercent === null || !hasEnoughData
              ? "-"
              : `상위 ${topPercent}%`}
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {betterThanPercent === null || !hasEnoughData
            ? "비교 가능한 정답 제출 데이터가 더 필요합니다."
            : `다른 정답 제출 ${betterThanPercent}%보다 ${type === "runtime" ? "빠릅니다." : "메모리를 적게 사용했습니다."}`}
        </p>
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
    .filter((value): value is number => isValidNumber(value));

  const memoryValues = comparisonRows
    .map((row) => row.memory_kb)
    .filter((value): value is number => isValidNumber(value));

  return (
    <div className="flex flex-col gap-8">
      <PerformanceBarCard
        title="실행 시간 비교"
        description="같은 문제·같은 언어의 정답 제출과 비교"
        type="runtime"
        myValue={runtime}
        values={runtimeValues}
        icon={
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
        }
      />
      <PerformanceBarCard
        title="메모리 사용량 비교"
        description="같은 문제·같은 언어의 정답 제출과 비교"
        type="memory"
        myValue={memory}
        values={memoryValues}
        icon={
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
        }
      />
    </div>
  );
}
