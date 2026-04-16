export default function SubmissionsLoading() {
  return (
    <div className="container mx-auto px-6 pt-12 pb-24">
      <div className="mb-12">
        <div className="h-12 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-4"></div>
        <div className="h-6 w-96 max-w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
      </div>
      
      <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
            <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Language</th>
                <th className="px-6 py-4">Execution Time</th>
                <th className="px-6 py-4">Memory</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-white/5">
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
