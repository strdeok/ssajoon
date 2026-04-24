import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/isAdmin";
import { LayoutDashboard } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 이중 보호: middleware에서도 검증하지만, 서버 컴포넌트 레벨에서 확실히 차단
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-black">
      {/* 관리자 사이드바 */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-white/5 flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-500" />
            관리자 대시보드
          </h2>
        </div>
        
        {/* 클라이언트 네비게이션: 활성 링크 표시 포함 */}
        <AdminNav />
      </aside>

      {/* 관리자 메인 컨텐츠 영역 */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
