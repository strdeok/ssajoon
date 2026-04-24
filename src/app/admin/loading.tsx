// 관리자 대시보드 로딩 스켈레톤
export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* 헤더 스켈레톤 */}
      <div>
        <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>

      {/* 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 바로가기 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
