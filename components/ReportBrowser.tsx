"use client";
import { useState } from "react";
import Link from "next/link";
import { gradeName } from "@/lib/design";
import { Search, ChevronRight } from "lucide-react";

type Stu = { id: string; name: string; grade: number };

export default function ReportBrowser({ students }: { students: Stu[] }) {
  const [q, setQ] = useState("");
  const [g, setG] = useState(0); // 0 = ทุกชั้น
  const query = q.trim().toLowerCase();
  const filtered = students.filter((s) => (g === 0 || s.grade === g) && (query === "" || s.name.toLowerCase().includes(query)));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="พิมพ์ชื่อนักเรียน…" autoFocus
          className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-3 text-base text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/40" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <button key={n} onClick={() => setG(n)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${n === g ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-glow" : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"}`}>
            {n === 0 ? "ทุกชั้น" : gradeName(n)}
          </button>
        ))}
      </div>

      <div className="text-sm text-slate-400">พบ {filtered.length} คน</div>

      <div className="card divide-y divide-white/5">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">ไม่พบชื่อนี้ — ลองพิมพ์ใหม่หรือเลือกชั้น</div>
        ) : (
          filtered.slice(0, 200).map((s) => (
            <Link key={s.id} href={`/report/${s.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/5">
              <span className="truncate font-semibold text-ink">{s.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-sm text-slate-400">{gradeName(s.grade)} <ChevronRight size={16} className="text-slate-500" /></span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
