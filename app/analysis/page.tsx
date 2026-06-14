import Link from "next/link";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { buildMock } from "@/lib/mock";
import { gradeName } from "@/lib/design";
import { chapterShort, slotKind, chapterPassed, isTestChapter } from "@/lib/types";
import { Microscope, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

type Row = { studentId: string; grade: number; setNo: number; chapter: number; score: number; total: number; items: number[] | null };

async function loadRows(): Promise<Row[]> {
  if (isConfigured()) {
    const sb = createClient();
    const [{ data: studs }, { data: sc }] = await Promise.all([
      sb.from("students").select("id,grade").eq("active", true),
      sb.from("chapter_scores").select("student_id,set_no,chapter,score,total,items"),
    ]);
    const g = new Map((studs ?? []).map((s: any) => [s.id, s.grade]));
    return (sc ?? []).map((r: any) => ({ studentId: r.student_id, grade: g.get(r.student_id) ?? 0, setNo: r.set_no, chapter: r.chapter, score: r.score, total: r.total, items: Array.isArray(r.items) ? r.items : null }));
  }
  const m = buildMock();
  const g = new Map(m.students.map((s) => [s.id, s.grade]));
  return m.results.map((r) => ({ studentId: r.studentId, grade: g.get(r.studentId) ?? 0, setNo: r.setNo, chapter: r.chapter, score: r.score, total: r.total, items: null }));
}

const TYPE = (c: number) => (c >= 101 ? "ทดสอบ" : isTestChapter(c) ? "ประโยค" : "ปกติ");
const lvlTag = (pct: number) => (pct >= 80 ? { t: "ง่าย", c: "text-emerald-300 bg-emerald-500/15" } : pct < 50 ? { t: "ยาก", c: "text-rose-300 bg-rose-500/15" } : { t: "ปานกลาง", c: "text-amber-300 bg-amber-500/15" });

export default async function AnalysisPage({ searchParams }: { searchParams: { grade?: string } }) {
  const all = await loadRows();
  const gf = searchParams?.grade && /^[1-6]$/.test(searchParams.grade) ? Number(searchParams.grade) : 0; // 0 = ทั้งโรงเรียน
  const rows = gf ? all.filter((r) => r.grade === gf) : all;

  // รวมรายบท (ทุกชนิด) — เฉลี่ย % + อัตราผ่าน
  const chapMap = new Map<string, { setNo: number; chapter: number; scoreSum: number; totalSum: number; n: number; pass: number }>();
  for (const r of rows) {
    const k = `${r.setNo}-${r.chapter}`;
    const a = chapMap.get(k) ?? { setNo: r.setNo, chapter: r.chapter, scoreSum: 0, totalSum: 0, n: 0, pass: 0 };
    a.scoreSum += r.score; a.totalSum += r.total; a.n += 1;
    if (chapterPassed(r.chapter, r.score, r.total)) a.pass += 1;
    chapMap.set(k, a);
  }
  const chapters = [...chapMap.values()]
    .map((a) => ({ ...a, pct: a.totalSum ? Math.round((a.scoreSum / a.totalSum) * 100) : 0, passRate: a.n ? Math.round((a.pass / a.n) * 100) : 0 }))
    .sort((x, y) => x.pct - y.pct || x.passRate - y.passRate);
  const hardChapters = chapters.slice(0, 15);

  // รวมรายข้อ (เฉพาะบทกดถูก/ผิดที่มี items)
  const itemMap = new Map<string, { setNo: number; chapter: number; item: number; correct: number; n: number }>();
  for (const r of rows) {
    if (!r.items || !r.items.length) continue;
    r.items.forEach((v, i) => {
      const k = `${r.setNo}-${r.chapter}-${i}`;
      const a = itemMap.get(k) ?? { setNo: r.setNo, chapter: r.chapter, item: i + 1, correct: 0, n: 0 };
      a.correct += v ? 1 : 0; a.n += 1;
      itemMap.set(k, a);
    });
  }
  const items = [...itemMap.values()]
    .filter((a) => a.n >= 1)
    .map((a) => ({ ...a, rate: a.n ? Math.round((a.correct / a.n) * 100) : 0 }))
    .sort((x, y) => x.rate - y.rate);
  const hardItems = items.slice(0, 15);

  const GradeTabs = (
    <div className="flex flex-wrap gap-1.5">
      {[0, 1, 2, 3, 4, 5, 6].map((g) => (
        <Link key={g} href={g ? `/analysis?grade=${g}` : "/analysis"}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${g === gf ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-glow" : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"}`}>
          {g ? gradeName(g) : "ทั้งโรงเรียน"}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-slate-800 via-indigo-800 to-violet-800 px-6 py-6 text-white">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80"><Microscope size={16} /> วิเคราะห์ข้อสอบ</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">จุดที่ควรสอนซ้ำ 🔍</h1>
            <p className="mt-1 text-sm text-white/80">รวมคะแนนทุกคน หาบท/ข้อที่นักเรียนพลาดเยอะที่สุด</p>
          </div>
        </div>
        <div className="p-4">{GradeTabs}</div>
      </section>

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">ยังไม่มีคะแนนให้วิเคราะห์</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* บทที่ยากสุด */}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
              <AlertTriangle size={18} className="text-rose-300" />
              <h2 className="text-xl font-extrabold text-ink">บทที่ยากที่สุด</h2>
              <span className="ml-auto text-xs text-slate-400">เฉลี่ยทั้ง {gf ? gradeName(gf) : "โรงเรียน"} · เรียงจากต่ำสุด</span>
            </div>
            <div className="divide-y divide-white/5">
              {hardChapters.map((c, i) => {
                const tag = lvlTag(c.pct);
                return (
                  <div key={`${c.setNo}-${c.chapter}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-500">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">ชุด {c.setNo} · {chapterShort(c.chapter)}</div>
                      <div className="text-[11px] text-slate-400">{TYPE(c.chapter)} · ทำ {c.n} คน · ผ่าน {c.passRate}%</div>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums text-slate-100">{c.pct}%</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tag.c}`}>{tag.t}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ข้อที่พลาดเยอะสุด */}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
              <AlertTriangle size={18} className="text-amber-300" />
              <h2 className="text-xl font-extrabold text-ink">ข้อที่พลาดเยอะที่สุด</h2>
              <span className="ml-auto text-xs text-slate-400">เฉพาะบทกดถูก/ผิด</span>
            </div>
            {hardItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">{isConfigured() ? "ยังไม่มีข้อมูลรายข้อ" : "โหมดเดโม — ข้อมูลรายข้อแสดงเมื่อเชื่อมฐานข้อมูล"}</div>
            ) : (
              <div className="divide-y divide-white/5">
                {hardItems.map((it, i) => {
                  const tag = lvlTag(it.rate);
                  return (
                    <div key={`${it.setNo}-${it.chapter}-${it.item}`} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-500">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">ชุด {it.setNo} · {chapterShort(it.chapter)} · ข้อ {it.item}</div>
                        <div className="text-[11px] text-slate-400">ผิด {it.n - it.correct}/{it.n} คน</div>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold tabular-nums text-slate-100">ถูก {it.rate}%</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tag.c}`}>{tag.t}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
