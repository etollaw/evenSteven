import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText } from "lucide-react";

import { signOut } from "@/app/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvenSteven | IOU Tab Tracker",
  description: "A polished Splitwise-style expense tracker with optimized settle-up suggestions."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
            <Link href="/" className="flex items-center gap-3 text-lg font-black tracking-tight text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30">
                <ReceiptText className="h-6 w-6" />
              </span>
              <span>EvenSteven</span>
            </Link>
            <nav className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                Dashboard
              </Link>
              <form action={signOut}>
                <button className="rounded-full border border-white/15 px-4 py-2 text-slate-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white">
                  Sign out
                </button>
              </form>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
