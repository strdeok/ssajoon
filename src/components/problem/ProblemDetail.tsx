"use client";

import { useState, useEffect } from "react";
import { Problem } from "@/types/problem";
import { createClient } from "@/utils/supabase/client";
import { Loader2, FileText, Clock, Copy, Check, Cpu } from "lucide-react";
import { SubmissionHistoryPanel } from "@/components/submission/SubmissionHistoryPanel";

export function ProblemDetail({ problem }: { problem: Problem }) {
  // ─── 탭 상태 ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"description" | "submissions">("description");

  // ─── 로그인 유저 ───────────────────────────────────────────
  const [user, setUser] = useState<any>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  // ─── 클립보드 복사 피드백 ──────────────────────────────────
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /**
   * [핵심] 제출 내역 아코디언 open 상태를 부모(이 컴포넌트)에서 추적.
   * SubmissionHistoryPanel 이 onAnyExpanded 콜백으로 알려주면
   * 여기서 컨테이너 높이 클래스를 동적으로 교체한다.
   *
   * - true  → 아코디언이 하나 이상 열림 → 높이 auto (콘텐츠만큼 확장)
   * - false → 전부 닫힘             → 높이 full + overflow-hidden 복구
   */
  const [isSubmissionExpanded, setIsSubmissionExpanded] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /** 탭 전환 시 expanded 상태도 초기화 */
  const handleTabChange = (tab: "description" | "submissions") => {
    if (tab === "description") {
      setIsSubmissionExpanded(false);
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsUserLoaded(true);
    }
    loadUser();
  }, []);

  // ─── 공개 테스트케이스 (problem_testcases 테이블 직접 조회) ─────────────────
  // problem_testcases 는 problems 와 별개 테이블 (problem_id FK).
  // API 응답에 embedded 된 값에 의존하지 않고 클라이언트에서 직접 fetch.
  const [publicTestcases, setPublicTestcases] = useState<{
    id: string;
    input_text: string;
    expected_output: string;
    testcase_order: number;
  }[]>([]);

  useEffect(() => {
    async function fetchPublicTestcases() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("problem_testcases")
        .select("id, input_text, expected_output, testcase_order")
        .eq("problem_id", problem.id)   // FK: problem_testcases.problem_id → problems.id
        .eq("is_hidden", false)          // 공개 케이스만
        .eq("is_deleted", false)         // soft delete 제외
        .order("testcase_order", { ascending: true }); // 순서대로

      if (!error && data) {
        setPublicTestcases(data);
      }
    }
    fetchPublicTestcases();
  }, [problem.id]);

  /**
   * 컨테이너 높이 클래스 동적 결정:
   *
   * [데스크탑 lg]
   *  - 기본(description 탭 / 아코디언 닫힘):
   *      h-full + overflow-hidden → 부모 flex 높이를 꽉 채우고 내부 스크롤
   *  - 제출 탭 + 아코디언 열림:
   *      h-auto + overflow-visible → 콘텐츠만큼 자유롭게 확장
   *
   * [모바일]
   *  항상 h-auto (세로 스택이므로 자연 확장)
   */
  const isExpanded = activeTab === "submissions" && isSubmissionExpanded;
  const containerClass = isExpanded
    ? "flex flex-col h-auto bg-white dark:bg-zinc-900/50 rounded-xl"          // 확장됨
    : "flex flex-col lg:h-full h-auto bg-white dark:bg-zinc-900/50 rounded-xl lg:overflow-hidden"; // 기본

  return (
    <div className={containerClass}>

      {/* ── 헤더 + 탭 ── */}
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

      {/* ── 컨텐츠 영역 ──
          - isExpanded=true  → overflow-visible, 높이 제한 없음
          - isExpanded=false → flex-1 min-h-0 overflow-auto (내부 스크롤)
      */}
      <div className={isExpanded
        ? "overflow-visible pb-8"
        : "flex-1 min-h-0 overflow-auto custom-scrollbar"
      }>

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

            {/* 입력 설명 (problems.input_description) */}
            {problem.input_description && (
              <section>
                <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
                  입력 설명
                </h2>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                  {problem.input_description}
                </div>
              </section>
            )}

            {/* 출력 설명 (problems.output_description) */}
            {problem.output_description && (
              <section>
                <h2 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-pink-500 mr-3" />
                  출력 설명
                </h2>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                  {problem.output_description}
                </div>
              </section>
            )}

            {/* 입력 n / 출력 n: problem_testcases where is_hidden = false
                섹션 제목 없이 입력1&출력1, 입력2&출력2... 형태로 반복 표시 */}
            {publicTestcases.length > 0 && (
              <section className="space-y-6">
                {publicTestcases.map((tc, index) => (
                  <div key={tc.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 입력 n */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        입력 {index + 1}
                      </h3>
                      <div className="relative group">
                        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm min-h-[80px] max-h-[300px] overflow-y-auto custom-scrollbar">
                          {tc.input_text || "입력값이 없습니다."}
                        </div>
                        <button
                          onClick={() => handleCopy(tc.input_text, `in-${tc.id}`)}
                          className="absolute top-3 right-3 p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm cursor-pointer"
                          title="복사"
                        >
                          {copiedId === `in-${tc.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    {/* 출력 n */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        출력 {index + 1}
                      </h3>
                      <div className="relative group">
                        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm min-h-[80px] max-h-[300px] overflow-y-auto custom-scrollbar">
                          {tc.expected_output || "기대 출력값이 없습니다."}
                        </div>
                        <button
                          onClick={() => handleCopy(tc.expected_output, `out-${tc.id}`)}
                          className="absolute top-3 right-3 p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm cursor-pointer"
                          title="복사"
                        >
                          {copiedId === `out-${tc.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}

        {/* 제출 내역 탭
            SubmissionHistoryPanel → onAnyExpanded 콜백 → setIsSubmissionExpanded
            부모가 expanded 상태를 감지하면 위 containerClass가 즉시 바뀜 */}
        {activeTab === "submissions" && (
          <div className="p-8">
            {!isUserLoaded ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : !user ? (
              <div className="text-center py-12 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-200 dark:border-white/5">
                <p className="text-zinc-500 dark:text-zinc-400">로그인 후 제출 내역을 확인할 수 있습니다.</p>
              </div>
            ) : (
              <SubmissionHistoryPanel
                problemId={problem.id}
                userId={user.id}
                onAnyExpanded={setIsSubmissionExpanded}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
