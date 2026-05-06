"use client"; // 이 컴포넌트는 클라이언트에서 렌더링되도록 설정한다.

import { Code2 } from "lucide-react"; // 언어 사용 통계 카드에 사용할 아이콘을 가져온다.

type LanguageUsageRow = {
  // 다른 유저 정답 제출의 언어 row 타입을 정의한다.
  user_id?: string | null; // 제출한 유저 id를 의미한다.
  language: string | null; // 제출에 사용된 언어를 의미한다.
}; // LanguageUsageRow 타입 정의를 종료한다.

type LanguageStat = {
  // 화면에 표시할 언어별 통계 타입을 정의한다.
  language: string; // 정규화된 언어 이름을 의미한다.
  count: number; // 해당 언어를 사용한 유저 또는 제출 수를 의미한다.
  percentage: number; // 전체 대비 해당 언어 비율을 의미한다.
  isMine: boolean; // 현재 내 제출 언어와 같은지 여부를 의미한다.
}; // LanguageStat 타입 정의를 종료한다.

interface CompareOthersLanguageProps {
  // CompareOthersLanguage 컴포넌트 props 타입을 정의한다.
  rows: LanguageUsageRow[]; // 다른 유저들의 정답 제출 언어 데이터를 받는다.
  myLanguage?: string | null; // 현재 내 제출 언어를 받는다.
} // CompareOthersLanguageProps 타입 정의를 종료한다.

function normalizeLanguage(language: string | null | undefined) {
  // 언어 값을 화면 비교용으로 정규화하는 함수를 정의한다.
  return (language ?? "Unknown").trim().toLowerCase(); // null은 Unknown으로 처리하고 소문자로 변환한다.
} // normalizeLanguage 함수를 종료한다.

function formatLanguage(language: string) {
  // 정규화된 언어 값을 화면 표시용으로 변환하는 함수를 정의한다.
  const languageMap: Record<string, string> = {
    // 자주 쓰는 언어명을 보기 좋게 매핑한다.
    python: "Python", // python을 Python으로 표시한다.
    python3: "Python", // python3를 Python으로 표시한다.
    javascript: "JavaScript", // javascript를 JavaScript로 표시한다.
    typescript: "TypeScript", // typescript를 TypeScript로 표시한다.
    java: "Java", // java를 Java로 표시한다.
    cpp: "C++", // cpp를 C++로 표시한다.
    "c++": "C++", // c++를 C++로 표시한다.
    c: "C", // c를 C로 표시한다.
    go: "Go", // go를 Go로 표시한다.
    rust: "Rust", // rust를 Rust로 표시한다.
    kotlin: "Kotlin", // kotlin을 Kotlin으로 표시한다.
    swift: "Swift", // swift를 Swift로 표시한다.
    unknown: "알 수 없음", // unknown을 알 수 없음으로 표시한다.
  }; // languageMap 정의를 종료한다.

  return languageMap[language] ?? language.toUpperCase(); // 매핑이 있으면 매핑값을 쓰고 없으면 대문자로 표시한다.
} // formatLanguage 함수를 종료한다.

