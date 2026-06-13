import Link from "next/link";
import { getAllStudents } from "@/lib/data.server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { gradeName, TIERS } from "@/lib/design";
import { MAX_SET, chapterShort } from "@/lib/types";
import { StatCard, ProgressBar } from "@/components/ui";
import AutoRefresh from "@/components/AutoRefresh";
import { BookOpen, ChevronRight, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const rows = await getAllStudents();
  const total = rows.length;
  const started = rows.filter((r) => r.progress.started).length;
  const maxed = rows.filter((r) => r.progress.isMaxed).length;
  const avg = total ? Math.round(rows.reduce((a, r) => a + r.progress.percent, 0) / total) : 0;
  const passedSum = rows.reduce((a, r) => a + r.progress.totalPassed, 0);
  const grand = rows.reduce((a, r) => a + r.progress.grandTotal, 0);

  // กระจายตามชุด (ระดับล่าสุดของแต่ละคน)
  const tierCounts = [0, 0, 0, 0, 0, 0];
  let notStarted = 0;
  rows.forEach((r) => {
    if (!r.progress.started) return void notStarted++;
    tierCounts[(r.progress.isMaxed ? MAX_SET : r.progress.currentSet) - 1]++;
  });
  const tierMax = Math.max(1, ...tierCounts);

  // เทียบรายชั้น
  const byGrade = Array.from({ length: 6 }, (_, i) => i + 1).map((g) => {
    const list = rows.filter((r) => r.grade === g);
    const st = list.filter((r) => r.progress.started);
    const sets = st.map((r) => (r.progress.isMaxed ? MAX_SET : r.progress.currentSet));
    return {
      g, count: list.length, started: st.length,
      avg: list.length ? Math.round(list.reduce((a, r) => a + r.progress.percent, 0) / list.length) : 0,
      topSet: sets.length ? Math.max(...sets) : 0,
      passed: list.reduce((a, r) => a + r.progress.totalPassed, 0),
    };
  });

  // กิจกรรมล่าสุด (เฉพาะเมื่อเชื่อม DB)
  let recent: any[] = [];
  if (isConfigured()) {
    const sb = createClient();
    const { data } = await sb
      .from("chapter_scores")
      .select("set_no,chapter,score,total,updated_at,students(name,grade)")
      .order("updated_at", { ascending: false })
      .limit(12);
    recent = data ?? [];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card overflow-hidden">
        <div className="relative flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-slate-800 via-indigo-800 to-violet-800 px-6 py-6 text-white">
          <div>
            <div className="text-sm font-semibold text-white/80">แดชบอร์ดสรุป</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">ภาพรวมเรียลไทม์ 📊</h1>
            <p className="mt-1 text-sm text-white/80">อัปเดตจากข้อมูลล่าสุดอัตโนมัติ — ไม่ต้องรีโหลดเอง</p>
          </div>
          <AutoRefresh seconds={20} />
        </div>
      </section>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="นักเรียนทั้งหมด" value={total} sub={`${started} เริ่มแล้ว · ${total - started} ยังไม่เริ่ม`} accent="text-indigo-300" />
        <StatCard label="ก้าวหน้าเฉลี่ย" value={`${avg}%`} accent="text-fuchsia-300" />
        <StatCard label="บทที่ผ่านรวม" value={passedSum.toLocaleString()} sub={`จาก ${grand.toLocaleString()} บท`} accent="text-emerald-300" />
        <StatCard label="จบครบทุกชุด" value={maxed} sub="คน" accent="text-amber-300" />
        <StatCard label="กำลังเรียน" value={started - maxed} sub="คน" accent="text-sky-300" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tier distribution */}
        <section className="card p-5">
          <h2 className="mb-4 text-xl font-extrabold text-ink">กระจายตามชุด</h2>
          <div className="space-y-2.5">
            {TIERS.map((t, i) => (
              <div key={t.set} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-semibold text-slate-200">{t.emoji} ชุด {t.set}</span>
                <div className="flex-1"><ProgressBar value={tierCounts[i]} max={tierMax} gradient={t.grad} height="h-3" /></div>
                <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-slate-100">{tierCounts[i]}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 border-t border-white/10 pt-2.5">
              <span className="w-24 shrink-0 text-sm font-semibold text-slate-400">ยังไม่เริ่ม</span>
              <div className="flex-1"><ProgressBar value={notStarted} max={tierMax} gradient="from-slate-500 to-slate-600" height="h-3" /></div>
              <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-slate-300">{notStarted}</span>
            </div>
          </div>
        </section>

        {/* Recent activity */}
        <section className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
            <History size={18} className="text-indigo-300" />
            <h2 className="text-xl font-extrabold text-ink">กิจกรรมล่าสุด</h2>
          </div>
          {recent.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">{isConfigured() ? "ยังไม่มีการกรอกคะแนน" : "โหมดเดโม — กิจกรรมล่าสุดแสดงเมื่อเชื่อมต่อฐานข้อมูล"}</div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((e, i) => {
                const pass = e.total > 0 && e.score / e.total >= 0.5;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <BookOpen size={15} className="shrink-0 text-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{e.students?.name ?? "—"}</div>
                      <div className="text-xs text-slate-400">{e.students?.grade ? gradeName(e.students.grade) : ""} · ชุด {e.set_no} · {chapterShort(e.chapter)}</div>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${pass ? "text-emerald-300" : "text-rose-300"}`}>{e.score}/{e.total}</span>
                    <span className="w-16 shrink-0 text-right text-[11px] text-slate-500">{fmtTime(e.updated_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Per-grade comparison */}
      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3.5"><h2 className="text-xl font-extrabold text-ink">เทียบรายชั้น</h2></div>
        <div className="grid grid-cols-1 divide-y divide-white/5 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
          {byGrade.map((b) => (
            <Link key={b.g} href={`/class/${b.g}`} className="group flex items-center justify-between gap-3 border-white/5 px-5 py-4 transition hover:bg-white/5 sm:border-b">
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-ink">{gradeName(b.g)}</div>
                <div className="mt-0.5 text-sm text-slate-300">{b.count} คน · เริ่มแล้ว {b.started} · ผ่าน {b.passed} บท</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xl font-extrabold text-fuchsia-300">{b.avg}%</div>
                  <div className="text-[11px] text-slate-400">{b.topSet ? `สูงสุด ชุด ${b.topSet}` : "ยังไม่เริ่ม"}</div>
                </div>
                <ChevronRight className="text-slate-500 group-hover:text-indigo-400" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function fmtTime(ts?: string) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
