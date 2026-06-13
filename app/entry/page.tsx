import { createClient, isConfigured } from "@/lib/supabase/server";
import { CHAPTERS_PER_SET, isTestChapter, TEST_FULL, TEST_PASS } from "@/lib/types";
import EntrySelector from "@/components/EntrySelector";
import EntryGrid from "@/components/EntryGrid";
import ScoreGrid from "@/components/ScoreGrid";
import { gradeName } from "@/lib/design";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EntryPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  if (!isConfigured()) {
    return <div className="card p-8 text-center text-slate-300">โหมดเดโม — เชื่อมต่อ Supabase ก่อนจึงจะกรอกคะแนนได้</div>;
  }
  const grade = clamp(+(searchParams.grade ?? 1), 1, 6);
  const setNo = clamp(+(searchParams.set ?? 1), 1, 6);
  const chapter = clamp(+(searchParams.chapter ?? 1), 1, CHAPTERS_PER_SET);
  const test = isTestChapter(chapter);

  const sb = createClient();
  const { data: students } = await sb.from("students").select("id,name,no").eq("active", true).eq("grade", grade).order("no", { nullsFirst: false });
  const { data: existing } = await sb.from("chapter_scores").select("student_id,score,items").eq("set_no", setNo).eq("chapter", chapter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">กรอกคะแนน ✍️</h1>
        <p className="text-sm text-slate-300">
          {test
            ? `บททดสอบ — กรอกคะแนนเป็นตัวเลข (เต็ม ${TEST_FULL} · ผ่านที่ ${TEST_PASS})`
            : "บทปกติ — กดให้คะแนนรายข้อ (✓ = ตอบถูก · เต็ม 20 · ผ่านที่ 50%)"}
        </p>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <EntrySelector grade={grade} setNo={setNo} chapter={chapter} />
          <a href={`/api/export/chapter?grade=${grade}&set=${setNo}&chapter=${chapter}`}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25">
            <Download size={16} /> ดาวน์โหลด Excel (บทนี้)
          </a>
        </div>
        <div className="mt-3 text-sm text-slate-300">
          กำลังกรอก: <b className="text-indigo-300">{gradeName(grade)}</b> · ชุด {setNo} · บท {chapter}
          {test ? <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30">บททดสอบ</span> : null}
        </div>
      </div>

      {test ? (
        <ScoreGrid key={`${grade}-${setNo}-${chapter}`} setNo={setNo} chapter={chapter} students={(students ?? []) as any} initial={buildScoreInitial(existing)} />
      ) : (
        <EntryGrid key={`${grade}-${setNo}-${chapter}`} setNo={setNo} chapter={chapter} students={(students ?? []) as any} initial={buildItemsInitial(existing)} />
      )}
    </div>
  );
}

function buildScoreInitial(existing: any[] | null): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  (existing ?? []).forEach((e: any) => (out[e.student_id] = e.score ?? null));
  return out;
}

function buildItemsInitial(existing: any[] | null): Record<string, number[] | null> {
  const out: Record<string, number[] | null> = {};
  (existing ?? []).forEach((e: any) => (out[e.student_id] = Array.isArray(e.items) ? e.items : null));
  return out;
}

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : lo);
