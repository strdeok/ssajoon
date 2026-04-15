import { Problem } from "@/types/problem";

export function ProblemDetail({ problem }: { problem: Problem }) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900/50 rounded-xl overflow-auto custom-scrollbar">
      <div className="p-8 border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/80 sticky top-0 backdrop-blur-md z-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {problem.title}
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
            {problem.input_desc}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-pink-500 mr-3" />
            출력
          </h2>
          <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 rounded-xl border border-zinc-200 dark:border-white/5">
            {problem.output_desc}
          </div>
        </section>
      </div>
    </div>
  );
}
