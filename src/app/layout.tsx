import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skillmate Marketplace",
  description: "A two-sided marketplace for buying and selling.",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const user = hasSupabase
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans dark:bg-black">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
          <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold">
              Skillmate
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/listings/new" className="hover:underline">
                Sell
              </Link>
              {user ? (
                <Link href="/profile" className="hover:underline">
                  {user.email}
                </Link>
              ) : (
                <Link href="/auth" className="hover:underline">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
          Skillmate — demo marketplace
        </footer>
      </body>
    </html>
  );
}