function buildLanguageStats(
  rows: LanguageUsageRow[],
  myLanguage?: string | null,
) {
  // 언어별 통계를 계산하는 함수를 정의한다.
  const myNormalizedLanguage = normalizeLanguage(myLanguage); // 내 제출 언어를 정규화한다.

  const uniqueMap = new Map<string, string>(); // 같은 유저가 같은 언어로 여러 번 맞힌 것을 중복 제거하기 위한 Map을 만든다.

  rows.forEach((row, index) => {
    // 다른 유저 정답 제출 row를 순회한다.
    const normalizedLanguage = normalizeLanguage(row.language); // row의 언어를 정규화한다.

    const uniqueKey = row.user_id // user_id가 있는지 확인한다.
      ? `${row.user_id}:${normalizedLanguage}` // user_id가 있으면 유저와 언어 조합으로 중복 제거 key를 만든다.
      : `${index}:${normalizedLanguage}`; // user_id가 없으면 row 단위로 집계한다.

    uniqueMap.set(uniqueKey, normalizedLanguage); // 중복 제거 Map에 언어를 저장한다.
  }); // rows 순회를 종료한다.

  const countMap = new Map<string, number>(); // 언어별 count를 저장할 Map을 만든다.

  Array.from(uniqueMap.values()).forEach((language) => {
    // 중복 제거된 언어 목록을 순회한다.
    countMap.set(language, (countMap.get(language) ?? 0) + 1); // 해당 언어 count를 1 증가시킨다.
  }); // 언어 count 순회를 종료한다.

  const totalCount = Array.from(countMap.values()).reduce(
    (sum, count) => sum + count,
    0,
  ); // 전체 언어 사용 수를 계산한다.

  return Array.from(countMap.entries()) // countMap을 배열로 변환한다.
    .map(([language, count]): LanguageStat => {
      // 각 언어별 통계를 화면용 객체로 변환한다.
      const percentage =
        totalCount === 0 ? 0 : Math.round((count / totalCount) * 1000) / 10; // 전체 대비 비율을 소수점 첫째 자리까지 계산한다.

      return {
        // 언어 통계 객체를 반환한다.
        language: formatLanguage(language), // 화면용 언어 이름을 저장한다.
        count, // 해당 언어 사용 수를 저장한다.
        percentage, // 해당 언어 비율을 저장한다.
        isMine: language === myNormalizedLanguage, // 내 언어와 같은지 저장한다.
      }; // 언어 통계 객체 반환을 종료한다.
    }) // map 변환을 종료한다.
    .sort((a, b) => b.count - a.count); // 많이 사용한 언어 순으로 정렬한다.
} // buildLanguageStats 함수를 종료한다.

