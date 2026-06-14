import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent } from "@/lib/data.server";
import { isConfigured } from "@/lib/supabase/server";
import { gradeName, tier } from "@/lib/design";
import { MAX_SET, TEST_FULL } from "@/lib/types";
import { SetTrack, StatCard, LevelBadge } from "@/components/ui";
import { computeBadges, earnedCount } from "@/lib/badges";
import { ArrowLeft, Download, Compass } from "lucide-react";

export const dynamic = "force-dynamic";

const clampSet = (n: number) => (Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 1), MAX_SET) : 1);

export default async function StudentPage({ params, searchParams }: { params: { id: string }; searchParams: { set?: string } }) {
  const s = await getStudent(params.id);
  if (!s) notFound();
  const p = s.progress;
  const levelSet = p.isMaxed ? MAX_SET : p.currentSet;          // ระดับจริงของนักเรียน (สีการ์ด/ป้าย)
  const t = tier(levelSet);
  const selectedSet = clampSet(+(searchParams?.set ?? (p.started ? levelSet : 1)));  // ชุดที่กำลังดู
  const cur = p.bySet[selectedSet - 1];
  const setPercent = cur.total ? Math.round((cur.passed / cur.total) * 100) : 0; // ความก้าวหน้าในชุดที่ดู

  // คะแนนรวมจากบทที่กรอกแล้วทั้งหมด (เต็ม 20/15 รวมกัน) → ร้อยละ
  const done = p.bySet.flatMap((sp) => sp.cells).filter((c) => c.score != null);
  const scoreSum = done.reduce((a, c) => a + (c.score ?? 0), 0);
  const scoreMax = done.reduce((a, c) => a + c.total, 0);
  const scorePct = scoreMax ? Math.round((scoreSum / scoreMax) * 100) : 0;

  const badges = computeBadges(s);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/class/${s.grade}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-indigo-300"><ArrowLeft size={16} /> ชั้น {gradeName(s.grade)}</Link>
        {isConfigured() && (
          <a href={`/api/export/student?id=${s.id}`} className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25">
            <Download size={16} /> ดาวน์โหลด Excel
          </a>
        )}
      </div>

      {/* Profile hero */}
      <section className={`card overflow-hidden`}>
        <div className={`flex flex-wrap items-center gap-4 bg-gradient-to-br ${t.grad} px-6 py-6 text-white`}>
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white/20 text-4xl backdrop-blur">{p.isMaxed ? "👑" : t.emoji}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold drop-shadow-sm">{s.name}</h1>
            <div className="text-sm text-white/80">{gradeName(s.grade)} · อันดับโรงเรียน #{s.rank}</div>
            <div className="mt-2"><LevelBadge p={p} size="md" /></div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold">{setPercent}%</div>
            <div className="text-sm text-white/80">ความก้าวหน้า ชุด {selectedSet}</div>
          </div>
        </div>
      </section>

      {/* ชุดเริ่มต้นที่แนะนำจาก Pre-Test */}
      <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30"><Compass size={20} /></span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">ชุดเริ่มต้นที่แนะนำ · จาก Pre-Test</div>
            <div className="text-lg font-extrabold text-ink">{s.recommendedSet ? `ชุด ${s.recommendedSet}` : "ยังประเมินไม่ได้"}</div>
          </div>
        </div>
        <div className="max-w-md text-sm text-slate-300">{s.placementNote}</div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="คะแนนรวม" value={`${scorePct}%`} sub={done.length ? `ทำแล้ว ${done.length} บท · ${scoreSum}/${scoreMax} คะแนน` : "ยังไม่มีคะแนน"} accent="text-amber-300" />
        <StatCard label="บทที่ผ่าน" value={p.totalPassed} sub={`จาก ${p.grandTotal} บท`} accent="text-emerald-300" />
        <StatCard label="ชุดที่จบ" value={`${p.completedSets}/${MAX_SET}`} accent="text-indigo-300" />
        <StatCard label="กำลังอยู่" value={p.isMaxed ? "จบแล้ว" : p.started ? `บท ${p.currentChapter}` : "ยังไม่เริ่ม"} sub={p.isMaxed ? "เก่งสุด ๆ" : p.started ? `ชุด ${levelSet}` : "ยังไม่มีคะแนน"} accent="text-fuchsia-300" />
      </div>

      {/* Selected set — all 50 chapters */}
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold text-ink">ชุด {selectedSet} — 50 บท</h2>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-400" /> ผ่าน</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-rose-400/80" /> ไม่ผ่าน</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-700" /> ยังไม่กรอก</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-700 ring-1 ring-amber-400/70" /> แต่งประโยค (เต็ม {TEST_FULL})</span>
          </div>
        </div>
        {/* แท็บเลือกชุด — คลิกย้อนดูชุดอื่นได้ */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Array.from({ length: MAX_SET }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/student/${s.id}?set=${n}`} scroll={false}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${n === selectedSet ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-glow" : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"}`}>
              ชุด {n}
            </Link>
          ))}
        </div>
        {/* สถานะ Post-Test ของชุดที่ดู */}
        {cur.status === "awaiting" && (
          <div className="mb-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200">
            ⏳ ครบ 50 บทแล้ว — ทำ <b>Post-Test ชุด {selectedSet}</b> ให้ได้ ≥50% เพื่อปิดชุดและเลื่อนขึ้นชุดถัดไป
            {cur.postPct != null && <span className="font-normal text-amber-300/90"> · ตอนนี้ได้ {Math.round(cur.postPct * 100)}% (ยังไม่ผ่าน)</span>}
          </div>
        )}
        {cur.status === "cleared" && (
          <div className="mb-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200">
            ✅ จบชุด {selectedSet} แล้ว{cur.postPct != null && ` · Post-Test ${Math.round(cur.postPct * 100)}%`} — เลื่อนขึ้นชุดถัดไปได้
          </div>
        )}
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
            {cur.cells.map((c) => {
              const state = c.score == null ? "empty" : c.passed ? "pass" : "fail";
              return (
                <div key={c.chapter} title={`บท ${c.chapter}${c.score == null ? "" : ` · ${c.score}/${c.total}`}`}
                  className={`rounded-lg border p-1.5 text-center ${c.isTest ? "ring-1 ring-amber-400/50" : ""} ${state === "pass" ? "border-emerald-400/30 bg-emerald-500/10" : state === "fail" ? "border-rose-400/30 bg-rose-500/10" : "border-white/10 bg-white/5"}`}>
                  <div className="text-[11px] font-medium text-slate-400">บท {c.chapter}</div>
                  <div className={`leading-tight ${state === "pass" ? "text-emerald-300" : state === "fail" ? "text-rose-300" : "text-slate-600"}`}>
                    {c.score == null
                      ? <span className="text-base font-extrabold">–</span>
                      : <><span className="text-base font-extrabold">{c.score}</span><span className="text-[10px] font-semibold text-slate-500">/{c.total}</span></>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      {/* เหรียญ & ความสำเร็จ */}
      <section className="card p-5">
        <h2 className="mb-3 text-xl font-extrabold text-ink">เหรียญ &amp; ความสำเร็จ <span className="text-sm font-semibold text-amber-300">({earnedCount(badges)}/{badges.length})</span></h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <div key={b.key} className={`flex items-center gap-3 rounded-xl border p-3 ${b.earned ? "border-amber-400/40 bg-amber-500/10" : "border-white/10 bg-white/5"}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl ${b.earned ? "bg-amber-500/20" : "bg-slate-700/50 opacity-50 grayscale"}`}>{b.icon}</span>
              <div className="min-w-0">
                <div className={`text-sm font-bold ${b.earned ? "text-amber-200" : "text-slate-400"}`}>{b.label}</div>
                <div className="text-[11px] text-slate-400">{b.earned ? b.desc : `🔒 ${b.desc}`}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Journey across 6 sets — คลิกเพื่อเลือกดูชุด */}
      <section className="card p-5">
        <h2 className="mb-3 text-xl font-extrabold text-ink">เส้นทาง 6 ชุด <span className="text-sm font-semibold text-slate-400">(คลิกเพื่อดูแต่ละชุด)</span></h2>
        <SetTrack p={p} selected={selectedSet} hrefFor={(n) => `/student/${s.id}?set=${n}`} />
      </section>
    </div>
  );
}
