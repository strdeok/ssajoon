import Link from "next/link";
import { AlertCircle, CalendarDays, ChevronRight, Sparkles } from "lucide-react";
import { getMyGeneratedProblems, MyGeneratedProblem } from "@/lib/problems/getMyGeneratedProblems";
import { getKoreanTag } from "@/utils/tagUtils";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function GeneratedProblemCard({ item }: { item: MyGeneratedProblem }) {
  const tags = [item.problem.tag1, item.problem.tag2].filter(Boolean);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-[#09090b] dark:hover:border-blue-500/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              No. {item.problem.id}
            </p>
            <h3 className="line-clamp-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {item.problem.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {item.problem.difficulty && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                {item.problem.difficulty}
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {getKoreanTag(tag)}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDate(item.generatedAt)} 생성</span>
          </div>
        </div>

        <Link
          href={`/problems/${item.problem.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-500 sm:mt-1"
        >
          문제 풀기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function GeneratedProblemsSectionSkeleton() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#09090b]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="h-6 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    </section>
  );
}

export async function GeneratedProblemsSection() {
  const result = await getMyGeneratedProblems();

  return (
    <section className="h-148 pb-24 overflow-y-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#09090b]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              내가 생성한 문제
            </h2>
          </div>
        </div>

        <Link
          href="/generate"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          문제 생성
        </Link>
      </div>

      {!result.isLoggedIn && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          로그인 후 생성한 문제를 확인할 수 있습니다.
        </div>
      )}

      {result.isLoggedIn && result.error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{result.error}</span>
        </div>
      )}

      {result.isLoggedIn && !result.error && result.data.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
          <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">
            아직 생성한 문제가 없습니다.
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            원하는 난이도와 태그를 골라 새 문제를 생성해보세요.
          </p>
          <Link
            href="/generate"
            className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-500"
          >
            문제 생성하러 가기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {result.isLoggedIn && !result.error && result.data.length > 0 && (
        <div className="space-y-3 h-full overflow-y-scroll ">
          {result.data.map((item) => (
            <GeneratedProblemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
