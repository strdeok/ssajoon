// 관리자 문제 목록 로딩 스켈레톤
export default function AdminProblemsLoading() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-56 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
      </div>

      {/* 테이블 스켈레톤 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                {["ID", "카테고리", "제목", "난이도", "상태", "생성일", "관리"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left">
                    <div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="h-4 w-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
