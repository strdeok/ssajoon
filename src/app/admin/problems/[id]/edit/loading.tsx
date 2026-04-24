// 관리자 문제 수정 페이지 로딩 스켈레톤
export default function EditProblemLoading() {
  return (
    <div className="pb-12 space-y-8 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* 기본 정보 카드 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-11 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                <div className="h-11 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-1">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
            <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
