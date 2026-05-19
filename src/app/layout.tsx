import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "SSAJOON",
  description: "Algorithm platform for SSAFY",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enableVercelInsights =
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_INSIGHTS === "true";

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-blue-500/30 selection:text-blue-200">
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 flex flex-col">
                {children}
              </main>
              {enableVercelInsights && (
                <>
                  <Analytics />
                  <SpeedInsights />
                </>
              )}
              <Footer />
            </div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
