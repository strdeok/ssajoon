"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Brain,
  Trophy,
  ChevronRight,
  Lock,
  Copy,
  Lightbulb,
} from "lucide-react";
import { getKoreanTag, DIFFICULTY_ORDER } from "@/utils/tagUtils";
import ProblemMarkdown from "@/components/common/ProblemMarkdown";

interface OptionItem {
  tag1: string;
  tag2: string | null;
  difficulty: string;
  count: number;
}

interface GeneratedProblem {
  id: number;
  title: string;
  description: string;
  input_description: string;
  output_description: string;
  tag1: string;
  tag2?: string | null;
  difficulty: string;
  time_limit_ms: number;
  memory_limit_mb: number;
}

interface ProblemExample {
  input_text: string;
  output_text: string;
}

const DAILY_PROBLEM_CREATE_LIMIT = 3;

const MIN_GENERATE_LOADING_MS = 30_000;

const LOADING_TIP_INTERVAL_MS = 5_000;

const LOADING_TIPS = [
  "문제를 생성합니다...",
  "숨겨진 문제 풀에서 조건에 맞는 문제를 찾고 있습니다...",
  "입력 크기는 알고리즘 선택의 가장 중요한 힌트입니다.",
  "시간 복잡도는 감이 아니라 입력 제한으로 결정하는 게 안전합니다.",
  "완전 탐색이 가능한지 먼저 보고, 안 되면 가지치기나 DP를 고민해보세요.",
  "정렬이 필요한 문제는 보통 순서나 최소/최대 선택이 핵심입니다.",
  "그리디 문제는 매 순간의 선택이 전체 최적해로 이어지는지 증명해야 합니다.",
  "이분 탐색은 정렬된 배열뿐 아니라 정답의 범위에도 사용할 수 있습니다.",
  "투 포인터는 연속 구간, 정렬 배열, 부분합 문제에서 자주 등장합니다.",
  "DFS는 깊게 탐색하고, BFS는 가까운 거리부터 탐색합니다.",
  "최단 거리 문제에서 가중치가 없다면 BFS를 먼저 의심하세요.",
  "가중치가 있는 최단 거리는 다익스트라를 떠올려보세요.",
  "스택은 최근에 들어온 것을 먼저 처리해야 할 때 유용합니다.",
  "큐는 BFS처럼 먼저 들어온 것을 먼저 처리해야 할 때 사용합니다.",
  "해시맵은 값을 빠르게 찾거나 빈도를 셀 때 강력합니다.",
  "우선순위 큐는 매번 최솟값이나 최댓값을 빠르게 꺼낼 때 사용합니다.",
  "배열 인덱스를 잘 설계하면 복잡한 조건도 단순해질 수 있습니다.",
  "방문 체크 배열은 그래프 탐색에서 중복 탐색을 막는 핵심 장치입니다.",
  "누적합은 구간 합을 반복해서 구해야 할 때 시간을 크게 줄여줍니다.",
  "Union-Find는 그룹 연결 여부를 빠르게 판단할 때 사용합니다.",
  "트리는 사이클이 없는 연결 그래프라는 점을 먼저 기억하세요.",
  "그래프 문제는 먼저 노드, 간선, 방향성, 가중치 여부를 정리하세요.",
  "예제만 맞았다고 끝내지 말고, 최소 입력과 최대 입력도 생각해보세요.",
  "반례를 직접 만들어보는 습관이 실력을 빠르게 올립니다.",
  "틀렸다면 코드를 바로 고치기보다, 가정이 틀렸는지 먼저 확인하세요.",
  "문제 조건에서 항상, 최대, 최소 같은 단어를 주의 깊게 보세요.",
  "입력 형식을 잘못 이해하면 알고리즘이 맞아도 오답이 납니다.",
  "출력 형식의 공백과 줄바꿈도 채점 결과에 영향을 줄 수 있습니다.",
  "변수명은 짧아도 되지만, 의미가 흐려지면 디버깅 시간이 늘어납니다.",
  "복잡한 문제는 먼저 손으로 작은 케이스를 직접 풀어보세요.",
  "시간 초과가 나면 반복문 중첩과 불필요한 탐색부터 의심하세요.",
  "메모리 초과가 나면 큰 배열, 중복 저장, 재귀 깊이를 먼저 확인하세요.",
  "DP는 같은 계산을 반복하고 있는지 확인하는 데서 시작합니다.",
  "DP 점화식은 현재 상태를 이전 상태로 설명할 수 있어야 합니다.",
  "그리디는 선택 기준이 명확하고, 그 선택을 되돌릴 필요가 없어야 합니다.",
  "DFS는 모든 경우를 탐색할 때 좋지만, 깊이가 크면 재귀 제한을 조심해야 합니다.",
  "BFS는 최단 거리와 레벨 단위 탐색에 강합니다.",
  "이분 탐색은 조건이 false에서 true 또는 true에서 false로 단조롭게 바뀔 때 사용할 수 있습니다.",
  "정렬 후에는 인접한 원소 사이의 관계가 중요한 힌트가 되는 경우가 많습니다.",
  "백트래킹은 완전 탐색에서 불가능한 가지를 빠르게 버리는 전략입니다.",
  "슬라이딩 윈도우는 고정 길이 또는 조건을 만족하는 연속 구간 문제에 자주 쓰입니다.",
  "다익스트라는 음수 간선이 없는 그래프에서 최단 거리를 구할 때 사용합니다.",
  "입력 제한에 맞는 알고리즘을 고르는 중입니다...",
  "난이도와 카테고리에 맞는 문제를 선별하고 있습니다...",
  "문제 설명과 예제를 불러오는 중입니다...",
  "선택한 알고리즘 유형에 맞는 문제를 확인하고 있습니다.",
  "문제의 입력 형식과 출력 형식을 정리하는 중입니다.",
  "채점 가능한 예제를 함께 준비하고 있습니다.",
  "곧 풀어볼 수 있는 문제가 준비됩니다.",
];

