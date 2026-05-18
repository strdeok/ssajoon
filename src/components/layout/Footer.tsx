export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-white/5 dark:bg-[#09090b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-zinc-600 dark:text-zinc-400 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-lg font-bold text-transparent">
              SSAJOON
            </h2>
            <p className="mt-1 max-w-xl leading-6">
              더 나은 개발자가 되기 위한 알고리즘 트레이닝 플랫폼.
            </p>
          </div>
          <p className="text-xs sm:text-right">Premium Algorithm Platform</p>
        </div>
      </div>
    </footer>
  );
}
