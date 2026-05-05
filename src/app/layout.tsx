import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { AuthNav } from "@/components/layout/AuthNav";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SSAJOON - Algorithm Platform",
  description: "Premium Algorithm Problem Solving Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-blue-500/30 selection:text-blue-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="h-16 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#09090b] flex items-center shadow-sm">
              <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center space-x-8">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    <Link href="/">SSAJOON</Link>
                  </h1>
                  <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    <Link href="/problems" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">문제 목록</Link>
                    <Link href="/generate" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">문제 생성</Link>
                    <Link href="/submissions" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">제출 내역</Link>
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <ThemeSwitcher />
                  <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
                  <AuthNav />
                </div>
              </div>
            </header>
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