export default function CompareOthersLanguage({
  rows,
  myLanguage,
}: CompareOthersLanguageProps) {
  // 다른 유저 언어 비교 컴포넌트를 정의한다.
  const languageStats = buildLanguageStats(rows, myLanguage); // props로 받은 row를 언어별 통계로 변환한다.

  const totalCount = languageStats.reduce((sum, stat) => sum + stat.count, 0); // 전체 비교 대상 수를 계산한다.

  return (
    // 컴포넌트 JSX를 반환한다.
    <section className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-white/5 dark:bg-zinc-900">
      {" "}
      {/* 언어 비교 카드 컨테이너를 렌더링한다. */}
      <div className="mb-6 flex items-center gap-3">
        {" "}
        {/* 카드 헤더 영역을 렌더링한다. */}
        <div className="rounded-lg bg-violet-500/10 p-2">
          {" "}
          {/* 아이콘 배경을 렌더링한다. */}
          <Code2 className="h-5 w-5 text-violet-500" />{" "}
          {/* 코드 아이콘을 렌더링한다. */}
        </div>{" "}
        {/* 아이콘 배경을 종료한다. */}
        <div>
          {" "}
          {/* 제목과 설명 영역을 렌더링한다. */}
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            {" "}
            {/* 카드 제목을 렌더링한다. */}
            다른 사람들의 풀이 언어 {/* 카드 제목 텍스트를 출력한다. */}
          </h3>{" "}
          {/* 카드 제목을 종료한다. */}
          <p className="text-xs text-zinc-500">
            {" "}
            {/* 카드 설명을 렌더링한다. */}
            같은 문제의 정답 제출 기준 {/* 카드 설명 텍스트를 출력한다. */}
          </p>{" "}
          {/* 카드 설명을 종료한다. */}
        </div>{" "}
        {/* 제목과 설명 영역을 종료한다. */}
      </div>{" "}
      {/* 카드 헤더 영역을 종료한다. */}
      {languageStats.length === 0 ? ( // 비교할 언어 통계가 없는지 확인한다.
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-200 text-center text-sm text-zinc-400 dark:border-white/10">
          {" "}
          {/* 빈 상태 영역을 렌더링한다. */}
          아직 비교 가능한 다른 정답 제출이 없습니다.{" "}
          {/* 빈 상태 문구를 출력한다. */}
        </div> // 빈 상태 영역을 종료한다.
      ) : (
        // 비교할 언어 통계가 있는 경우를 처리한다.
        <div className="space-y-4">
          {" "}
          {/* 언어 통계 목록 wrapper를 렌더링한다. */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            {" "}
            {/* 요약 정보 영역을 렌더링한다. */}
            <span>비교 대상</span> {/* 비교 대상 라벨을 출력한다. */}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {totalCount.toLocaleString()}/건
            </span>{" "}
            {/* 전체 비교 대상 수를 출력한다. */}
          </div>{" "}
          {/* 요약 정보 영역을 종료한다. */}
          {languageStats.map(
            (
              stat, // 언어별 통계 row를 순회한다.
            ) => (
              <div key={stat.language} className="space-y-2">
                {" "}
                {/* 언어별 row wrapper를 렌더링한다. */}
                <div className="flex items-center justify-between gap-3">
                  {" "}
                  {/* 언어명과 수치 영역을 렌더링한다. */}
                  <div className="flex min-w-0 items-center gap-2">
                    {" "}
                    {/* 언어명 영역을 렌더링한다. */}
                    <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {" "}
                      {/* 언어명을 렌더링한다. */}
                      {stat.language} {/* 언어명을 출력한다. */}
                    </span>{" "}
                    {/* 언어명 span을 종료한다. */}
                    {stat.isMine && ( // 내 제출 언어와 같은지 확인한다.
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-500/10">
                        {" "}
                        {/* 내 언어 배지를 렌더링한다. */}내 언어{" "}
                        {/* 내 언어 텍스트를 출력한다. */}
                      </span> // 내 언어 배지를 종료한다.
                    )}{" "}
                    {/* 내 언어 조건부 렌더링을 종료한다. */}
                  </div>{" "}
                  {/* 언어명 영역을 종료한다. */}
                  <div className="shrink-0 text-right text-xs text-zinc-500">
                    {" "}
                    {/* 수치 영역을 렌더링한다. */}
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {stat.percentage}%
                    </span>{" "}
                    {/* 비율을 출력한다. */}
                    <span className="ml-1">
                      ({stat.count.toLocaleString()})
                    </span>{" "}
                    {/* count를 출력한다. */}
                  </div>{" "}
                  {/* 수치 영역을 종료한다. */}
                </div>{" "}
                {/* 언어명과 수치 영역을 종료한다. */}
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                  {" "}
                  {/* 막대 배경을 렌더링한다. */}
                  <div // 실제 비율 막대를 렌더링한다.
                    className={
                      stat.isMine
                        ? "h-full rounded-full bg-blue-600"
                        : "h-full rounded-full bg-violet-400"
                    } // 내 언어면 파란색, 아니면 보라색 막대로 표시한다.
                    style={{ width: `${Math.max(stat.percentage, 2)}%` }} // 너무 작은 값도 보이도록 최소 너비를 2%로 설정한다.
                  />{" "}
                  {/* 비율 막대를 종료한다. */}
                </div>{" "}
                {/* 막대 배경을 종료한다. */}
              </div> // 언어별 row wrapper를 종료한다.
            ),
          )}{" "}
          {/* 언어별 통계 row 순회를 종료한다. */}
        </div> // 언어 통계 목록 wrapper를 종료한다.
      )}{" "}
      {/* 조건부 렌더링을 종료한다. */}
    </section> // 언어 비교 카드 컨테이너를 종료한다.
  ); // JSX 반환을 종료한다.
} // CompareOthersLanguage 컴포넌트를 종료한다.
