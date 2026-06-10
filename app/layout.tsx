import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import Link from "next/link";
import { Trophy, School, BookOpenText } from "lucide-react";
import AuthNav from "@/components/AuthNav";
import "./globals.css";

const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["300", "400", "600", "700", "800"], variable: "--font-sarabun" });

export const metadata: Metadata = {
  title: "READING POWER • โรงเรียนวัดบางขุด",
  description: "ระบบติดตามความก้าวหน้าการอ่านแบบเกม ป.1–ป.6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="font-sans text-slate-200 antialiased">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow ring-1 ring-white/20">
                <BookOpenText size={20} className="drop-shadow" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-ink">READING POWER</div>
                <div className="text-[11px] text-slate-400">โรงเรียนวัดบางขุด (อุ่นพิทยาคาร)</div>
              </div>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-semibold">
              <Link href="/" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10">
                <Trophy size={16} /> โรงเรียน
              </Link>
              <Link href="/class/1" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10">
                <School size={16} /> ห้องเรียน
              </Link>
              <AuthNav />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-slate-500">
          ⚔️ READING POWER • ระบบติดตามการอ่านแบบเกม • ข้อมูลตัวอย่าง (เดโม)
        </footer>
      </body>
    </html>
  );
}
