import { Clock, Cpu, FileText } from "lucide-react";
import type { Problem } from "@/types/problem";
import { getKoreanTag } from "@/utils/tagUtils";
import { ServerProblemMarkdown } from "@/components/problem/ServerProblemMarkdown";
import { CopyButton } from "@/components/problem/CopyButton";

export type PublicTestcase = {
  id: string;
  input_text: string;
  expected_output: string;
  testcase_order: number;
};

type ProblemContentProps = {
  problem: Problem;
  publicTestcases: PublicTestcase[];
};

export function ProblemContent({ problem, publicTestcases }: ProblemContentProps) {
  return (
    <div className="flex flex-col lg:h-full h-auto bg-white dark:bg-zinc-900/50 rounded-xl lg:overflow-hidden">
      <div className="flex-shrink-0 border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/80 sticky top-0 backdrop-blur-md z-10">
        <div className="p-8 pb-4 flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            <span className="mr-2">#{problem.id}</span>
            {problem.title}
          </h1>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-default">
              {getKoreanTag(problem.tag1)}
            </span>
            {problem.tag2 && (
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-default">
                {getKoreanTag(problem.tag2)}
              </span>
            )}
            {problem.difficulty && (
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm cursor-default">
                {problem.difficulty}
              </span>
            )}
          </div>
        </div>

        <div className="flex px-8 space-x-6">
          <div className="pb-4 text-sm font-medium relative flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <FileText className="w-4 h-4" />
            <span>문제 설명</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div className="p-8 space-y-10">
          {(problem.time_limit_ms != null ||
            problem.memory_limit_mb != null) && (
            <section className="flex flex-wrap gap-6 items-center bg-zinc-50 dark:bg-black/20 p-5 rounded-xl border border-zinc-200 dark:border-white/5">
              <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mr-2">
                제약사항
              </h2>
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

          {problem.description && (
            <section>
              <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                문제 설명
              </h2>
              <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                <ServerProblemMarkdown content={problem.description} />
              </div>
            </section>
          )}

          {problem.input_description && (
            <section>
              <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
                입력 설명
              </h2>
              <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                <ServerProblemMarkdown content={problem.input_description} />
              </div>
            </section>
          )}

          {problem.output_description && (
            <section>
              <h2 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4 flex items-center">
                <span className="w-2 h-2 rounded-full bg-pink-500 mr-3" />
                출력 설명
              </h2>
              <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                <ServerProblemMarkdown content={problem.output_description} />
              </div>
            </section>
          )}

          {publicTestcases.length > 0 && (
            <section className="space-y-6">
              {publicTestcases.map((testcase, index) => (
                <div
                  key={testcase.id}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      입력 {index + 1}
                    </h3>
                    <div className="relative group">
                      <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm min-h-[80px] max-h-[300px] overflow-y-auto custom-scrollbar">
                        {testcase.input_text || "입력값이 없습니다."}
                      </div>
                      <CopyButton text={testcase.input_text} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      출력 {index + 1}
                    </h3>
                    <div className="relative group">
                      <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap font-mono text-sm min-h-[80px] max-h-[300px] overflow-y-auto custom-scrollbar">
                        {testcase.expected_output || "기대 출력값이 없습니다."}
                      </div>
                      <CopyButton text={testcase.expected_output} />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
