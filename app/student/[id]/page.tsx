import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent } from "@/lib/data.server";
import { gradeName, tier } from "@/lib/design";
import { MAX_SET, SCORED_CHAPTERS, FULL_SCORE, PASS_SCORE } from "@/lib/types";
import { SetTrack, StatCard, LevelBadge } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentPage({ params }: { params: { id: string } }) {
  const s = await getStudent(params.id);
  if (!s) notFound();
  const p = s.progress;
  const curSet = p.isMaxed ? MAX_SET : p.currentSet;
  const t = tier(curSet);
  const cur = p.bySet[curSet - 1];

  return (
    <div className="space-y-6">
      <Link href={`/class/${s.grade}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-indigo-300"><ArrowLeft size={16} /> ชั้น {gradeName(s.grade)}</Link>

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
            <div className="text-4xl font-extrabold">{p.percent}%</div>
            <div className="text-sm text-white/80">ความก้าวหน้ารวม</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="บทที่ผ่าน" value={p.totalPassed} sub={`จาก ${p.grandTotal} บททดสอบ`} accent="text-emerald-300" />
        <StatCard label="ชุดที่จบ" value={`${p.completedSets}/${MAX_SET}`} accent="text-indigo-300" />
        <StatCard label="กำลังอยู่" value={p.isMaxed ? "จบแล้ว" : p.started ? `บท ${p.currentChapter}` : "ยังไม่เริ่ม"} sub={p.isMaxed ? "เก่งสุด ๆ" : p.started ? `ชุด ${curSet}` : "ยังไม่มีคะแนน"} accent="text-fuchsia-300" />
      </div>

      {/* Current set tests */}
      {!p.isMaxed && (
        <section className="card p-5">
          <h2 className="mb-3 text-xl font-extrabold text-ink">ชุด {curSet} — บททดสอบ <span className="text-base font-semibold text-slate-400">(เต็มบทละ {FULL_SCORE})</span></h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {SCORED_CHAPTERS.map((ch, i) => {
              const v = cur.scores[i];
              const state = v == null ? "empty" : v >= PASS_SCORE ? "pass" : "fail";
              return (
                <div key={ch} className={`rounded-xl border p-3 text-center ${state === "pass" ? "border-emerald-400/30 bg-emerald-500/10" : state === "fail" ? "border-rose-400/30 bg-rose-500/10" : "border-white/10 bg-white/5"}`}>
                  <div className="text-sm font-semibold text-slate-300">บท {ch}</div>
                  <div className={`mt-0.5 text-3xl font-extrabold tracking-tight ${state === "pass" ? "text-emerald-300" : state === "fail" ? "text-rose-300" : "text-slate-600"}`}>{v == null ? "—" : v}</div>
                  <div className="text-[11px] font-medium text-slate-400">{v == null ? "ยังไม่กรอก" : `/${FULL_SCORE} · ${state === "pass" ? "ผ่าน" : "ไม่ผ่าน"}`}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Journey across 6 sets */}
      <section className="card p-5">
        <h2 className="mb-3 text-xl font-extrabold text-ink">เส้นทาง 6 ชุด</h2>
        <SetTrack p={p} />
      </section>
    </div>
  );
}
