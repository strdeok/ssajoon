import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/auth/isAdmin";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { redirect } from "next/navigation";
import { getKoreanTag } from "@/utils/tagUtils";
import { deleteProblem } from "./actions";
import { DeleteProblemButton } from "@/components/admin/DeleteProblemButton";
import { ToggleHiddenButton } from "@/components/admin/ToggleHiddenButton";
import { AdminProblemSearch } from "@/components/admin/AdminProblemSearch";
import { AdminProblemFilters } from "@/components/admin/AdminProblemFilters";
import { Pagination } from "@/components/common/Pagination";

const PAGE_SIZE = 15;

const DIFFICULTY_MAP: Record<string, string[]> = {
  Easy: ["EASY", "Easy"],
  Medium: ["MEDIUM", "Medium"],
  "Medium-Hard": ["MEDIUM_HARD", "Medium Hard"],
  Hard: ["HARD", "Hard"],
  VeryHard: ["VERY_HARD", "Very Hard"],
};

const createSpaceInsensitiveTitlePattern = (search: string) => {
  const compactSearch = search.replace(/\s+/g, "");

  if (!compactSearch) {
    return "";
  }

  return compactSearch.split("").join("%");
};

type AdminProblemsPageProps = {
  // AdminProblemsPage가 받을 props 타입을 정의합니다.
  searchParams: Promise<{
    // Next.js 15 기준 searchParams는 Promise이므로 Promise 타입으로 정의합니다.
    page?: string; // 현재 페이지 번호 query 값을 정의합니다.
    search?: string; // 검색어 query 값을 정의합니다.
    category?: string; // 카테고리 query 값을 정의합니다.
    difficulty?: string; // 난이도 query 값을 정의합니다.
    status?: string; // 상태 query 값을 정의합니다.
    sort?: string; // 정렬 query 값을 정의합니다.
  }>; // searchParams 타입 정의를 종료합니다.
}; // props 타입 정의를 종료합니다.

export default async function AdminProblemsPage({
  searchParams,
}: AdminProblemsPageProps) {
  // 관리자 문제 페이지 서버 컴포넌트를 정의합니다.
  const admin = await isAdmin(); // 현재 사용자가 관리자인지 확인합니다.
  if (!admin) redirect("/"); // 관리자가 아니면 메인 페이지로 리다이렉트합니다.

  const params = await searchParams; // Promise 형태의 searchParams를 실제 객체로 변환합니다.

  const parsedPage = Number(params.page ?? "1"); // URL의 page 값을 숫자로 변환합니다.
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1; // page 값이 유효하지 않으면 1로 보정합니다.

  const search = params.search ?? ""; // 검색어가 없으면 빈 문자열로 처리합니다.
  const category = params.category ?? "전체"; // 카테고리가 없으면 전체로 처리합니다.
  const difficulty = params.difficulty ?? "전체"; // 난이도가 없으면 전체로 처리합니다.
  const status = params.status ?? "전체"; // 상태가 없으면 전체로 처리합니다.
  const sort = params.sort ?? "newest"; // 정렬 값이 없으면 최신순으로 처리합니다.

  const supabaseAdmin = createAdminClient();

  // 1. Fetch Categories for Filter
  const { data: catData } = await supabaseAdmin
    .from("problems")
    .select("tag1, tag2");

  const tags = new Set<string>();
  catData?.forEach((p) => {
    if (p.tag1) tags.add(p.tag1);
    if (p.tag2) tags.add(p.tag2);
  });
  const categories = Array.from(tags).sort();

  // 2. Build Main Query
  let query = supabaseAdmin
    .from("problems")
    .select("id, title, tag1, tag2, difficulty, created_at, is_deleted", {
      count: "exact",
    });

  // Status Filter
  if (status === "active") {
    query = query.eq("is_deleted", false);
  } else if (status === "deleted") {
    query = query.eq("is_deleted", true);
  }

  // Difficulty Filter
  if (difficulty !== "전체" && DIFFICULTY_MAP[difficulty]) {
    query = query.in("difficulty", DIFFICULTY_MAP[difficulty]);
  }

  // Category Filter
  if (category !== "전체") {
    query = query.or(`tag1.eq.${category},tag2.eq.${category}`);
  }

  // Search Filter
  if (search.trim()) {
    const trimmed = search.trim();
    const num = parseInt(trimmed);
    const compactTitlePattern = createSpaceInsensitiveTitlePattern(trimmed);
    const titleFilters = [
      `title.ilike.%${trimmed}%`,
      compactTitlePattern && compactTitlePattern !== trimmed
        ? `title.ilike.%${compactTitlePattern}%`
        : "",
    ].filter(Boolean);

    if (!isNaN(num)) {
      query = query.or([...titleFilters, `id.eq.${num}`].join(","));
    } else {
      query = query.or(titleFilters.join(","));
    }
  }

  // Sorting
  if (sort === "oldest") {
    query = query.order("id", { ascending: true });
  } else if (sort === "title") {
    query = query.order("title", { ascending: true });
  } else {
    query = query.order("id", { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const {
    data: problems,
    count,
    error: queryError,
  } = await query.range(from, to);

  if (queryError) {
    console.error("Admin Problem Query Error:", queryError);
  }

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            문제 관리
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            등록된 알고리즘 문제를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AdminProblemSearch />
          <Link
            href="/admin/problems/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />새 문제 작성
          </Link>
        </div>
      </div>

      <AdminProblemFilters categories={categories} />

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">알고리즘 태그</th>
                <th className="px-6 py-4 font-semibold">제목</th>
                <th className="px-6 py-4 font-semibold">난이도</th>
                <th className="px-6 py-4 font-semibold">상태</th>
                <th className="px-6 py-4 font-semibold">생성일</th>
                <th className="px-6 py-4 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
              {problems?.map((problem) => (
                <tr
                  key={problem.id}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${problem.is_deleted ? "opacity-50" : ""}`}
                >
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {problem.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold">
                        {getKoreanTag(problem.tag1)}
                      </span>
                      {problem.tag2 && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold">
                          {getKoreanTag(problem.tag2)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{problem.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs font-semibold">
                      {problem.difficulty || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {problem.is_deleted ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        삭제됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        활성
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-500">
                    {new Date(problem.created_at).toLocaleDateString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!problem.is_deleted && (
                        <Link
                          href={`/admin/problems/${problem.id}/edit`}
                          className="p-2 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      <form
                        action={async () => {
                          "use server";
                          await deleteProblem(problem.id);
                        }}
                      >
                        <DeleteProblemButton
                          disabled={problem.is_deleted}
                          title={
                            problem.is_deleted ? "이미 삭제된 문제" : "삭제"
                          }
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {(!problems || problems.length === 0) && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    등록된 문제가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination totalPages={totalPages} currentPage={page} />
      )}
    </div>
  );
}
