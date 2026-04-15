import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SSAJUN - Algorithm Platform",
  description: "Premium Algorithm Problem Solving Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-blue-500/30 selection:text-blue-200`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              SSAJUN
            </a>
            <nav className="flex space-x-6 text-sm font-medium text-zinc-400">
              <a href="/" className="hover:text-black dark:hover:text-white transition-colors">Problems</a>
              <a href="/submissions" className="hover:text-black dark:hover:text-white transition-colors">Submissions</a>
            </nav>
            <div className="ml-4 flex items-center border-l border-zinc-200 dark:border-zinc-800 pl-4">
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
