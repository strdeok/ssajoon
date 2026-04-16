import { Problem } from "@/types/problem";

export function ProblemDetail({ problem }: { problem: Problem }) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900/50 rounded-xl overflow-auto custom-scrollbar">
      <div className="p-8 border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/80 sticky top-0 backdrop-blur-md z-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {problem.problem_no ? `${problem.problem_no}. ${problem.title}` : problem.title}
        </h1>
      </div>
      
      <div className="p-8 space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
            문제 설명
          </h2>
          <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5">
            {problem.description}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
            입력
          </h2>
          <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5">
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

        {problem.problem_examples && problem.problem_examples.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
              샘플 테스트 케이스
            </h2>
            <div className="space-y-4">
              {problem.problem_examples.map((tc, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-200 dark:border-white/5 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-white/5">
                    <div className="p-4">
                      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Input {idx + 1}</div>
                      <pre className="font-mono text-sm text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">{tc.input_text || " "}</pre>
                    </div>
                    <div className="p-4">
                      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Output {idx + 1}</div>
                      <pre className="font-mono text-sm text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">{tc.output_text}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
