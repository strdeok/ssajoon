import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Flame,
  ChevronRight,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import {
  DifficultyBadge,
  StatusIcon,
  StatusLabel,
} from "@/components/problem/ProblemComponents";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ProblemRow = {
  // 홈 화면 최근 문제 목록에서 사용할 문제 row 타입을 정의한다.
  id: number; // problems.id 값이며, 현재 서비스에서는 문제 번호 역할도 한다.
  title: string; // 문제 제목이다.
  difficulty: string | null; // 문제 난이도다.
  description: string | null; // 문제 설명이다.
  category: string | null; // 문제 카테고리다.
  created_at: string | null; // 문제 생성일이다.
}; // ProblemRow 타입 정의를 종료한다.

type JoinedProblem =
  | {
      // submissions에서 join된 problems 타입을 정의한다.
      title: string | null; // join된 문제 제목이다.
    }
  | {
      // Supabase join 결과가 배열로 올 수도 있어서 배열 요소 타입도 허용한다.
      title: string | null; // join된 문제 제목이다.
    }[]
  | null; // join 실패 또는 관계 없음인 경우 null을 허용한다.

type SubmissionRow = {
  // 홈 화면 최근 제출 목록과 통계 계산에 사용할 제출 row 타입을 정의한다.
  id: number; // 제출 id다.
  problem_id: number; // 제출이 연결된 문제 id다.
  language: string | null; // 제출 언어다.
  result: string | null; // 채점 결과다.
  submitted_at: string | null; // 제출 시간이다.
  problems: JoinedProblem; // join된 문제 정보다.
}; // SubmissionRow 타입 정의를 종료한다.

type SubmissionItem = SubmissionRow & {
  // 화면 표시용 제출 타입을 정의한다.
  problem_title: string; // 화면에 표시할 문제 제목이다.
}; // SubmissionItem 타입 정의를 종료한다.

type HomeStats = {
  // 홈 화면 사용자 통계 타입을 정의한다.
  solved: number; // 지금까지 맞힌 서로 다른 문제 수다.
  accuracy: number; // 제출 기준 정답률이다.
  recentCount: number; // 최근 7일 제출 수다.
  streakDays: number; // 연속 제출 일수다.
}; // HomeStats 타입 정의를 종료한다.

const ACCEPTED_RESULTS = new Set(["AC", "ACCEPTED"]); // 정답으로 인정할 result 값을 정의한다.

function normalizeResult(result: string | null | undefined) {
  // result 값을 비교 가능하도록 정규화하는 함수를 정의한다.
  return (result ?? "").trim().toUpperCase(); // null을 빈 문자열로 바꾸고 공백 제거 후 대문자로 변환한다.
} // normalizeResult 함수를 종료한다.

function isAcceptedResult(result: string | null | undefined) {
  // 제출 결과가 정답인지 판단하는 함수를 정의한다.
  return ACCEPTED_RESULTS.has(normalizeResult(result)); // 정규화된 result가 정답 Set에 포함되는지 확인한다.
} // isAcceptedResult 함수를 종료한다.

function isUndefinedColumnError(error: unknown) {
  // Supabase/PostgREST의 undefined column 에러인지 확인하는 함수를 정의한다.
  return (
    // boolean 값을 반환한다.
    typeof error === "object" && // error가 객체인지 확인한다.
    error !== null && // null이 아닌지 확인한다.
    "code" in error && // code 속성이 있는지 확인한다.
    (error as { code?: string }).code === "42703" // PostgreSQL undefined_column 코드인지 확인한다.
  ); // return을 종료한다.
} // isUndefinedColumnError 함수를 종료한다.

function getProblemTitle(joinedProblem: JoinedProblem, problemId: number) {
  // join된 문제 정보에서 제목을 안전하게 꺼내는 함수를 정의한다.
  const problem = Array.isArray(joinedProblem)
    ? joinedProblem[0]
    : joinedProblem; // join 결과가 배열이면 첫 번째 값을 사용하고, 객체면 그대로 사용한다.
  return problem?.title || `문제 #${problemId}`; // 제목이 없으면 문제 id 기반 fallback을 반환한다.
} // getProblemTitle 함수를 종료한다.

