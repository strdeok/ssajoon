"use client";

import React from "react";
import { Search } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  languageFilter: string;
  setLanguageFilter: (lang: string) => void;
  availableStatuses?: string[];
  availableLanguages?: string[];
};

export default function SubmissionFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  languageFilter,
  setLanguageFilter,
  availableStatuses = ["모든 상태", "정답", "오답", "시간 초과", "메모리 초과", "런타임 에러", "컴파일 에러", "출력 형식 오류", "시스템 오류"],
  availableLanguages = ["모든 언어", "c++", "java", "python"],
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="문제 번호 또는 제목으로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="w-full sm:w-48">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
        >
          {availableStatuses.map((status) => (
            <option key={status} value={status} className="dark:bg-zinc-900">
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-48">
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
        >
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang} className="dark:bg-zinc-900">
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
