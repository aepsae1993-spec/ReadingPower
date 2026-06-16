import { notFound } from "next/navigation";
import { getStudent, getStudentAttempts } from "@/lib/data.server";
import { gradeName, tier } from "@/lib/design";
import { MAX_SET } from "@/lib/types";
import { SetTrack, SetDetail, StatCard, LevelBadge, RetakeHistory } from "@/components/ui";
import { computeBadges } from "@/lib/badges";

export const dynamic = "force-dynamic";

const clampSet = (n: number) => (Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 1), MAX_SET) : 1);

export default async function ReportPage({ params, searchParams }: { params: { id: string }; searchParams: { set?: string } }) {
  const s = await getStudent(params.id);
  if (!s) notFound();
  const p = s.progress;
  const levelSet = p.isMaxed ? MAX_SET : p.currentSet;
  const t = tier(levelSet);
  const selectedSet = clampSet(+(searchParams?.set ?? (p.started ? levelSet : 1)));
  const cur = p.bySet[selectedSet - 1];

  const done = p.bySet.flatMap((sp) => sp.cells).filter((c) => c.score != null);
  const scoreSum = done.reduce((a, c) => a + (c.score ?? 0), 0);
  const scoreMax = done.reduce((a, c) => a + c.total, 0);
  const scorePct = scoreMax ? Math.round((scoreSum / scoreMax) * 100) : 0;
  const progressPct = p.grandTotal ? Math.round((p.totalPassed / p.grandTotal) * 100) : 0;
  const earned = computeBadges(s).filter((b) => b.earned);
  const retakes = await getStudentAttempts(s.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="text-center">
        <div className="text-sm font-semibold text-slate-400">รายงานความก้าวหน้าการอ่าน · สำหรับผู้ปกครอง</div>
      </div>

      {/* Profile hero */}
      <section className="card overflow-hidden">
        <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 bg-gradient-to-br ${t.grad} px-4 py-5 text-white sm:gap-4 sm:px-6`}>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl backdrop-blur sm:h-20 sm:w-20 sm:rounded-3xl sm:text-4xl">{p.isMaxed ? "👑" : t.emoji}</span>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold leading-tight drop-shadow-sm sm:text-2xl">{s.name}</h1>
            <div className="text-sm text-white/80">{gradeName(s.grade)}</div>
            <div className="mt-1.5"><LevelBadge p={p} size="sm" /></div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-3xl font-extrabold leading-none sm:text-4xl">{progressPct}%</div>
            <div className="text-[11px] text-white/80 sm:text-sm">ก้าวหน้ารวม</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="คะแนนรวม" value={`${scorePct}%`} sub={done.length ? `จาก ${done.length} บทที่ทำ` : "ยังไม่มีคะแนน"} accent="text-amber-300" />
        <StatCard label="บทที่ผ่าน" value={p.totalPassed} sub={`จาก ${p.grandTotal} บท`} accent="text-emerald-300" />
        <StatCard label="ชุดที่จบ" value={`${p.completedSets}/${MAX_SET}`} accent="text-indigo-300" />
        <StatCard label="กำลังอยู่" value={p.isMaxed ? "จบแล้ว" : p.started ? `ชุด ${levelSet}` : "ยังไม่เริ่ม"} sub={p.started && !p.isMaxed ? `บท ${p.currentChapter}` : ""} accent="text-fuchsia-300" />
      </div>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 text-xl font-extrabold text-ink">เส้นทาง 6 ชุด <span className="text-sm font-semibold text-slate-400">(แตะเพื่อดูคะแนนแต่ละชุด)</span></h2>
        <SetTrack p={p} selected={selectedSet} hrefFor={(n) => `/report/${s.id}?set=${n}`} />
      </section>

      {/* คะแนนรายบทของชุดที่เลือก */}
      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 text-xl font-extrabold text-ink">คะแนนรายบท — ชุด {selectedSet}</h2>
        <SetDetail setNo={selectedSet} cur={cur} />
      </section>

      <RetakeHistory retakes={retakes} />

      {earned.length > 0 && (
        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 text-xl font-extrabold text-ink">เหรียญที่ได้รับ 🏅 <span className="text-sm font-semibold text-amber-300">({earned.length})</span></h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {earned.map((b) => (
              <div key={b.key} className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500/20 text-xl">{b.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-amber-200">{b.label}</div>
                  <div className="text-[11px] text-slate-400">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="px-1 pb-2 text-center text-xs text-slate-500">รายงานนี้แสดงข้อมูลล่าสุด · จัดทำโดยระบบ READING POWER</p>
    </div>
  );
}