function getDateKey(date: Date) {
  // 날짜를 일 단위 비교용 key로 변환하는 함수를 정의한다.
  return date.toISOString().slice(0, 10); // ISO 문자열에서 yyyy-mm-dd 부분만 잘라 반환한다.
} // getDateKey 함수를 종료한다.

function calculateStreakDays(submissions: SubmissionRow[]) {
  // 제출 기록을 기준으로 연속 제출 일수를 계산하는 함수를 정의한다.
  const submissionDateKeys = new Set( // 제출 날짜 중복 제거용 Set을 만든다.
    submissions // 제출 목록을 순회한다.
      .filter((submission) => submission.submitted_at) // 제출 시간이 있는 row만 남긴다.
      .map((submission) =>
        getDateKey(new Date(submission.submitted_at as string)),
      ), // 제출 시간을 yyyy-mm-dd key로 변환한다.
  ); // Set 생성을 종료한다.

  let streak = 0; // 연속 일수를 0으로 초기화한다.
  const checkDate = new Date(); // 오늘 날짜부터 검사하기 위한 Date 객체를 만든다.

  if (!submissionDateKeys.has(getDateKey(checkDate))) {
    // 오늘 제출이 없는 경우를 확인한다.
    checkDate.setDate(checkDate.getDate() - 1); // 오늘 아직 제출 안 했을 수 있으므로 어제부터 검사한다.
  } // 오늘 제출 여부 조건문을 종료한다.

  while (submissionDateKeys.has(getDateKey(checkDate))) {
    // 현재 검사 날짜에 제출이 있는 동안 반복한다.
    streak += 1; // 연속 일수를 1 증가시킨다.
    checkDate.setDate(checkDate.getDate() - 1); // 하루 전 날짜로 이동한다.
  } // while 반복문을 종료한다.

  return streak; // 계산된 연속 제출 일수를 반환한다.
} // calculateStreakDays 함수를 종료한다.

async function getVisibleProblemsCount(supabase: ServerSupabaseClient) {
  // 공개 문제 수를 조회하는 함수를 정의한다.
  const query = supabase // Supabase 쿼리를 시작한다.
    .from("problems") // problems 테이블을 조회한다.
    .select("*", { count: "exact", head: true }) // row는 받지 않고 정확한 count만 가져온다.
    .eq("is_deleted", false) // soft delete 되지 않은 문제만 대상으로 한다.
    .eq("is_hidden", false); // 공개 문제만 대상으로 한다.

  const { count, error } = await query; // 쿼리를 실행하고 count와 error를 받는다.

  if (!error) return count ?? 0; // 에러가 없으면 count를 반환한다.

  if (isUndefinedColumnError(error)) {
    // is_hidden 컬럼이 아직 없는 환경인지 확인한다.
    console.error(
      "problems.is_hidden 컬럼이 없어 공개 문제 수 조회를 fallback 처리합니다.",
      error,
    ); // 컬럼 누락 문제를 서버 콘솔에 출력한다.

    const { count: fallbackCount, error: fallbackError } = await supabase // is_hidden 조건 없이 fallback count를 조회한다.
      .from("problems") // problems 테이블을 조회한다.
      .select("*", { count: "exact", head: true }) // row는 받지 않고 정확한 count만 가져온다.
      .eq("is_deleted", false); // 삭제되지 않은 문제만 대상으로 한다.

    if (fallbackError) {
      // fallback 조회도 실패했는지 확인한다.
      console.error("공개 문제 수 fallback 조회 실패:", fallbackError); // fallback 에러를 출력한다.
      return 0; // 실패 시 0을 반환한다.
    } // fallback 에러 조건문을 종료한다.

    return fallbackCount ?? 0; // fallback count를 반환한다.
  } // undefined column 조건문을 종료한다.

  console.error("공개 문제 수 조회 실패:", error); // 일반 조회 에러를 출력한다.
  return 0; // 실패 시 0을 반환한다.
} // getVisibleProblemsCount 함수를 종료한다.

