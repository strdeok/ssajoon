"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  "분할 정복", "동적 계획법", "그리디", "BFS", "DFS", "구현", "문자열", "정렬"
];

interface GeneratedProblem {
  id: number;
  title: string;
  description: string;
  input_description: string;
  output_description: string;
}

export default function GeneratePage() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [generatedProblem, setGeneratedProblem] = useState<GeneratedProblem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);

  const handleGenerate = async () => {
    // 1. 기존 상태 초기화
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedProblem(null);
    
    try {
      // 2. 서버 API 호출
      const response = await fetch("/api/problems/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // 3. 실패 처리 (하루 제한 초과, 에러 등)
        setErrorMessage(data.message || "알 수 없는 오류가 발생했습니다.");
        
        // 일일 한도 초과 시 명시적으로 0으로 표기
        if (data.code === "DAILY_LIMIT_EXCEEDED") {
          setRemainingCount(0);
        }
      } else {
        // 4. 성공 처리
        setGeneratedProblem(data.problem);
        setRemainingCount(data.remainingCount);
      }
    } catch (error) {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
          인공지능 문제 생성
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          원하는 카테고리를 선택하면 서버 API를 통해 AI가 맞춤형 알고리즘 문제를 생성하고 DB에 저장합니다.
        </p>
      </div>

      <div className="bg-white dark:bg-[#09090b] p-6 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            알고리즘 카테고리
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full max-w-xs bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-4 py-2.5 outline-none transition-all cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || remainingCount === 0}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-300 disabled:to-zinc-300 dark:disabled:from-zinc-800 dark:disabled:to-zinc-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {isGenerating && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>
              {isGenerating ? "문제 생성 중..." : "서버에 문제 생성 요청하기"}
            </span>
          </button>
          
          {remainingCount !== null && (
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              오늘 남은 생성 횟수: <strong className={remainingCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}>{remainingCount}</strong> / 3
            </span>
          )}
        </div>

        {/* 에러 메시지 렌더링 영역 */}
        {errorMessage && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="p-12 flex flex-col items-center justify-center space-y-4 bg-white/50 dark:bg-[#09090b]/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">서버에서 {selectedCategory} 문제를 생성하여 DB에 저장하는 중입니다...</p>
        </div>
      )}

      {/* 성공 시 생성된 문제 렌더링 영역 */}
      {generatedProblem && !isGenerating && (
        <div className="bg-white dark:bg-[#09090b] rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 border-b border-zinc-200 dark:border-white/5 bg-emerald-50 dark:bg-emerald-900/20">
            <h2 className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              문제가 성공적으로 DB에 생성되었습니다! (문제 ID: {generatedProblem.id})
            </h2>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{generatedProblem.title}</h3>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{generatedProblem.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-50 dark:bg-black/20 p-4 rounded-lg border border-zinc-200 dark:border-white/5">
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">입력</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{generatedProblem.input_description}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-black/20 p-4 rounded-lg border border-zinc-200 dark:border-white/5">
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">출력</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{generatedProblem.output_description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
