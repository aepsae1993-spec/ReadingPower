import Link from "next/link";
import { getAllStudents } from "@/lib/data.server";
import { gradeName } from "@/lib/design";
import { MAX_SET } from "@/lib/types";
import { ProgressBar, PositionPill, RankMedal, RankEmblem, LevelBadge } from "@/components/ui";
import { Crown, Users, Flame, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SchoolPage() {
  const rows = await getAllStudents();
  const top = rows.slice(0, 3);
  const startedSets = rows.filter((r) => r.progress.started).map((r) => (r.progress.isMaxed ? MAX_SET : r.progress.currentSet));
  const highestSet = startedSets.length ? Math.max(...startedSets) : 0;
  const avgPercent = Math.round(rows.reduce((a, r) => a + r.progress.percent, 0) / rows.length);

  // คนเก่งสุดของชั้น = ไปถึงชุดสูงสุด, ชุดเท่ากันดูด่าน, ด่านเท่ากันดูบท
  const setReached = (p: (typeof rows)[number]["progress"]) => (p.isMaxed ? MAX_SET : p.started ? p.currentSet : 0);
  const isAhead = (a: (typeof rows)[number], b: (typeof rows)[number]) => {
    const sa = setReached(a.progress), sb = setReached(b.progress);
    if (sa !== sb) return sa > sb;
    if (a.progress.currentStage !== b.progress.currentStage) return a.progress.currentStage > b.progress.currentStage;
    return a.progress.currentChapter > b.progress.currentChapter;
  };

  // ตัดคำนำหน้า (ด.ช./ด.ญ./นาย...) เหลือชื่อจริง
  const firstName = (full: string) => {
    const parts = full.trim().split(/\s+/);
    const titles = ["ด.ช.", "ด.ญ.", "เด็กชาย", "เด็กหญิง", "นาย", "นางสาว", "นาง"];
    return (titles.includes(parts[0]) ? parts[1] : parts[0]) ?? full;
  };

  const byGrade = Array.from({ length: 6 }, (_, i) => i + 1).map((g) => {
    const list = rows.filter((r) => r.grade === g);
    const best = list.reduce<(typeof rows)[number] | undefined>((b, r) => (!b || isAhead(r, b) ? r : b), undefined);
    return { g, count: list.length, best, avg: Math.round(list.reduce((a, r) => a + r.progress.percent, 0) / (list.length || 1)) };
  });

  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-6 py-7 text-white">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[18%] top-[26%] h-px w-80 rotate-[-18deg] bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[1px]" />
            <div className="absolute right-[18%] top-[26%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_14px_5px_rgba(255,255,255,.85)]" />
          </div>
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/80">แดชบอร์ดประจำโรงเรียน</div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">เส้นทางนักอ่าน 🏆</h1>
              <p className="mt-1 max-w-lg text-sm text-white/80">ยิ่งชุดสูงยิ่งเก่ง — แต่ละชุดมี 3 ด่าน: บัญชีคำพื้นฐาน · อ่านถูกผิด · แต่งประโยค</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <HeroStat icon={<Users size={16} />} label="นักเรียน" value={rows.length} />
              <HeroStat icon={<Crown size={16} />} label="ชุดสูงสุด" value={highestSet || "-"} />
              <HeroStat icon={<Flame size={16} />} label="ก้าวหน้าเฉลี่ย" value={`${avgPercent}%`} />
            </div>
          </div>
        </div>
      </section>

      {/* Podium */}
      <section>
        <h2 className="mb-3 px-1 text-xl font-extrabold text-ink">หอเกียรติยศ ✨</h2>
        <div className="grid grid-cols-3 gap-3">
          {podiumOrder.map((r) => {
            const place = r.rank!;
            return (
              <Link key={r.id} href={`/student/${r.id}`} className={`card group relative overflow-hidden p-5 text-center transition hover:-translate-y-1 ${place === 1 ? "sm:-mt-5 card-glow" : ""}`}>
                {place === 1 && <span className="absolute right-[-34px] top-[18px] w-32 rotate-45 bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-1 text-center text-[10px] font-extrabold tracking-widest text-white shadow">TOP</span>}
                <RankEmblem rank={place} />
                <div className="mt-1 truncate text-lg font-bold text-ink">{r.name}</div>
                <div className="text-sm text-slate-300">{gradeName(r.grade)}</div>
                <div className="mt-2 flex justify-center"><LevelBadge p={r.progress} size="md" /></div>
                {r.progress.started && !r.progress.isMaxed && <div className="mt-1.5 text-xs text-slate-300">ด่าน {r.progress.currentStage} · บท {r.progress.currentChapter}</div>}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Class cards */}
      <section>
        <h2 className="mb-3 px-1 text-xl font-extrabold text-ink">แดชบอร์ดประจำชั้น</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {byGrade.map(({ g, count, best, avg }) => (
            <Link key={g} href={`/class/${g}`} className="card group flex items-center justify-between p-4 transition hover:-translate-y-0.5">
              <div>
                <div className="text-xl font-extrabold text-ink">{gradeName(g)}</div>
                <div className="mt-0.5 text-sm text-slate-300">{count} คน · ก้าวหน้าเฉลี่ย {avg}%</div>
                {best && <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-200"><Crown size={14} className="text-amber-400" /> {firstName(best.name)}</div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {best && <LevelBadge p={best.progress} name={false} size="sm" />}
                <ChevronRight className="text-slate-300 group-hover:text-indigo-500" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="text-xl font-extrabold text-ink">อันดับรวมทั้งโรงเรียน</h2>
          <span className="text-xs text-slate-400">เรียงตามความก้าวหน้า</span>
        </div>
        <div className="divide-y divide-white/5">
          {rows.slice(0, 15).map((r) => (
            <Link key={r.id} href={`/student/${r.id}`} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/5">
              <RankMedal rank={r.rank!} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-ink">{r.name}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-sm text-slate-300">{gradeName(r.grade)}</span>
                  <span className="sm:hidden"><PositionPill p={r.progress} /></span>
                </div>
              </div>
              <div className="hidden sm:block"><PositionPill p={r.progress} /></div>
              <LevelBadge p={r.progress} name={false} size="sm" />
              <div className="w-28 shrink-0">
                <ProgressBar value={r.progress.totalPassed} max={r.progress.grandTotal} />
                <div className="mt-1 text-right text-[11px] font-medium text-slate-300">{r.progress.percent}%</div>
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
    <div className="rounded-xl bg-white/15 px-3.5 py-2.5 text-center backdrop-blur ring-1 ring-white/10">
      <div className="flex items-center justify-center gap-1 text-xs font-semibold text-white/85">{icon}{label}</div>
      <div className="mt-0.5 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
