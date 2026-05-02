"use client";

import { useState, useEffect } from "react";
import { Problem } from "@/types/problem";
import { createClient } from "@/utils/supabase/client";
import { Loader2, FileText, Clock, Copy, Check, Cpu } from "lucide-react";
import { SubmissionHistoryPanel } from "@/components/submission/SubmissionHistoryPanel";

export function ProblemDetail({ problem }: { problem: Problem }) {
  // 1. 탭 상태 관리
  const [activeTab, setActiveTab] = useState<"description" | "submissions">("description");
  
  // 2. 데이터 상태 관리
  const [user, setUser] = useState<any>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 탭 전환 시 스크롤 위치 초기화 및 height 재계산을 위해
  // 아코디언 확장 상태를 문제 설명 탭에서 강제 리셋하지 않아도 되도록
  // 탭 변경 핸들러에서 내부 컨텐츠 스크롤 최상단으로 이동
  const handleTabChange = (tab: "description" | "submissions") => {
    setActiveTab(tab);
  };

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

  // 예제 표시 데이터 계산:
  // problem_testcases(is_hidden=false)를 우선 사용하고,
  // 없으면 problem_examples를 fallback으로 사용
  const publicTestcases = problem.problem_testcases?.filter(t => !t.is_hidden) ?? [];
  const examples = problem.problem_examples ?? [];
  const hasTestcases = publicTestcases.length > 0;
  const hasExamples = examples.length > 0;

  // 통합 예제 목록: in/out 형태로 정규화
  const exampleList = hasTestcases
    ? publicTestcases.map(t => ({ id: t.id, input: t.input_text, output: t.expected_output }))
    : hasExamples
    ? examples.map(e => ({ id: e.id, input: e.input_text, output: e.output_text }))
    : [];

  return (
    // [버그1 수정] lg 화면에서 h-full + overflow-hidden 유지
    // 모바일에서는 h-auto로 자연 확장
    <div className="flex flex-col lg:h-full h-auto bg-white dark:bg-zinc-900/50 rounded-xl lg:overflow-hidden">
      
      {/* 상단 헤더 및 탭 영역 - sticky 유지 */}
      <div className="flex-shrink-0 border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/80 sticky top-0 backdrop-blur-md z-10">
        <div className="p-8 pb-4 flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {problem.problem_no ? `${problem.problem_no}. ${problem.title}` : problem.title}
          </h1>
          {problem.difficulty && (
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm cursor-default">
              {problem.difficulty}
            </span>
          )}
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="flex px-8 space-x-6">
          <button
            onClick={() => handleTabChange("description")}
            className={`pb-4 text-sm font-medium transition-colors relative flex items-center space-x-2 cursor-pointer ${
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
            onClick={() => handleTabChange("submissions")}
            className={`pb-4 text-sm font-medium transition-colors relative flex items-center space-x-2 cursor-pointer ${
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
      
      {/* [버그1 핵심 수정]
          탭별 컨텐츠 영역: flex-1 + min-h-0 + overflow-auto 조합이 핵심.
          min-h-0 없이 flex-1만 있으면 내부 콘텐츠 크기가 부모를 밀어냄.
          display:none 대신 조건부 렌더링을 사용해야
          탭 전환 시 DOM이 교체되어 높이가 재계산됨.
      */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        
        {/* 문제 설명 탭 */}
        {activeTab === "description" && (
          <div className="p-8 space-y-10">
            
            {/* 제약사항 */}
            {(problem.time_limit_ms != null || problem.memory_limit_mb != null) && (
              <section className="flex flex-wrap gap-6 items-center bg-zinc-50 dark:bg-black/20 p-5 rounded-xl border border-zinc-200 dark:border-white/5">
                <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mr-2">제약사항</h2>
                {problem.time_limit_ms != null && (
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium text-sm bg-white dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <Clock className="w-4 h-4 text-blue-500" />
                    시간 제한: {problem.time_limit_ms}ms
                  </div>
                )}
                {problem.memory_limit_mb != null && (
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium text-sm bg-white dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <Cpu className="w-4 h-4 text-purple-500" />
                    메모리 제한: {problem.memory_limit_mb}MB
                  </div>
                )}
              </section>
            )}

            {/* 문제 설명 */}
            {problem.description && (
              <section>
                <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                  문제 설명
                </h2>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                  {problem.description}
                </div>
              </section>
            )}

            {/* 입력 설명 */}
            {problem.input_description && (
              <section>
                <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
                  입력
                </h2>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                  {problem.input_description}
                </div>
              </section>
            )}

            {/* 출력 설명 */}
            {problem.output_description && (
              <section>
                <h2 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-pink-500 mr-3" />
                  출력
                </h2>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                  {problem.output_description}
                </div>
              </section>
            )}

            {/* [버그3 수정] 예제 입출력:
                problem_testcases(is_hidden=false) 우선,
                없으면 problem_examples fallback */}
            {exampleList.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
                  예제 (입출력)
                </h2>
                <div className="space-y-6">
                  {exampleList.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 예제 입력 */}
                      <div>
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                          입력 {index + 1}
                        </h3>
                        <div className="relative group">
                          <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm min-h-[80px] max-h-[300px] overflow-y-auto custom-scrollbar">
                            {item.input || "입력값이 없습니다."}
                          </div>
                          <button 
                            onClick={() => handleCopy(item.input, `in-${item.id}`)}
                            className="absolute top-3 right-3 p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm cursor-pointer"
                            title="복사"
                          >
                            {copiedId === `in-${item.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {/* 예제 출력 */}
                      <div>
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                          출력 {index + 1}
                        </h3>
                        <div className="relative group">
                          <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm min-h-[80px] max-h-[300px] overflow-y-auto custom-scrollbar">
                            {item.output || "기대 출력값이 없습니다."}
                          </div>
                          <button 
                            onClick={() => handleCopy(item.output, `out-${item.id}`)}
                            className="absolute top-3 right-3 p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm cursor-pointer"
                            title="복사"
                          >
                            {copiedId === `out-${item.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* [버그1 핵심 수정]
            제출 내역 탭: 별도 조건부 렌더링으로 완전히 교체되어
            이 탭에서 늘어난 높이가 description 탭에 남지 않음 */}
        {activeTab === "submissions" && (
          <div className="p-8">
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
