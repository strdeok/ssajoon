"use client";

import Link from "next/link";
import { Problem } from "@/types/problem";
import { ChevronRight, Code2, Search } from "lucide-react";
import { useState } from "react";

export function ProblemList({ problems }: { problems: Problem[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProblems = problems.filter((problem) =>
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          placeholder="문제 제목이나 설명으로 검색해보세요..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredProblems.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">검색된 문제가 없습니다</p>
          <p className="text-sm">다른 검색어를 입력해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((problem) => (
            <Link href={`/problems/${problem.id}`} key={problem.id}>
              <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-blue-500/30 overflow-hidden h-full">
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
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all flex-shrink-0 ml-2 mt-2" />
                </div>
                
                <div className="mt-6 flex items-center gap-2">
                  <span className="text-xs font-medium px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full">
                    No. {problem.problem_no || problem.id}
                  </span>
                  {problem.difficulty && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                      {problem.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
