import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent } from "@/lib/data.server";
import { gradeName, tier } from "@/lib/design";
import { MAX_SET, STAGES } from "@/lib/types";
import { ProgressBar, SetTrack, StatCard, TierBadge, STAGE_ICON } from "@/components/ui";
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
            <div className="mt-2"><TierBadge set={curSet} size="md" /></div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold">{p.percent}%</div>
            <div className="text-xs text-white/80">ความก้าวหน้ารวม</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="ผ่านแล้ว" value={p.totalPassed} sub={`จาก ${p.grandTotal} บท`} accent="text-emerald-300" />
        <StatCard label="ชุดที่จบ" value={`${p.completedSets}/${MAX_SET}`} accent="text-indigo-300" />
        <StatCard label="กำลังเล่น" value={p.isMaxed ? "จบแล้ว" : `ด่าน ${p.currentStage}`} sub={p.isMaxed ? "เก่งสุด ๆ" : `บท ${p.currentChapter}`} accent="text-fuchsia-300" />
      </div>

      {/* Current set stages */}
      {!p.isMaxed && (
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-extrabold text-ink">ชุด {curSet} — 3 ด่าน</h2>
          <div className="space-y-3">
            {cur.stages.map((st) => {
              const Icon = STAGE_ICON[st.stage - 1];
              const meta = STAGES[st.stage - 1];
              const active = st.stage === p.currentStage;
              return (
                <div key={st.stage} className={`rounded-xl border p-3 ${st.complete ? "border-emerald-400/30 bg-emerald-500/10" : active ? "border-indigo-400/40 bg-indigo-500/10" : "border-white/10"}`}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-ink"><Icon size={16} className="text-slate-400" /> ด่าน {st.stage}: {meta.name}</div>
                    <span className="text-xs font-semibold text-slate-400">{st.passed}/{st.total} บท {st.complete ? "· ผ่าน ✓" : active ? "· กำลังเล่น" : ""}</span>
                  </div>
                  <ProgressBar value={st.passed} max={st.total} gradient={st.complete ? "from-emerald-400 to-emerald-600" : "from-indigo-500 to-fuchsia-500"} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Journey across 6 sets */}
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-extrabold text-ink">เส้นทาง 6 ชุด</h2>
        <SetTrack p={p} />
      </section>
    </div>
  );
}
