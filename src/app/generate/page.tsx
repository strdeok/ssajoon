"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";

interface OptionItem {
  category: string;
  difficulty: string;
  count: number;
}

interface GeneratedProblem {
  id: number;
  title: string;
  description: string;
  input_description: string;
  output_description: string;
  category: string;
  difficulty: string;
  time_limit_ms: number;
  memory_limit_mb: number;
}

interface ProblemExample {
  input_text: string;
  output_text: string;
}

export default function GeneratePage() {
  // DB에서 가져온 생성 가능한 옵션들 (is_hidden = true 인 문제들의 조합)
  const [optionItems, setOptionItems] = useState<OptionItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // 선택된 값들
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

  // 상태 관리
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblem, setGeneratedProblem] =
    useState<GeneratedProblem | null>(null);
  const [problemExamples, setProblemExamples] = useState<ProblemExample[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);

  // 1. 페이지 로드 시 DB에서 가능한 옵션(조합) 가져오기
  const fetchOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const response = await fetch("/api/problems/generate/options");
      const data = await response.json();
      console.log(data);
      if (data.success) {
        setOptionItems(data.items);
      }
    } catch (error) {
      console.error("옵션 로드 실패:", error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // 2. 선택 가능한 카테고리 계산 (중복 제거)
  const availableCategories = useMemo(() => {
    return Array.from(new Set(optionItems.map((item) => item.category))).sort();
  }, [optionItems]);

  // 3. 선택된 카테고리에서 실제로 존재하는 난이도만 필터링
  const availableDifficulties = useMemo(() => {
    if (!selectedCategory) return [];
    return optionItems
      .filter((item) => item.category === selectedCategory)
      .map((item) => item.difficulty)
      .sort();
  }, [selectedCategory, optionItems]);

  // 4. 선택된 조합의 남은 문제 수 계산
  const selectedOptionCount = useMemo(() => {
    if (!selectedCategory || !selectedDifficulty) return 0;
    const option = optionItems.find(
      (item) =>
        item.category === selectedCategory &&
        item.difficulty === selectedDifficulty,
    );
    return option?.count ?? 0;
  }, [selectedCategory, selectedDifficulty, optionItems]);

  // 카테고리 변경 시 난이도 초기화
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedDifficulty("");
    setGeneratedProblem(null);
  };

  // 문제 생성 실행
  const handleGenerate = async () => {
    if (!selectedCategory || !selectedDifficulty || selectedOptionCount === 0)
      return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedProblem(null);

    try {
      // publish API 호출 (is_hidden=false 로 변경 및 데이터 반환)
      const response = await fetch("/api/problems/generate/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          difficulty: selectedDifficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "문제 생성 중 오류가 발생했습니다.");
        if (data.code === "DAILY_LIMIT_EXCEEDED") setRemainingCount(0);
      } else {
        setGeneratedProblem(data.problem);
        setProblemExamples(data.examples);
        setRemainingCount(data.remainingCount);
        // 생성 후 옵션 목록 갱신 (남은 개수 반영)
        fetchOptions();
      }
    } catch (error) {
      setErrorMessage(
        "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // 간단한 알림 로직은 생략
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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-2">
          <Brain className="w-8 h-8 text-indigo-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 tracking-tight">
          문제 생성
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
          선택한 조건에 맞는 문제를 준비된 문제 풀에서 제공합니다.
          <br />
          DB에 존재하는 실제 카테고리와 난이도 조합만 선택 가능합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 왼쪽: 설정 카드 */}
        <div className="lg:col-span-5 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                알고리즘 유형 선택
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={isLoadingOptions}
                  className="w-full appearance-none bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block px-4 py-3.5 outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
                >
                  <option value="">알고리즘을 선택하세요</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                난이도 선택
              </label>
              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  disabled={!selectedCategory || isLoadingOptions}
                  className="w-full appearance-none bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block px-4 py-3.5 outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
                >
                  <option value="">
                    {selectedCategory
                      ? "난이도를 선택하세요"
                      : "알고리즘을 먼저 선택하세요"}
                  </option>
                  {availableDifficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {selectedCategory && selectedDifficulty && (
              <div
                className={`p-4 rounded-xl text-sm font-medium border animate-in fade-in duration-300 ${
                  selectedOptionCount > 0
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20"
                    : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-500/20"
                }`}
              >
                {selectedOptionCount > 0
                  ? `선택 조건에 맞는 남은 비공개 문제: ${selectedOptionCount}개`
                  : "선택한 조건으로 생성 가능한 문제가 없습니다."}
              </div>
            )}

            <div className="pt-4 space-y-4">
              <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-3 rounded-xl font-medium text-sm">
                <Trophy className="w-4 h-4" />
                <span>
                  오늘 생성 기회:{" "}
                  <strong className="text-indigo-700 dark:text-indigo-300 text-base">
                    {remainingCount !== null ? remainingCount : 3}
                  </strong>{" "}
                  / 3
                </span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={
                  isGenerating ||
                  selectedOptionCount === 0 ||
                  !selectedDifficulty ||
                  remainingCount === 0
                }
                className="w-full relative group overflow-hidden flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span>
                  {isGenerating ? "문제 검색 중..." : "문제 생성하기"}
                </span>
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-200 dark:border-red-500/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 미리보기 패널 */}
        <div className="lg:col-span-7">
          {isGenerating ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-6 bg-white/40 dark:bg-[#09090b]/40 backdrop-blur-md rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 animate-pulse">
              <Lock className="w-12 h-12 text-indigo-500 animate-bounce" />
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
                비공개 문제를 안전하게 불러오는 중...
              </p>
            </div>
          ) : generatedProblem ? (
            <div className="bg-white dark:bg-[#09090b] rounded-3xl border border-zinc-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="p-6 border-b border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <div>
                    <h2 className="font-bold text-lg">문제 생성 완료</h2>
                    <p className="text-xs font-medium opacity-80">
                      이제 모든 사용자에게 공개되었습니다.
                    </p>
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

              <div className="p-8 space-y-8 h-[600px] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${difficultyColor(generatedProblem.difficulty)}`}
                    >
                      {generatedProblem.difficulty}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-black">
                      {generatedProblem.category}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {generatedProblem.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs font-medium text-zinc-500">
                    <span>
                      시간 제한: {generatedProblem.time_limit_ms / 1000}초
                    </span>
                    <span>
                      메모리 제한: {generatedProblem.memory_limit_mb}MB
                    </span>
                  </div>
                </div>

                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {generatedProblem.description}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                      입력 설명
                    </h4>
                    <div className="bg-zinc-50 dark:bg-black/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-sm text-zinc-600 dark:text-zinc-400">
                      {generatedProblem.input_description}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2"></span>
                      출력 설명
                    </h4>
                    <div className="bg-zinc-50 dark:bg-black/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-sm text-zinc-600 dark:text-zinc-400">
                      {generatedProblem.output_description}
                    </div>
                  </div>
                </div>

                {problemExamples.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                      입출력 예제
                    </h4>
                    {problemExamples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                              Input {idx + 1}
                            </span>
                            <button
                              onClick={() => copyToClipboard(ex.input_text)}
                              className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <pre className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                            {ex.input_text}
                          </pre>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                              Output {idx + 1}
                            </span>
                            <button
                              onClick={() => copyToClipboard(ex.output_text)}
                              className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <pre className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                            {ex.output_text}
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
