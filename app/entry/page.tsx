import { createClient, isConfigured } from "@/lib/supabase/server";
import { STAGES, stageChapters } from "@/lib/types";
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
  const stage = clamp(+(searchParams.stage ?? 1), 1, 3);
  const chapter = clamp(+(searchParams.chapter ?? 1), 1, stageChapters(stage as any));

  const sb = createClient();
  const { data: students } = await sb.from("students").select("id,name").eq("active", true).eq("grade", grade).order("name");
  const { data: existing } = await sb.from("chapter_scores").select("student_id,items").eq("set_no", setNo).eq("stage", stage).eq("chapter", chapter);
  const initial: Record<string, number[] | null> = {};
  (existing ?? []).forEach((e: any) => (initial[e.student_id] = e.items ?? null));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">กรอกคะแนน ✍️</h1>
        <p className="text-sm text-slate-400">เลือกชั้น · ชุด · ด่าน · บท แล้วกดให้คะแนนรายข้อ (✓ = ตอบถูก) · ผ่านที่ 50%</p>
      </div>

      <div className="card p-4">
        <EntrySelector grade={grade} setNo={setNo} stage={stage} chapter={chapter} />
        <div className="mt-3 text-sm text-slate-300">
          กำลังกรอก: <b className="text-indigo-300">{gradeName(grade)}</b> · ชุด {setNo} · ด่าน {stage} ({STAGES[stage - 1].short}) · บท {chapter}
        </div>
      </div>

      <EntryGrid setNo={setNo} stage={stage} chapter={chapter} students={(students ?? []) as any} initial={initial} />
    </div>
  );
}

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : lo);
