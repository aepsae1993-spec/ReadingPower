import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import NextTopLoader from "nextjs-toploader";
import { Trophy, School, Activity, Microscope } from "lucide-react";
import AuthNav from "@/components/AuthNav";
import NavGate from "@/components/NavGate";
import "./globals.css";

const LOGO_URL = "https://bwnjcxewplhtpvvnclfc.supabase.co/storage/v1/object/public/logo/school-logo.png";

const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["300", "400", "600", "700", "800"], variable: "--font-sarabun" });

export const metadata: Metadata = {
  title: "READING POWER • โรงเรียนวัดบางขุด",
  description: "ระบบติดตามความก้าวหน้าการอ่านแบบเกม ป.1–ป.6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="font-sans text-slate-200 antialiased">
        <NextTopLoader color="#a78bfa" height={3} showSpinner={true} shadow="0 0 12px #a78bfa, 0 0 6px #d946ef" speed={300} crawlSpeed={160} />
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white/10 shadow-glow ring-1 ring-white/20">
                <Image src={LOGO_URL} alt="โลโก้โรงเรียน" width={44} height={44} className="h-full w-full object-contain p-0.5" priority />
              </span>
              <div className="leading-tight">
                <div className="text-base font-extrabold tracking-wide text-ink">READING POWER</div>
                <div className="text-xs text-slate-300">โรงเรียนวัดบางขุด (อุ่นพิทยาคาร)</div>
              </div>
            </Link>
            <NavGate>
              <nav className="flex items-center gap-1 text-sm font-semibold">
                <Link href="/" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10">
                  <Trophy size={16} /> <span className="hidden sm:inline">โรงเรียน</span>
                </Link>
                <Link href="/summary" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10">
                  <Activity size={16} /> <span className="hidden sm:inline">สรุป</span>
                </Link>
                <Link href="/class/1" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10">
                  <School size={16} /> <span className="hidden sm:inline">ห้องเรียน</span>
                </Link>
                <Link href="/analysis" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10">
                  <Microscope size={16} /> <span className="hidden sm:inline">วิเคราะห์</span>
                </Link>
                <AuthNav />
              </nav>
            </NavGate>
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
