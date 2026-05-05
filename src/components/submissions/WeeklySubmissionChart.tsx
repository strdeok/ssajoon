"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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

export type WeeklyStat = {
  date: string;
  count: number;
  isToday: boolean; // 오늘 날짜 여부 추가 (막대 색상 강조에 사용)
};

type Props = {
  data: WeeklyStat[];
};

export default function WeeklySubmissionChart({ data }: Props) {
  const { theme } = useTheme();
  // Recharts 컴포넌트는 클라이언트 사이드에서 마운트된 후 렌더링되어야 hydration 에러를 방지할 수 있습니다.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg text-gray-400">Loading chart...</div>;
  }

  const isDark = theme === "dark";
  const gridColor = isDark ? "#27272a" : "#E5E7EB";
  const axisColor = isDark ? "#71717a" : "#6B7280";
  const tooltipBg = isDark ? "#18181b" : "#FFFFFF";
  const tooltipBorder = isDark ? "#27272a" : "#E5E7EB";
  const barTodayColor = isDark ? "#3b82f6" : "#3B82F6";
  const barOtherColor = isDark ? "#1d4ed8" : "#93C5FD";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
      {/* 차트 상단 헤더 영역 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">제출 통계 (주간)</h2>
        {/* 상세 분석 보기 버튼 (추후 링크 연동 가능) */}
        <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          상세 분석 보기
        </button>
      </div>

      {/* BarChart 영역 */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: -20, // Y축 여백 줄이기
              bottom: 0,
            }}
          >
            {/* 배경 가로선(점선) 설정 */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            
            {/* X축 (날짜/요일) 설정 */}
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
              dy={10} // 텍스트를 약간 아래로 내림
            />
            
            {/* Y축 설정 */}
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            
            {/* 툴팁 설정 */}
            <Tooltip
              cursor={{ fill: isDark ? "#27272a" : "#F3F4F6" }} // 마우스 오버 시 막대 배경색
              contentStyle={{
                backgroundColor: tooltipBg,
                borderRadius: "8px",
                border: `1px solid ${tooltipBorder}`,
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                fontSize: "14px",
                color: isDark ? "#f4f4f5" : "#111827",
              }}
              itemStyle={{
                color: isDark ? "#3b82f6" : "#3B82F6",
              }}
            />
            
            {/* 실제 데이터를 나타내는 막대 */}
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {/* 오늘 날짜인 경우 진한 파란색, 아니면 연한 파란색을 동적으로 부여 */}
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isToday ? barTodayColor : barOtherColor} // isToday 플래그에 따라 파란색 계열 강조
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
