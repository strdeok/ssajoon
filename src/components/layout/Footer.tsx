
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-[#09090b] py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SSAJOON
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
              더 나은 개발자가 되기 위한 알고리즘 트레이닝 플랫폼. 
              싸준과 함께 성장하세요.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">서비스</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/problems" className="text-zinc-500 hover:text-blue-600 transition-colors">문제 목록</Link></li>
                <li><Link href="/submissions" className="text-zinc-500 hover:text-blue-600 transition-colors">제출 내역</Link></li>
                <li><Link href="/ranking" className="text-zinc-500 hover:text-blue-600 transition-colors opacity-50 cursor-not-allowed">랭킹</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">법률</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="text-zinc-500 hover:text-blue-600 transition-colors">이용약관</Link></li>
                <li><Link href="/privacy" className="text-zinc-500 hover:text-blue-600 transition-colors">개인정보처리방침</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">고객지원</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-zinc-500 hover:text-blue-600 transition-colors">문의하기</Link></li>
                <li><Link href="/faq" className="text-zinc-500 hover:text-blue-600 transition-colors">자주 묻는 질문</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-zinc-100 dark:border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} 싸준 (SSAJUN). All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <span className="text-xs text-zinc-300 dark:text-zinc-700">Made with ❤️ for Developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
