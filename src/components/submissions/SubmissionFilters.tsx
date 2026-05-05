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
  // 선택 가능한 상태 및 언어 목록 (필요시 프롭스로 받을 수 있음)
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
  availableStatuses = ["모든 상태", "맞았습니다!", "틀렸습니다", "시간 초과", "메모리 초과", "런타임 에러", "컴파일 에러"],
  availableLanguages = ["모든 언어", "Python", "Java", "C++", "C", "JavaScript"],
}: Props) {
  return (
    // 전체 컨테이너: 기본적으로 가로(flex-row) 배치, 좁은 화면(sm 미만)에서는 세로(flex-col) 배치로 반응형 처리
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      
      {/* 1. 검색어 입력 바 */}
      <div className="relative flex-1">
        {/* 검색 아이콘을 input 좌측에 절대 위치로 배치 */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="문제 번호 또는 제목으로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          // input 스타일: 패딩으로 왼쪽 아이콘 공간 확보, 테두리 둥글게, 포커스 시 테두리 색상 변경
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* 2. 상태 필터 Select */}
      <div className="w-full sm:w-48">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
        >
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* 3. 언어 필터 Select */}
      <div className="w-full sm:w-48">
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
        >
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