async function getRecentVisibleProblems(supabase: ServerSupabaseClient) {
  // 최근 공개 문제 목록을 조회하는 함수를 정의한다.
  const { data, error } = await supabase // Supabase 쿼리를 실행한다.
    .from("problems") // problems 테이블을 조회한다.
    .select("id, title, difficulty, description, category, created_at") // 홈 화면에 필요한 컬럼만 조회한다.
    .eq("is_deleted", false) // 삭제되지 않은 문제만 조회한다.
    .eq("is_hidden", false) // 공개된 문제만 조회한다.
    .order("created_at", { ascending: false, nullsFirst: false }) // 최근 생성된 문제 순으로 정렬한다.
    .limit(10); // 최대 10개만 가져온다.

  if (!error) return (data ?? []) as ProblemRow[]; // 에러가 없으면 문제 목록을 반환한다.

  if (isUndefinedColumnError(error)) {
    // is_hidden 컬럼이 아직 없는 환경인지 확인한다.
    console.error(
      "problems.is_hidden 컬럼이 없어 최근 문제 조회를 fallback 처리합니다.",
      error,
    ); // 컬럼 누락 문제를 서버 콘솔에 출력한다.

    const { data: fallbackData, error: fallbackError } = await supabase // is_hidden 조건 없이 fallback 조회를 실행한다.
      .from("problems") // problems 테이블을 조회한다.
      .select("id, title, difficulty, description, category, created_at") // 홈 화면에 필요한 컬럼만 조회한다.
      .eq("is_deleted", false) // 삭제되지 않은 문제만 조회한다.
      .order("created_at", { ascending: false, nullsFirst: false }) // 최근 생성 순으로 정렬한다.
      .limit(10); // 최대 10개만 가져온다.

    if (fallbackError) {
      // fallback 조회도 실패했는지 확인한다.
      console.error("최근 문제 fallback 조회 실패:", fallbackError); // fallback 에러를 출력한다.
      return []; // 실패 시 빈 배열을 반환한다.
    } // fallback 에러 조건문을 종료한다.

    return (fallbackData ?? []) as ProblemRow[]; // fallback 문제 목록을 반환한다.
  } // undefined column 조건문을 종료한다.

  console.error("최근 공개 문제 조회 실패:", error); // 일반 조회 에러를 출력한다.
  return []; // 실패 시 빈 배열을 반환한다.
} // getRecentVisibleProblems 함수를 종료한다.

async function getUserSubmissions(
  supabase: ServerSupabaseClient,
  userId: string,
) {
  // 현재 유저 제출 목록을 조회하는 함수를 정의한다.
  const { data, error } = await supabase // Supabase 쿼리를 실행한다.
    .from("submissions") // submissions 테이블을 조회한다.
    .select("id, problem_id, language, result, submitted_at, problems(title)") // 제출 목록과 문제 제목을 함께 조회한다.
    .eq("user_id", userId) // 현재 로그인한 유저의 제출만 조회한다.
    .eq("is_deleted", false) // 삭제되지 않은 제출만 조회한다.
    .order("submitted_at", { ascending: false, nullsFirst: false }); // 최신 제출 순으로 정렬한다.

  if (error) {
    // 조회 에러가 있는지 확인한다.
    console.error("유저 제출 목록 조회 실패:", error); // Supabase 에러를 서버 콘솔에 출력한다.
    return []; // 실패 시 빈 배열을 반환한다.
  } // 에러 조건문을 종료한다.

  return (data ?? []) as SubmissionRow[]; // 조회된 제출 목록을 반환한다.
} // getUserSubmissions 함수를 종료한다.

function calculateUserStats(allSubmissions: SubmissionRow[]) {
  // 유저 제출 통계를 계산하는 함수를 정의한다.
  const total = allSubmissions.length; // 전체 제출 수를 계산한다.
  const acceptedSubmissions = allSubmissions.filter((submission) =>
    isAcceptedResult(submission.result),
  ); // 정답 제출만 필터링한다.
  const uniqueSolved = new Set(
    acceptedSubmissions.map((submission) => submission.problem_id),
  ).size; // 정답을 받은 서로 다른 문제 수를 계산한다.
  const now = new Date(); // 현재 시간을 만든다.
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7일 전 시간을 계산한다.
  const recentCount = allSubmissions.filter((submission) => {
    // 최근 7일 제출 수를 계산하기 위해 필터링한다.
    if (!submission.submitted_at) return false; // 제출 시간이 없으면 최근 제출로 보지 않는다.
    return new Date(submission.submitted_at) > sevenDaysAgo; // 제출 시간이 7일 전보다 이후인지 확인한다.
  }).length; // 최근 7일 제출 수를 얻는다.

  return {
    // 계산된 통계 객체를 반환한다.
    solved: uniqueSolved, // 해결한 문제 수를 반환한다.
    accuracy:
      total > 0 ? Math.round((acceptedSubmissions.length / total) * 100) : 0, // 제출 기준 정답률을 계산한다.
    recentCount, // 최근 7일 제출 수를 반환한다.
    streakDays: calculateStreakDays(allSubmissions), // 연속 제출 일수를 계산해서 반환한다.
  } satisfies HomeStats; // HomeStats 타입을 만족하는지 확인한다.
} // calculateUserStats 함수를 종료한다.

