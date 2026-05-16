export function EditorSkeleton() {
  return (
    <div className="relative w-full flex-1 h-full min-h-80 rounded-xl overflow-hidden border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1e1e1e]">
      <div className="flex h-full min-h-[500px] flex-col gap-3 p-5">
        <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            style={{ width: `${Math.max(28, 86 - index * 4)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
