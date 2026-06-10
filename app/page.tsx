import Link from "next/link";
import { getAllStudents } from "@/lib/data.server";
import { gradeName, tier } from "@/lib/design";
import { MAX_SET } from "@/lib/types";
import { ProgressBar, PositionPill, RankMedal, TierBadge } from "@/components/ui";
import { Crown, Users, Flame, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SchoolPage() {
  const rows = await getAllStudents();
  const top = rows.slice(0, 3);
  const highestSet = Math.max(...rows.map((r) => (r.progress.isMaxed ? MAX_SET : r.progress.currentSet)));
  const avgPercent = Math.round(rows.reduce((a, r) => a + r.progress.percent, 0) / rows.length);

  const byGrade = Array.from({ length: 6 }, (_, i) => i + 1).map((g) => {
    const list = rows.filter((r) => r.grade === g);
    const best = list[0];
    return { g, count: list.length, best, avg: Math.round(list.reduce((a, r) => a + r.progress.percent, 0) / (list.length || 1)) };
  });

  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-7 text-white">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/80">แดชบอร์ดประจำโรงเรียน</div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">เส้นทางนักอ่าน 🏆</h1>
              <p className="mt-1 max-w-lg text-sm text-white/80">ยิ่งชุดสูงยิ่งเก่ง — แต่ละชุดมี 3 ด่าน: บัญชีคำพื้นฐาน · อ่านถูกผิด · แต่งประโยค</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <HeroStat icon={<Users size={16} />} label="นักเรียน" value={rows.length} />
              <HeroStat icon={<Crown size={16} />} label="ชุดสูงสุด" value={highestSet} />
              <HeroStat icon={<Flame size={16} />} label="ก้าวหน้าเฉลี่ย" value={`${avgPercent}%`} />
            </div>
          </div>
        </div>
      </section>

      {/* Podium */}
      <section>
        <h2 className="mb-3 px-1 text-lg font-extrabold text-ink">หอเกียรติยศ ✨</h2>
        <div className="grid grid-cols-3 gap-3">
          {podiumOrder.map((r) => {
            const place = r.rank!;
            const t = tier(r.progress.isMaxed ? MAX_SET : r.progress.currentSet);
            return (
              <Link key={r.id} href={`/student/${r.id}`} className={`card group p-4 text-center transition hover:-translate-y-0.5 ${place === 1 ? "sm:-mt-4 ring-2 ring-yellow-300" : ""}`}>
                <span className={`mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-glow ${t.grad}`}>{place === 1 ? "👑" : t.emoji}</span>
                <div className="truncate text-sm font-bold text-ink">{r.name}</div>
                <div className="text-xs text-slate-400">{gradeName(r.grade)}</div>
                <div className="mt-2 flex justify-center"><TierBadge set={r.progress.isMaxed ? MAX_SET : r.progress.currentSet} size="sm" /></div>
                <div className="mt-1 text-[11px] text-slate-400">อันดับ {place}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Class cards */}
      <section>
        <h2 className="mb-3 px-1 text-lg font-extrabold text-ink">แดชบอร์ดประจำชั้น</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {byGrade.map(({ g, count, best, avg }) => (
            <Link key={g} href={`/class/${g}`} className="card group flex items-center justify-between p-4 transition hover:-translate-y-0.5">
              <div>
                <div className="text-xl font-extrabold text-ink">{gradeName(g)}</div>
                <div className="text-xs text-slate-400">{count} คน · ก้าวหน้าเฉลี่ย {avg}%</div>
                {best && <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300"><Crown size={13} className="text-amber-500" /> {best.name.split(" ")[0]}</div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {best && <TierBadge set={best.progress.isMaxed ? MAX_SET : best.progress.currentSet} name={false} size="sm" />}
                <ChevronRight className="text-slate-300 group-hover:text-indigo-500" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="text-lg font-extrabold text-ink">อันดับรวมทั้งโรงเรียน</h2>
          <span className="text-xs text-slate-400">เรียงตามความก้าวหน้า</span>
        </div>
        <div className="divide-y divide-white/5">
          {rows.slice(0, 15).map((r) => (
            <Link key={r.id} href={`/student/${r.id}`} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/5">
              <RankMedal rank={r.rank!} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{r.name}</div>
                <div className="text-xs text-slate-400">{gradeName(r.grade)}</div>
              </div>
              <div className="hidden sm:block"><PositionPill p={r.progress} /></div>
              <TierBadge set={r.progress.isMaxed ? MAX_SET : r.progress.currentSet} name={false} size="sm" />
              <div className="w-28 shrink-0">
                <ProgressBar value={r.progress.totalPassed} max={r.progress.grandTotal} />
                <div className="mt-0.5 text-right text-[10px] text-slate-400">{r.progress.percent}%</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur">
      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-white/80">{icon}{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}