async function getData() {
  // 홈 화면에 필요한 모든 데이터를 조회하는 함수를 정의한다.
  const supabase = await createClient(); // 서버 Supabase 클라이언트를 생성한다.

  const { data: authData, error: authError } = await supabase.auth.getUser(); // 현재 로그인 유저 정보를 조회한다.

  if (authError) {
    // 유저 조회 에러가 있는지 확인한다.
    console.error("홈 유저 조회 실패:", authError); // 유저 조회 에러를 서버 콘솔에 출력한다.
  } // 유저 조회 에러 조건문을 종료한다.

  const user = authData.user; // 현재 로그인 유저 객체를 꺼낸다.
  const totalProblemsCount = await getVisibleProblemsCount(supabase); // 공개 문제 수를 조회한다.
  const recentProblems = await getRecentVisibleProblems(supabase); // 최근 공개 문제 목록을 조회한다.

  let submissions: SubmissionItem[] = []; // 화면에 표시할 최근 제출 목록을 빈 배열로 초기화한다.
  let stats: HomeStats = {
    solved: 0,
    accuracy: 0,
    recentCount: 0,
    streakDays: 0,
  }; // 기본 통계를 0으로 초기화한다.

  if (user) {
    // 로그인한 유저가 있는지 확인한다.
    const allSubmissions = await getUserSubmissions(supabase, user.id); // 현재 유저의 제출 목록을 조회한다.
    stats = calculateUserStats(allSubmissions); // 제출 목록을 기반으로 유저 통계를 계산한다.
    submissions = allSubmissions.slice(0, 6).map((submission) => ({
      // 최근 제출 6개만 화면용으로 변환한다.
      ...submission, // 원본 제출 데이터를 유지한다.
      problem_title: getProblemTitle(
        submission.problems,
        submission.problem_id,
      ), // 문제 제목 fallback을 적용한다.
    })); // 제출 목록 변환을 종료한다.
  } // 로그인 유저 조건문을 종료한다.

  return { user, totalProblemsCount, recentProblems, submissions, stats }; // 홈 화면 데이터를 반환한다.
} // getData 함수를 종료한다.

