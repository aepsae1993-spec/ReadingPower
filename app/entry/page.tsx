import { createClient, isConfigured } from "@/lib/supabase/server";
import { SCORED_CHAPTERS, TESTS_PER_SET, FULL_SCORE, PASS_SCORE } from "@/lib/types";
import EntrySelector from "@/components/EntrySelector";
import EntryGrid from "@/components/EntryGrid";
import { gradeName } from "@/lib/design";

export const dynamic = "force-dynamic";

export default async function EntryPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  if (!isConfigured()) {
    return <div className="card p-8 text-center text-slate-300">โหมดเดโม — เชื่อมต่อ Supabase ก่อนจึงจะกรอกคะแนนได้</div>;
  }
  const grade = clamp(+(searchParams.grade ?? 1), 1, 6);
  const setNo = clamp(+(searchParams.set ?? 1), 1, 6);

  const sb = createClient();
  const { data: students } = await sb.from("students").select("id,name,no").eq("active", true).eq("grade", grade).order("no", { nullsFirst: false });
  const { data: existing } = await sb.from("chapter_scores").select("student_id,chapter,score").eq("set_no", setNo).eq("total", FULL_SCORE);

  const initial: Record<string, (number | null)[]> = {};
  (existing ?? []).forEach((e: any) => {
    const idx = SCORED_CHAPTERS.indexOf(e.chapter);
    if (idx < 0) return;
    (initial[e.student_id] ??= Array(TESTS_PER_SET).fill(null))[idx] = e.score;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">กรอกคะแนน ✍️</h1>
        <p className="text-sm text-slate-300">เลือกชั้น · ชุด แล้วกรอกคะแนนบททดสอบ (บทที่ 5,10,…,50 · เต็มบทละ {FULL_SCORE} · ผ่านที่ {PASS_SCORE})</p>
      </div>

      <div className="card p-4">
        <EntrySelector grade={grade} setNo={setNo} />
        <div className="mt-3 text-sm text-slate-300">
          กำลังกรอก: <b className="text-indigo-300">{gradeName(grade)}</b> · ชุด {setNo} · {TESTS_PER_SET} บททดสอบ
        </div>
      </div>

      <EntryGrid key={`${grade}-${setNo}`} setNo={setNo} students={(students ?? []) as any} initial={initial} />
    </div>
  );
}

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : lo);
