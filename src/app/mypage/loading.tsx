// 마이페이지 로딩 스켈레톤
export default function MypageLoading() {
  return (
    <div className="container mx-auto px-6 pt-12 pb-24 max-w-2xl">
      <div className="mb-8">
        <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-56 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>

      {/* 정보 수정 폼 스켈레톤 */}
      <div className="bg-white dark:bg-[#09090b] p-6 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-6 mb-6">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Danger Zone 스켈레톤 */}
      <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-xl border border-red-200 dark:border-red-900/50">
        <div className="h-6 w-28 bg-red-200 dark:bg-red-900/50 rounded animate-pulse mb-2" />
        <div className="h-4 w-full bg-red-100 dark:bg-red-900/30 rounded animate-pulse mb-6" />
        <div className="h-10 w-28 bg-red-200 dark:bg-red-900/50 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
