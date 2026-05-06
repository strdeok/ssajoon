"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { SubmissionCodeItem } from "@/components/submission/SubmissionCodeItem";

interface SubmissionSummary {
  id: string;
  language: string;
  status: string;
  result: string;
  execution_time_ms: number | null;
  memory_kb: number | null;
  submitted_at: string;
  failed_testcase_order?: number | null;
}

interface SubmissionHistoryPanelProps {
  problemId: number;
  userId: string;
  onAnyExpanded?: (expanded: boolean) => void;
}

export function SubmissionHistoryPanel({ problemId, userId, onAnyExpanded }: SubmissionHistoryPanelProps) {
  const [summaries, setSummaries] = useState<Record<string, SubmissionSummary[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openLanguage, setOpenLanguage] = useState<string | null>(null);
  const [openCodeItemId, setOpenCodeItemId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummaries() {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      try {
        const { data, error: fetchError } = await supabase
          .from("submissions")
          .select("id, language, status, result, execution_time_ms, memory_kb, submitted_at, failed_testcase_order")
          .eq("problem_id", problemId)
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .order("submitted_at", { ascending: false });

        if (fetchError) throw fetchError;

        const grouped = (data || []).reduce((acc, curr) => {
          const lang = curr.language || "unknown";
          if (!acc[lang]) acc[lang] = [];
          acc[lang].push(curr as SubmissionSummary);
          return acc;
        }, {} as Record<string, SubmissionSummary[]>);

        setSummaries(grouped);

        const langs = Object.keys(grouped);
        if (langs.length > 0) {
          setOpenLanguage(langs[0]);
          onAnyExpanded?.(true);
        }
      } catch (err: any) {
        setError("제출 내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummaries();
  }, [problemId, userId]);

  const toggleLanguage = (lang: string) => {
    const next = openLanguage === lang ? null : lang;
    setOpenLanguage(next);
    setOpenCodeItemId(null);
    onAnyExpanded?.(next !== null);
  };

  const handleCodeItemToggle = (id: string) => {
    const next = openCodeItemId === id ? null : id;
    setOpenCodeItemId(next);
    onAnyExpanded?.(openLanguage !== null || next !== null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">제출 내역을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const languageKeys = Object.keys(summaries);

  if (languageKeys.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-200 dark:border-white/5">
        <p className="text-zinc-500 dark:text-zinc-400">이 문제에 대한 제출 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {languageKeys.map(lang => (
        <div key={lang} className="bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-200 dark:border-white/5 overflow-hidden">
          <button
            onClick={() => toggleLanguage(lang)}
            className="w-full px-5 py-4 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase">{lang}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-xs font-bold">
                {summaries[lang].length}
              </span>
            </div>
            {openLanguage === lang ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </button>

          {openLanguage === lang && (
            <div className="p-4 border-t border-zinc-200 dark:border-white/5 space-y-3">
              {summaries[lang].map(sub => (
                <SubmissionCodeItem
                  key={sub.id}
                  submission={sub}
                  isOpen={openCodeItemId === sub.id}
                  onToggle={handleCodeItemToggle}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
