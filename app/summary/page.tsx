import Link from "next/link";
import { getAllStudents } from "@/lib/data.server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { gradeName, TIERS } from "@/lib/design";
import { MAX_SET, chapterShort, chapterPassed } from "@/lib/types";
import { StatCard, ProgressBar } from "@/components/ui";
import AutoRefresh from "@/components/AutoRefresh";
import ProgressChart, { ChartPoint } from "@/components/ProgressChart";
import { BookOpen, ChevronRight, History, TrendingUp } from "lucide-react";

const WEEKS = 8;
function startOfWeek(d: Date) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x; }

/** ความก้าวหน้าสะสม (บทที่ผ่าน) รายสัปดาห์ ย้อนหลัง 8 สัปดาห์ */
async function progressSeries(passedSum: number): Promise<ChartPoint[]> {
  const tw = startOfWeek(new Date());
  const weeks = Array.from({ length: WEEKS }, (_, i) => { const s = new Date(tw); s.setDate(s.getDate() - (WEEKS - 1 - i) * 7); return s; });
  const label = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;

  if (isConfigured()) {
    const sb = createClient();
    const { data } = await sb.from("chapter_scores").select("updated_at,chapter,score,total");
    const passedAt = (data ?? [])
      .filter((r: any) => r.updated_at && chapterPassed(r.chapter, r.score, r.total))
      .map((r: any) => new Date(r.updated_at).getTime());
    return weeks.map((w) => { const end = new Date(w); end.setDate(end.getDate() + 7); return { label: label(w), value: passedAt.filter((t) => t < end.getTime()).length }; });
  }
  // เดโม: สังเคราะห์เส้นโค้งสะสมให้จบที่ passedSum
  const frac = [0.12, 0.22, 0.34, 0.45, 0.58, 0.7, 0.85, 1];
  return weeks.map((w, i) => ({ label: label(w), value: Math.round(passedSum * frac[i]) }));
}

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const rows = await getAllStudents();
  const total = rows.length;
  const started = rows.filter((r) => r.progress.started).length;
  const maxed = rows.filter((r) => r.progress.isMaxed).length;
  const avg = total ? Math.round(rows.reduce((a, r) => a + r.progress.percent, 0) / total) : 0;
  const passedSum = rows.reduce((a, r) => a + r.progress.totalPassed, 0);
  const grand = rows.reduce((a, r) => a + r.progress.grandTotal, 0);
  const series = await progressSeries(passedSum);
  const weekDelta = series.length >= 2 ? series[series.length - 1].value - series[series.length - 2].value : 0;

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

  // จัดกลุ่ม:
  // - สูงกว่าเกณฑ์ (เก่ง) = ทำบทเฉลี่ย > 70% และ Post-Test (ดีสุด) > 70% → โชว์แค่ ป./ชุด/บท ปัจจุบัน
  // - ต่ำกว่าเกณฑ์ = Pre-Test ชั้นตัวเอง < 50%
  // - ตามเกณฑ์ (ปกติ) = Pre-Test ≥ 50% หรือเริ่มเรียนแล้ว (ที่ไม่เข้าสองกลุ่มบน)
  type FlagItem = { r: (typeof rows)[number]; sort: number; badge: string; tone: "emerald" | "rose" | "slate"; sub: string };
  const ahead: FlagItem[] = [], onPlan: FlagItem[] = [], behind: FlagItem[] = [];
  let pending = 0;
  rows.forEach((r) => {
    const p = r.progress;
    const started = p.started;
    const curSet = p.isMaxed ? MAX_SET : p.currentSet;
    const cells = p.bySet.flatMap((sp) => sp.cells).filter((c) => c.score != null);
    const sMax = cells.reduce((a, c) => a + c.total, 0);
    const avgRaw = sMax > 0 ? (cells.reduce((a, c) => a + (c.score ?? 0), 0) / sMax) * 100 : 0;
    const posts = p.bySet.map((sp) => sp.postPct).filter((x): x is number => x != null);
    const bestPost = posts.length ? Math.max(...posts) : null;
    const isHigh = started && avgRaw > 70 && bestPost != null && bestPost * 100 > 70;

    // ผล Pre-Test ชั้นตัวเอง (จาก placement): ต่ำกว่าชั้น = Pre-Test <50%
    const recBelow = (r.recommendedSet != null && r.recommendedSet < r.grade) || (r.recommendedSet == null && r.placementNeed != null && r.placementNeed < r.grade);
    const pretestOk = r.recommendedSet != null && r.recommendedSet >= r.grade; // Pre-Test ≥50%

    const pos = started ? `${gradeName(r.grade)} · ชุด ${curSet} · บท ${p.currentChapter}` : `${gradeName(r.grade)} · ยังไม่เริ่ม`;

    if (isHigh) {
      ahead.push({ r, sort: avgRaw, badge: `เฉลี่ย ${Math.round(avgRaw)}%`, tone: "emerald", sub: pos });
    } else if (recBelow) {
      behind.push({ r, sort: r.grade, badge: "ต่ำกว่าเกณฑ์", tone: "rose", sub: started ? pos : `${gradeName(r.grade)} · ยังไม่เริ่ม · ${r.placementNote}` });
    } else if (pretestOk || started) {
      onPlan.push({ r, sort: r.grade, badge: started ? `ชุด ${curSet}` : "พร้อมเริ่ม", tone: "slate", sub: pos });
    } else {
      pending++;
    }
  });
  ahead.sort((a, b) => b.sort - a.sort || a.r.grade - b.r.grade);
  behind.sort((a, b) => a.r.grade - b.r.grade);
  onPlan.sort((a, b) => a.r.grade - b.r.grade);

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

      {/* ความก้าวหน้าตามเวลา */}
      <section className="card p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink"><TrendingUp size={20} className="text-indigo-300" /> ความก้าวหน้าตามเวลา</h2>
          <span className="text-sm text-slate-300">บทที่ผ่านสะสม · <b className="text-emerald-300">สัปดาห์นี้ +{weekDelta}</b></span>
        </div>
        <ProgressChart points={series} />
        <div className="mt-1 text-[11px] text-slate-500">8 สัปดาห์ล่าสุด (อิงวันที่บันทึกคะแนน){!isConfigured() && " · ตัวอย่างในโหมดเดโม"}</div>
      </section>

      {/* เทียบกับเกณฑ์ชั้น */}
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold text-ink">เทียบกับเกณฑ์ <span className="text-sm font-semibold text-slate-400">(เก่ง = เฉลี่ย &amp; Post-Test &gt;70% · ต่ำกว่า = Pre-Test &lt;50%)</span></h2>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="chip bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">🌟 สูงกว่าเกณฑ์ {ahead.length}</span>
            <span className="chip bg-white/10 text-slate-200 ring-1 ring-white/10">✓ ตามเกณฑ์ {onPlan.length}</span>
            <span className="chip bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30">⚠️ ต่ำกว่าเกณฑ์ {behind.length}</span>
            {pending > 0 && <span className="chip bg-white/5 text-slate-400 ring-1 ring-white/10">ยังไม่เริ่ม {pending}</span>}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <FlagList title="🌟 สูงกว่าเกณฑ์ (เก่ง)" accent="text-emerald-300" items={ahead} empty="ยังไม่มีใครเข้าเกณฑ์เก่ง" />
          <FlagList title="✓ ตามเกณฑ์" accent="text-slate-200" items={onPlan} empty="—" />
          <FlagList title="⚠️ ต่ำกว่าเกณฑ์ — ควรช่วยเหลือ" accent="text-rose-300" items={behind} empty="ไม่มีใครต่ำกว่าเกณฑ์ 👍" />
        </div>
      </section>

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

const stripTitle = (name: string) => name.replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง)\s*/, "");

function FlagList({ title, accent, items, empty }: { title: string; accent: string; items: { r: any; badge: string; tone: "emerald" | "rose" | "slate"; sub: string }[]; empty: string }) {
  const badgeCls = (t: string) => (t === "emerald" ? "bg-emerald-500/15 text-emerald-300" : t === "rose" ? "bg-rose-500/15 text-rose-300" : "bg-white/10 text-slate-300");
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <h3 className={`mb-2 text-sm font-extrabold ${accent}`}>{title} <span className="text-slate-400">({items.length})</span></h3>
      {items.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-400">{empty}</div>
      ) : (
        <div className="max-h-72 space-y-1 overflow-auto pr-1">
          {items.map(({ r, badge, tone, sub }) => (
            <Link key={r.id} href={`/student/${r.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 transition hover:bg-white/10">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{stripTitle(r.name)}</div>
                <div className="truncate text-[11px] text-slate-400">{sub}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badgeCls(tone)}`}>{badge}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
