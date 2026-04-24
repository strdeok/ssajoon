"use client";

import { useState, useEffect } from "react";
import { Problem } from "@/types/problem";
import { createClient } from "@/utils/supabase/client";
import { Loader2, FileText, Clock, Copy, Check } from "lucide-react";
import { SubmissionHistoryPanel } from "@/components/submission/SubmissionHistoryPanel";

export function ProblemDetail({ problem }: { problem: Problem }) {
  // 1. 탭 상태 관리
  const [activeTab, setActiveTab] = useState<"description" | "submissions">("description");
  
  // 2. 데이터 상태 관리
  const [user, setUser] = useState<any>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 3. 페이지 최초 렌더 시 로그인 유저 확인
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsUserLoaded(true);
    }
    loadUser();
  }, []);

  // 4. 불필요해진 loadSubmissions 로직 제거
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900/50 rounded-xl overflow-hidden">
      {/* 상단 헤더 및 탭 영역 */}
      <div className="border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/80 sticky top-0 backdrop-blur-md z-10">
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {problem.problem_no ? `${problem.problem_no}. ${problem.title}` : problem.title}
          </h1>
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="flex px-8 space-x-6">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-4 text-sm font-medium transition-colors relative flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed ${
              activeTab === "description"
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>문제 설명</span>
            {activeTab === "description" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("submissions")}
            className={`pb-4 text-sm font-medium transition-colors relative flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed ${
              activeTab === "submissions"
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>내 제출 코드</span>
            {activeTab === "submissions" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>
        </div>
      </div>
      
      {/* 탭별 하단 컨텐츠 렌더링 영역 */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {activeTab === "description" ? (
          <div className="p-8 space-y-10">
            {/* 5. 기존 문제 설명 렌더링 */}
            <section>
              <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                문제 설명
              </h2>
              <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                {problem.description}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
                입력
              </h2>
              <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                {problem.input_description}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4 flex items-center">
                <span className="w-2 h-2 rounded-full bg-pink-500 mr-3" />
                출력
              </h2>
              <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                {problem.output_description}
              </div>
            </section>

            {/* 샘플 테스트케이스 (예제) */}
            {problem.problem_examples && problem.problem_examples.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
                  예제 테스트케이스
                </h2>
                <div className="space-y-6">
                  {problem.problem_examples.map((example, index) => (
                    <div key={example.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 예제 입력 */}
                      <div>
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                          예제 입력 {index + 1}
                        </h3>
                        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm relative group min-h-[80px]">
                          {example.input_text}
                          <button 
                            onClick={() => handleCopy(example.input_text, `in-${example.id}`)}
                            className="absolute top-3 right-3 p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm"
                            title="복사"
                          >
                            {copiedId === `in-${example.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {/* 예제 출력 */}
                      <div>
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                          예제 출력 {index + 1}
                        </h3>
                        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm relative group min-h-[80px]">
                          {example.output_text}
                          <button 
                            onClick={() => handleCopy(example.output_text, `out-${example.id}`)}
                            className="absolute top-3 right-3 p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm"
                            title="복사"
                          >
                            {copiedId === `out-${example.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="p-8">
            {/* 6. 제출 내역 렌더링 영역 */}
            {!isUserLoaded ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : !user ? (
              <div className="text-center py-12 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-200 dark:border-white/5">
                <p className="text-zinc-500 dark:text-zinc-400">로그인 후 제출 내역을 확인할 수 있습니다.</p>
              </div>
            ) : (
              <SubmissionHistoryPanel problemId={problem.id} userId={user.id} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
