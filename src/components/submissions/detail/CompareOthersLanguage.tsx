"use client";

import { Code2 } from "lucide-react";

type LanguageUsageRow = {
  user_id?: string | null;
  language: string | null;
};

type LanguageStat = {
  language: string;
  count: number;
  percentage: number;
  isMine: boolean;
};

interface CompareOthersLanguageProps {
  rows: LanguageUsageRow[];
  myLanguage?: string | null;
}

function normalizeLanguage(language: string | null | undefined) {
  return (language ?? "Unknown").trim().toLowerCase();
}

function formatLanguage(language: string) {
  const languageMap: Record<string, string> = {
    python: "Python",
    python3: "Python",
    javascript: "JavaScript",
    typescript: "TypeScript",
    java: "Java",
    cpp: "C++",
    "c++": "C++",
    c: "C",
    go: "Go",
    rust: "Rust",
    kotlin: "Kotlin",
    swift: "Swift",
    unknown: "알 수 없음",
  };

  return languageMap[language] ?? language.toUpperCase();
}

function buildLanguageStats(
  rows: LanguageUsageRow[],
  myLanguage?: string | null,
) {
  const myNormalizedLanguage = normalizeLanguage(myLanguage);

  const uniqueMap = new Map<string, string>();

  rows.forEach((row, index) => {
    const normalizedLanguage = normalizeLanguage(row.language);

    const uniqueKey = row.user_id
      ? `${row.user_id}:${normalizedLanguage}`
      : `${index}:${normalizedLanguage}`;

    uniqueMap.set(uniqueKey, normalizedLanguage);
  });

  const countMap = new Map<string, number>();

  Array.from(uniqueMap.values()).forEach((language) => {
    countMap.set(language, (countMap.get(language) ?? 0) + 1);
  });

  const totalCount = Array.from(countMap.values()).reduce(
    (sum, count) => sum + count,
    0,
  );

  return Array.from(countMap.entries())
    .map(([language, count]): LanguageStat => {
      const percentage =
        totalCount === 0 ? 0 : Math.round((count / totalCount) * 1000) / 10;

      return {
        language: formatLanguage(language),
        count,
        percentage,
        isMine: language === myNormalizedLanguage,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export default function CompareOthersLanguage({
  rows,
  myLanguage,
}: CompareOthersLanguageProps) {
  const languageStats = buildLanguageStats(rows, myLanguage);

  const totalCount = languageStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <section className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-white/5 dark:bg-zinc-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-violet-500/10 p-2">
          <Code2 className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            다른 사람들의 풀이 언어
          </h3>
          <p className="text-xs text-zinc-500">
            같은 문제의 정답 제출 기준
          </p>
        </div>
      </div>
      {languageStats.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-200 text-center text-sm text-zinc-400 dark:border-white/10">
          아직 비교 가능한 다른 정답 제출이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>비교 대상</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {totalCount.toLocaleString()}/건
            </span>
          </div>
          {languageStats.map(
            (
              stat,
            ) => (
              <div key={stat.language} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {stat.language}
                    </span>
                    {stat.isMine && (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-500/10">
                        내 언어
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-zinc-500">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {stat.percentage}%
                    </span>
                    <span className="ml-1">
                      ({stat.count.toLocaleString()})
                    </span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                  <div
                    className={
                      stat.isMine
                        ? "h-full rounded-full bg-blue-600"
                        : "h-full rounded-full bg-violet-400"
                    }
                    style={{ width: `${Math.max(stat.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
