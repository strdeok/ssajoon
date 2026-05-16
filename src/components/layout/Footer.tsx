export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-[#09090b] py-12 mt-auto">
      <div className="w-full px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SSAJOON
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              더 나은 개발자가 되기 위한 알고리즘 트레이닝 플랫폼. 싸준과 함께
              성장하세요.
            </p>
          </div>
        </div>
        <div className="border-t border-zinc-100 dark:border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            © {new Date().getFullYear()} 싸준 (SSAJOON). All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Premium Algorithm Platform
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
