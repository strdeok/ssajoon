export default function RootLoading() {
  return (
    <div className="container mx-auto px-6 pt-12 pb-24">
      <div className="mb-12">
        <div className="h-12 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-4"></div>
        <div className="h-6 w-96 max-w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-[#09090b] rounded-2xl p-6 border border-zinc-200 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-2 mb-6">
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-white/5">
              <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
