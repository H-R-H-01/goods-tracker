import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/layout/Navbar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goods Tracker",
  description: "Track entry and exit of goods",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} font-sans antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] mix-blend-overlay dark:mix-blend-lighten opacity-20 pointer-events-none" />
            <Navbar />
            <main className="flex-1 relative z-10 w-full">
              {children}
            </main>
            <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 py-12 bg-white dark:bg-slate-950">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  © {new Date().getFullYear()} GoodsTracker Logistics System
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
