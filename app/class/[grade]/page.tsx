import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllStudents } from "@/lib/data";
import { gradeName } from "@/lib/design";
import { MAX_SET } from "@/lib/types";
import { ProgressBar, PositionPill, RankMedal, StatCard, TierBadge } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6].map((g) => ({ grade: String(g) }));
}

export default function ClassPage({ params }: { params: { grade: string } }) {
  const grade = Number(params.grade);
  if (!(grade >= 1 && grade <= 6)) notFound();
  const all = getAllStudents();
  const rows = all.filter((r) => r.grade === grade).sort((a, b) => b.progress.rankValue - a.progress.rankValue);
  rows.forEach((r, i) => (r.rank = i + 1));
  const avg = Math.round(rows.reduce((a, r) => a + r.progress.percent, 0) / (rows.length || 1));
  const topSet = Math.max(...rows.map((r) => (r.progress.isMaxed ? MAX_SET : r.progress.currentSet)));

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-indigo-300"><ArrowLeft size={16} /> โรงเรียน</Link>

      <section className="card overflow-hidden">
        <div className="relative bg-gradient-to-br from-sky-600 to-indigo-600 px-6 py-6 text-white">
          <div className="text-sm font-semibold text-white/80">แดชบอร์ดประจำชั้น</div>
          <h1 className="mt-1 text-3xl font-extrabold">ชั้น {gradeName(grade)}</h1>
          <p className="text-sm text-white/80">{rows.length} คน</p>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          <StatCard label="นักเรียน" value={rows.length} accent="text-sky-300" />
          <StatCard label="ชุดสูงสุดในห้อง" value={topSet} accent="text-indigo-300" />
          <StatCard label="ก้าวหน้าเฉลี่ย" value={`${avg}%`} accent="text-fuchsia-300" />
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3.5">
          <h2 className="text-lg font-extrabold text-ink">อันดับในห้อง</h2>
        </div>
        <div className="divide-y divide-white/5">
          {rows.map((r) => (
            <Link key={r.id} href={`/student/${r.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5">
              <RankMedal rank={r.rank!} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{r.name}</div>
                <div className="mt-1 sm:hidden"><PositionPill p={r.progress} /></div>
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
