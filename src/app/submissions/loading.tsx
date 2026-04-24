// 제출 내역 페이지 로딩 스켈레톤
export default function SubmissionsLoading() {
  return (
    <div className="container mx-auto px-6 pt-12 pb-24 max-w-6xl">
      <div className="mb-12">
        <div className="h-12 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-4" />
        <div className="h-5 w-72 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              {["ID", "문제", "언어", "결과", "시간", "메모리", "제출 시각"].map((h) => (
                <th key={h} className="px-6 py-4 text-left">
                  <div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-36 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-6 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
