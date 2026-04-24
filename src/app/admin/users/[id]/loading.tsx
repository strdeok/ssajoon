// 관리자 유저 상세 페이지 로딩 스켈레톤
export default function AdminUserDetailLoading() {
  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 프로필 카드 스켈레톤 */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
            </div>
            <div className="space-y-3 flex flex-col items-center">
              <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
                  <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mx-auto mb-1" />
                  <div className="h-3 w-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 히스토리 스켈레톤 */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-9 w-52 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