export default async function Home() {
  // 홈 페이지 서버 컴포넌트를 정의한다.
  const { user, totalProblemsCount, recentProblems, submissions, stats } =
    await getData(); // 홈 화면에 필요한 데이터를 서버에서 조회한다.

  const statCards = [
    // 홈 화면 통계 카드 데이터를 정의한다.
    {
      // 푼 문제 카드 데이터다.
      icon: <Trophy className="w-5 h-5 text-blue-500" />, // 카드 아이콘이다.
      label: "푼 문제", // 카드 라벨이다.
      value: user ? stats.solved : "-", // 로그인 유저면 푼 문제 수, 아니면 대시를 표시한다.
      unit: "문제", // 단위다.
      bg: "bg-blue-50", // 아이콘 배경 색상이다.
    }, // 푼 문제 카드 데이터 종료다.
    {
      // 정답률 카드 데이터다.
      icon: <BarChart2 className="w-5 h-5 text-emerald-500" />, // 카드 아이콘이다.
      label: "정답률", // 카드 라벨이다.
      value: user ? stats.accuracy : "-", // 로그인 유저면 정답률, 아니면 대시를 표시한다.
      unit: "%", // 단위다.
      bg: "bg-emerald-50", // 아이콘 배경 색상이다.
    }, // 정답률 카드 데이터 종료다.
    {
      // 최근 7일 제출 카드 데이터다.
      icon: <TrendingUp className="w-5 h-5 text-violet-500" />, // 카드 아이콘이다.
      label: "최근 7일 제출", // 카드 라벨이다.
      value: user ? stats.recentCount : "-", // 로그인 유저면 최근 7일 제출 수, 아니면 대시를 표시한다.
      unit: "회", // 단위다.
      bg: "bg-violet-50", // 아이콘 배경 색상이다.
    }, // 최근 7일 제출 카드 데이터 종료다.
    {
      // 총 문제 수 카드 데이터다.
      icon: <BookOpen className="w-5 h-5 text-amber-500" />, // 카드 아이콘이다.
      label: "총 문제 수", // 카드 라벨이다.
      value: totalProblemsCount, // 공개 문제 수를 표시한다.
      unit: "문제", // 단위다.
      bg: "bg-amber-50", // 아이콘 배경 색상이다.
    }, // 총 문제 수 카드 데이터 종료다.
  ]; // 통계 카드 배열을 종료한다.

  return (
    // 홈 페이지 JSX를 반환한다.
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-zinc-950 transition-colors duration-300">
      {" "}
      {/* 전체 페이지 배경을 렌더링한다. */}
      <section className="relative overflow-hidden mx-6 mt-6 rounded-xl h-[400px] bg-[#253EEB] dark:bg-indigo-700 flex items-center shadow-2xl shadow-blue-500/10">
        {" "}
        {/* 히어로 섹션을 렌더링한다. */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5 select-none pointer-events-none overflow-hidden">
          {" "}
          {/* 코드 텍스처 오버레이를 렌더링한다. */}
          <pre className="text-[11px] text-white leading-5 font-mono p-8 whitespace-pre-wrap break-all">
            {" "}
            {/* 코드 느낌의 배경 텍스트를 렌더링한다. */}
            {`def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i
    return []

def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`}
          </pre>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#253EEB] via-[#253EEB]/80 to-transparent dark:from-indigo-700 dark:via-indigo-700/80" />{" "}
        {/* 왼쪽에서 오른쪽으로 흐르는 그라데이션을 렌더링한다. */}
        <div className="relative z-10 px-12 max-w-xl">
          {" "}
          {/* 히어로 콘텐츠 영역을 렌더링한다. */}
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            {" "}
            {/* 히어로 배지를 렌더링한다. */}
            <Flame className="w-3.5 h-3.5" /> {/* 불꽃 아이콘을 렌더링한다. */}
            알고리즘 마스터의 시작 {/* 배지 텍스트를 렌더링한다. */}
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            {" "}
            {/* 히어로 제목을 렌더링한다. */}
            코딩 실력을
            <br />한 단계 끌어올리세요 {/* 제목 문구를 렌더링한다. */}
          </h1>
          <p className="text-blue-100 text-base leading-relaxed mb-8 opacity-90">
            {" "}
            {/* 히어로 설명을 렌더링한다. */}
            체계적으로 큐레이션된 알고리즘 문제들로
            <br />
            실전 감각을 키우고 코딩 역량을 성장시키세요.{" "}
            {/* 설명 문구를 렌더링한다. */}
          </p>
          <div className="flex items-center gap-3">
            {" "}
            {/* CTA 버튼 그룹을 렌더링한다. */}
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              {" "}
              {/* 문제 목록으로 이동하는 CTA 링크다. */}
              문제 풀기 시작 {/* CTA 텍스트를 렌더링한다. */}
              <ArrowRight className="w-4 h-4" />{" "}
              {/* 오른쪽 화살표 아이콘을 렌더링한다. */}
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
            >
              {" "}
              {/* 문제 생성 페이지로 이동하는 CTA 링크다. */}
              AI 문제 생성 {/* CTA 텍스트를 렌더링한다. */}
            </Link>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mx-6 mt-6">
        {" "}
        {/* 통계 카드 섹션을 렌더링한다. */}
        {statCards.map(
          (
            { icon, label, value, unit, bg }, // 통계 카드 데이터를 순회한다.
          ) => (
            <div
              key={label}
              className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-lg p-6 flex flex-col gap-2 shadow-sm transition-all hover:shadow-md"
            >
              {" "}
              {/* 통계 카드 하나를 렌더링한다. */}
              <div className="flex items-center justify-between">
                {" "}
                {/* 카드 상단 라벨/아이콘 영역을 렌더링한다. */}
                <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                  {label}
                </span>{" "}
                {/* 카드 라벨을 렌더링한다. */}
                <div className={`p-2 rounded-lg ${bg} dark:bg-opacity-10`}>
                  {icon}
                </div>{" "}
                {/* 아이콘 배경과 아이콘을 렌더링한다. */}
              </div>
              <div className="flex items-baseline gap-1">
                {" "}
                {/* 카드 값 영역을 렌더링한다. */}
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </span>{" "}
                {/* 숫자는 천 단위 콤마로 표시한다. */}
                <span className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
                  {unit}
                </span>{" "}
                {/* 단위를 렌더링한다. */}
              </div>
            </div>
          ),
        )}
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-6 mt-6 mb-8">
        {" "}
        {/* 메인 콘텐츠 그리드를 렌더링한다. */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {" "}
          {/* 최근 문제 목록 영역을 렌더링한다. */}
          <div className="flex items-center justify-between">
            {" "}
            {/* 최근 문제 섹션 헤더를 렌더링한다. */}
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              최근 추가된 문제
            </h2>{" "}
            {/* 섹션 제목을 렌더링한다. */}
            <Link
              href="/problems"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              {" "}
              {/* 전체 문제 목록 링크를 렌더링한다. */}
              전체 보기 <ChevronRight className="w-4 h-4" />{" "}
              {/* 링크 텍스트와 아이콘을 렌더링한다. */}
            </Link>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-lg overflow-hidden">
            {" "}
            {/* 최근 문제 테이블 카드 컨테이너를 렌더링한다. */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#F8FAFC] dark:bg-zinc-800/50 border-b border-[#E2E8F0] dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              {" "}
              {/* 테이블 헤더를 렌더링한다. */}
              <div className="col-span-1">#</div>{" "}
              {/* 문제 id 헤더를 렌더링한다. */}
              <div className="col-span-6">문제 제목</div>{" "}
              {/* 문제 제목 헤더를 렌더링한다. */}
              <div className="col-span-2">난이도</div>{" "}
              {/* 난이도 헤더를 렌더링한다. */}
              <div className="col-span-3 text-right">풀기</div>{" "}
              {/* 풀기 헤더를 렌더링한다. */}
            </div>
            {recentProblems.length === 0 ? ( // 최근 문제가 없는지 확인한다.
              <div className="py-16 text-center text-zinc-400 text-sm">
                등록된 문제가 없습니다.
              </div> // 빈 문제 상태를 렌더링한다.
            ) : (
              // 최근 문제가 있는 경우를 처리한다.
              recentProblems.map(
                (
                  problem, // 최근 문제 목록을 순회한다.
                ) => (
                  <Link
                    href={`/problems/${problem.id}`}
                    key={problem.id}
                    className="group grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-[#E2E8F0] dark:border-zinc-800 last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {" "}
                    {/* 문제 상세 페이지로 이동하는 row를 렌더링한다. */}
                    <div className="col-span-1 text-sm text-zinc-400 font-medium">
                      {problem.id}
                    </div>{" "}
                    {/* problem_no 대신 id를 문제 번호처럼 표시한다. */}
                    <div className="col-span-6">
                      {" "}
                      {/* 문제 제목/설명 영역을 렌더링한다. */}
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {problem.title}
                      </p>{" "}
                      {/* 문제 제목을 렌더링한다. */}
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1">
                        {problem.description ||
                          problem.category ||
                          "설명이 없습니다."}
                      </p>{" "}
                      {/* 문제 설명 또는 카테고리를 fallback으로 렌더링한다. */}
                    </div>
                    <div className="col-span-2">
                      {" "}
                      {/* 난이도 영역을 렌더링한다. */}
                      <DifficultyBadge difficulty={problem.difficulty} />{" "}
                      {/* 난이도 배지를 렌더링한다. */}
                    </div>
                    <div className="col-span-3 flex justify-end">
                      {" "}
                      {/* 풀기 버튼 영역을 렌더링한다. */}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-all">
                        {" "}
                        {/* 풀기 pill 버튼을 렌더링한다. */}
                        풀기 <ChevronRight className="w-3.5 h-3.5" />{" "}
                        {/* 풀기 텍스트와 아이콘을 렌더링한다. */}
                      </span>
                    </div>
                  </Link>
                ),
              )
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {" "}
          {/* 최근 제출 현황 영역을 렌더링한다. */}
          <div className="flex items-center justify-between">
            {" "}
            {/* 최근 제출 섹션 헤더를 렌더링한다. */}
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              최근 제출 현황
            </h2>{" "}
            {/* 섹션 제목을 렌더링한다. */}
            {user && ( // 로그인한 유저에게만 전체 제출 링크를 보여준다.
              <Link
                href="/submissions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
              >
                {" "}
                {/* 제출 기록 전체 링크를 렌더링한다. */}
                전체 <ChevronRight className="w-4 h-4" />{" "}
                {/* 링크 텍스트와 아이콘을 렌더링한다. */}
              </Link>
            )}
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-lg overflow-hidden flex-1">
            {" "}
            {/* 최근 제출 카드 컨테이너를 렌더링한다. */}
            {!user ? ( // 로그인하지 않은 경우를 확인한다.
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                {" "}
                {/* 로그인 안내 영역을 렌더링한다. */}
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  {" "}
                  {/* 로그인 안내 아이콘 배경을 렌더링한다. */}
                  <Trophy className="w-7 h-7 text-blue-400" />{" "}
                  {/* 트로피 아이콘을 렌더링한다. */}
                </div>
                <div>
                  {" "}
                  {/* 로그인 안내 텍스트 영역을 렌더링한다. */}
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    로그인하고 내 제출 현황을 확인하세요
                  </p>{" "}
                  {/* 로그인 안내 제목을 렌더링한다. */}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    나의 알고리즘 성장 과정을 기록하세요
                  </p>{" "}
                  {/* 로그인 안내 설명을 렌더링한다. */}
                </div>
                <Link
                  href="/login"
                  className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  로그인
                </Link>{" "}
                {/* 로그인 페이지 링크를 렌더링한다. */}
              </div>
            ) : submissions.length === 0 ? ( // 로그인했지만 제출이 없는 경우를 확인한다.
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                {" "}
                {/* 빈 제출 상태 영역을 렌더링한다. */}
                <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  {" "}
                  {/* 빈 상태 아이콘 배경을 렌더링한다. */}
                  <BarChart2 className="w-7 h-7 text-zinc-300" />{" "}
                  {/* 빈 상태 아이콘을 렌더링한다. */}
                </div>
                <p className="text-sm text-zinc-400">
                  아직 제출한 문제가 없어요
                </p>{" "}
                {/* 빈 제출 문구를 렌더링한다. */}
                <Link
                  href="/problems"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  첫 문제 풀러 가기 →
                </Link>{" "}
                {/* 문제 목록 이동 링크를 렌더링한다. */}
              </div>
            ) : (
              // 최근 제출이 있는 경우를 처리한다.
              <div className="divide-y divide-[#E2E8F0] dark:divide-zinc-800">
                {" "}
                {/* 제출 row 구분선을 렌더링한다. */}
                {submissions.map(
                  (
                    submission, // 최근 제출 목록을 순회한다.
                  ) => (
                    <Link
                      href={`/submissions/${submission.id}`}
                      key={submission.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      {" "}
                      {/* 제출 상세 페이지로 이동하는 row를 렌더링한다. */}
                      <StatusIcon result={submission.result} />{" "}
                      {/* 제출 결과 아이콘을 렌더링한다. */}
                      <div className="flex-1 min-w-0">
                        {" "}
                        {/* 제출 문제 제목/시간 영역을 렌더링한다. */}
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {submission.problem_title}
                        </p>{" "}
                        {/* 문제 제목을 렌더링한다. */}
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {" "}
                          {/* 제출 시간을 렌더링한다. */}
                          {submission.submitted_at // 제출 시간이 있는지 확인한다.
                            ? new Date(
                                submission.submitted_at,
                              ).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) // 제출 시간이 있으면 한국어 날짜 형식으로 출력한다.
                            : "제출 시간 없음"}{" "}
                          {/* 제출 시간이 없으면 fallback을 출력한다. */}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {" "}
                        {/* 제출 결과/언어 영역을 렌더링한다. */}
                        <StatusLabel result={submission.result} />{" "}
                        {/* 제출 결과 라벨을 렌더링한다. */}
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {submission.language || "-"}
                        </span>{" "}
                        {/* 제출 언어를 렌더링한다. */}
                      </div>
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
