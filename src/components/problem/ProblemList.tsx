import Link from "next/link";
import { Problem } from "@/types/problem";
import { ChevronRight, Code2 } from "lucide-react";

export function ProblemList({ problems }: { problems: Problem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {problems.map((problem) => (
        <Link href={`/problems/${problem.id}`} key={problem.id}>
          <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-blue-500/30 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <Code2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    {problem.title}
                  </h3>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-2 mt-2 leading-relaxed">
                  {problem.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs font-medium px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full">
                ID: {problem.id}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
