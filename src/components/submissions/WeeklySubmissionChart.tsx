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
  isToday: boolean;
};

type Props = {
  data: WeeklyStat[];
};

export default function WeeklySubmissionChart({ data }: Props) {
  const { theme } = useTheme();
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">제출 통계 (주간)</h2>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
              dy={10}
            />
            
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            
            <Tooltip
              cursor={{ fill: isDark ? "#27272a" : "#F3F4F6" }}
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
            
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isToday ? barTodayColor : barOtherColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