function getRandomTipIndex(previousIndex?: number) {
  if (LOADING_TIPS.length <= 1) return 0;

  let nextIndex = Math.floor(Math.random() * LOADING_TIPS.length);

  while (nextIndex === previousIndex) {
    nextIndex = Math.floor(Math.random() * LOADING_TIPS.length);
  }

  return nextIndex;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRemainingLoadingTime(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  return Math.max(0, MIN_GENERATE_LOADING_MS - elapsed);
}

export default function GeneratePage() {
  const router = useRouter();
  const [optionItems, setOptionItems] = useState<OptionItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [selectedTag1, setSelectedTag1] = useState<string>("");
  const [selectedTag2, setSelectedTag2] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblem, setGeneratedProblem] = useState<GeneratedProblem | null>(null);
  const [problemExamples, setProblemExamples] = useState<ProblemExample[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [remainingCount, setRemainingCount] = useState<number>(0);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?returnUrl=/generate");
      }
    };
    checkAuth();
  }, [router]);

  const fetchOptions = useCallback(async () => {
    setIsLoadingOptions(true);

    try {
      const response = await fetch("/api/problems/generate/options", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setOptionItems(data.items ?? []);
      } else {
        setOptionItems([]);
      }
    } catch (error) {
      setOptionItems([]);
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    setIsLoadingUsage(true);

    try {
      const response = await fetch("/api/problems/generate/usage", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "생성 횟수 조회 실패");
      }

      setRemainingCount(data.remainingCount ?? 0);
    } catch (error) {
      setRemainingCount(0);
    } finally {
      setIsLoadingUsage(false);
    }
  }, []);

  useEffect(() => {
    void fetchOptions();
    void fetchUsage();
  }, [fetchOptions, fetchUsage]);

  useEffect(() => {
    if (!isGenerating) {
      setLoadingTipIndex(0);
      return;
    }

    const tipTimer = window.setInterval(() => {
      setLoadingTipIndex((currentIndex) => getRandomTipIndex(currentIndex));
    }, LOADING_TIP_INTERVAL_MS);

    return () => {
      window.clearInterval(tipTimer);
    };
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating || loadingStartedAt === null) {
      setLoadingProgress(0);
      return;
    }

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - loadingStartedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / MIN_GENERATE_LOADING_MS) * 100));
      setLoadingProgress(nextProgress);
    }, 200);

    return () => {
      window.clearInterval(progressTimer);
    };
  }, [isGenerating, loadingStartedAt]);

  const allAvailableDifficulties = useMemo(() => {
    const diffs = Array.from(new Set(optionItems.map((item) => item.difficulty)));
    return diffs.sort((a, b) => (DIFFICULTY_ORDER[a] || 99) - (DIFFICULTY_ORDER[b] || 99));
  }, [optionItems]);

  const availableTag1s = useMemo(() => {
    let items = optionItems;
    if (selectedDifficulty) {
      items = items.filter((item) => item.difficulty === selectedDifficulty);
    }
    return Array.from(new Set(items.map((item) => item.tag1))).sort();
  }, [optionItems, selectedDifficulty]);

  const availableTag2s = useMemo(() => {
    if (!selectedTag1) return [];
    let items = optionItems.filter((item) => item.tag1 === selectedTag1 && item.tag2 !== null);
    if (selectedDifficulty) {
      items = items.filter((item) => item.difficulty === selectedDifficulty);
    }
    const tags = items.map((item) => item.tag2 as string);
    return Array.from(new Set(tags)).sort();
  }, [selectedTag1, optionItems, selectedDifficulty]);


  const selectedOptionCount = useMemo(() => {
    if (!selectedTag1 || !selectedDifficulty) return 0;

    const filtered = optionItems.filter(
      (item) =>
        item.tag1 === selectedTag1 &&
        (selectedTag2 === "" ? true : item.tag2 === selectedTag2) &&
        item.difficulty === selectedDifficulty,
    );

    return filtered.reduce((sum, item) => sum + item.count, 0);
  }, [selectedTag1, selectedTag2, selectedDifficulty, optionItems]);

  const canGenerate =
    !isGenerating &&
    !isLoadingUsage &&
    !isLoadingOptions &&
    Boolean(selectedTag1) &&
    Boolean(selectedDifficulty) &&
    selectedOptionCount > 0 &&
    remainingCount > 0;

  const handleTag1Change = (tag: string) => {
    setSelectedTag1(tag);
    setSelectedTag2("");
    setSelectedDifficulty("");
    setGeneratedProblem(null);
    setProblemExamples([]);
    setErrorMessage(null);
  };

  const handleTag2Change = (tag: string) => {
    setSelectedTag2(tag);
    setSelectedDifficulty("");
    setGeneratedProblem(null);
    setProblemExamples([]);
    setErrorMessage(null);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    const startedAt = Date.now();

    setIsGenerating(true);
    setLoadingStartedAt(startedAt);
    setLoadingTipIndex(0);
    setLoadingProgress(0);
    setErrorMessage(null);
    setGeneratedProblem(null);
    setProblemExamples([]);

    let response: Response | null = null;
    let data: {
      success?: boolean;
      message?: string;
      code?: string;
      problem?: GeneratedProblem;
      examples?: ProblemExample[];
      remainingCount?: number;
    } | null = null;
    let requestError: unknown = null;

    try {
      response = await fetch("/api/problems/generate/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag1: selectedTag1,
          tag2: selectedTag2 || null,
          difficulty: selectedDifficulty,
        }),
      });

      data = await response.json();
    } catch (error) {
      requestError = error;
    }

    const remainingLoadingTime = getRemainingLoadingTime(startedAt);

    if (remainingLoadingTime > 0) {
      await sleep(remainingLoadingTime);
    }

    if (requestError) {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setIsGenerating(false);
      setLoadingStartedAt(null);
      return;
    }

    if (!response || !data || !response.ok || !data.success) {
      setErrorMessage(data?.message || "문제 생성 중 오류가 발생했습니다.");

      if (data?.code === "DAILY_LIMIT_EXCEEDED") {
        setRemainingCount(0);
      }

      void fetchUsage();
      setIsGenerating(false);
      setLoadingStartedAt(null);
      return;
    }

    setGeneratedProblem(data.problem ?? null);
    setProblemExamples(data.examples ?? []);
    setRemainingCount(data.remainingCount ?? Math.max(remainingCount - 1, 0));

    void fetchOptions();
    void fetchUsage();

    setIsGenerating(false);
    setLoadingStartedAt(null);
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const difficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Medium":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Hard":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-6 sm:p-8 space-y-10 pb-20">
      <div className="flex flex-col items-center text-center space-y-4 pt-8">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-2">
          <Brain className="w-8 h-8 text-indigo-500" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 tracking-tight">
          문제 생성
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
          선택한 조건에 맞는 문제를 생성해드립니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                알고리즘 유형 선택
              </label>

              <div className="relative">
                <select
                  value={selectedTag1}
                  onChange={(event) => handleTag1Change(event.target.value)}
                  disabled={isLoadingOptions || isGenerating}
                  className="w-full appearance-none bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block px-4 py-3.5 outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
                >
                  <option value="">{isLoadingOptions ? "불러오는 중..." : "알고리즘을 선택하세요"}</option>

                  {availableTag1s.map((tag) => (
                    <option key={tag} value={tag}>
                      {getKoreanTag(tag)}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {availableTag2s.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  추가 알고리즘 유형 (선택)
                </label>

                <div className="relative">
                  <select
                    value={selectedTag2}
                    onChange={(event) => handleTag2Change(event.target.value)}
                    disabled={isGenerating}
                    className="w-full appearance-none bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block px-4 py-3.5 outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
                  >
                    <option value="">전체</option>

                    {availableTag2s.map((tag) => (
                      <option key={tag} value={tag}>
                        {getKoreanTag(tag)}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                난이도 선택
              </label>

              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(event) => setSelectedDifficulty(event.target.value)}
                  disabled={isLoadingOptions || isGenerating}
                  className="w-full appearance-none bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block px-4 py-3.5 outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
                >
                  <option value="">{isLoadingOptions ? "불러오는 중..." : "난이도를 선택하세요"}</option>

                  {allAvailableDifficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-3 rounded-xl font-medium text-sm">
                <Trophy className="w-4 h-4" />
                <span>
                  오늘 생성 기회:{" "}
                  <strong className="text-indigo-700 dark:text-indigo-300 text-base">
                    {isLoadingUsage ? "..." : remainingCount}
                  </strong>{" "}
                  / {DAILY_PROBLEM_CREATE_LIMIT}
                </span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full relative group overflow-hidden flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}

                <span>
                  {isGenerating ? "문제 생성 중..." : "문제 생성하기"}
                </span>
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-200 dark:border-red-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-semibold">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {isGenerating ? (
            <div className="h-full min-h-125 flex flex-col items-center justify-center space-y-7 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-md rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-8 shadow-xl">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-indigo-500 animate-bounce" />
                </div>
              </div>

              <div className="w-full max-w-md space-y-4 text-center">


                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-500/10 dark:bg-indigo-500/5">
                  <div className="mb-3 flex justify-center">
                    <Lightbulb className="h-6 w-6 text-indigo-500" />
                  </div>

                  <p className="min-h-14 text-base font-semibold leading-relaxed text-zinc-800 dark:text-zinc-100">
                    {LOADING_TIPS[loadingTipIndex]}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>문제 준비 중</span>
                    <span>{loadingProgress}%</span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  조건에 맞는 문제를 생성하고 있습니다.
                </p>
              </div>
            </div>
          ) : generatedProblem ? (
            <div className="bg-white dark:bg-[#09090b] rounded-3xl border border-zinc-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="p-6 border-b border-emerald-200 dark:border-emerald-900/30 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <div>
                    <h2 className="font-bold text-lg">문제 생성 완료</h2>
                    <p className="text-xs font-medium opacity-80">이제 모든 사용자에게 공개되었습니다.</p>
                  </div>
                </div>

                <a
                  href={`/problems/${generatedProblem.id}`}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:scale-105 active:scale-95"
                >
                  문제 상세 보러가기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>

              <div className="p-8 space-y-8 h-150 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${difficultyColor(generatedProblem.difficulty)}`}>
                      {generatedProblem.difficulty}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-black">
                      {getKoreanTag(generatedProblem.tag1)}
                    </span>
                    {generatedProblem.tag2 && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-black">
                        {getKoreanTag(generatedProblem.tag2)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {generatedProblem.title}
                  </h3>

                  <div className="flex items-center space-x-4 text-xs font-medium text-zinc-500">
                    <span>시간 제한: {generatedProblem.time_limit_ms / 1000}초</span>
                    <span>메모리 제한: {generatedProblem.memory_limit_mb}MB</span>
                  </div>
                </div>

                <ProblemMarkdown content={generatedProblem.description} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                      입력 설명
                    </h4>

                    <div className="bg-zinc-50 dark:bg-black/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-sm">
                      <ProblemMarkdown content={generatedProblem.input_description} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2" />
                      출력 설명
                    </h4>

                    <div className="bg-zinc-50 dark:bg-black/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-sm">
                      <ProblemMarkdown content={generatedProblem.output_description} />
                    </div>
                  </div>
                </div>

                {problemExamples.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">입출력 예제</h4>

                    {problemExamples.map((example, index) => (
                      <div key={`${example.input_text}-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Input {index + 1}</span>
                            <button onClick={() => copyToClipboard(example.input_text)} className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <pre className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                            {example.input_text}
                          </pre>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Output {index + 1}</span>
                            <button onClick={() => copyToClipboard(example.output_text)} className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <pre className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                            {example.output_text}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 space-y-4">
              <Sparkles className="w-12 h-12 opacity-20" />
              <p className="font-medium">조건을 선택하고 문제를 생성하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
