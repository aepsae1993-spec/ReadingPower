import { NextRequest } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { setWorkbookBuffer, ChapterStudent, PairStudent } from "@/lib/excel";
import { PRE_READ, PRE_RW, POST_READ, POST_RW, ALL_CHAPTERS } from "@/lib/types";

export const dynamic = "force-dynamic";

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : lo);

export async function GET(req: NextRequest) {
  if (!isConfigured()) return new Response("ยังไม่ได้เชื่อมต่อฐานข้อมูล", { status: 400 });
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response("ยังไม่ได้เข้าสู่ระบบ", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const grade = clamp(+(sp.get("grade") ?? 1), 1, 6);
  const setNo = clamp(+(sp.get("set") ?? 1), 1, 6);

  const [{ data: students }, { data: scores }, { data: wordRows }] = await Promise.all([
    sb.from("students").select("id,name,no").eq("active", true).eq("grade", grade).order("no", { nullsFirst: false }),
    sb.from("chapter_scores").select("student_id,chapter,items,score,total").eq("set_no", setNo),
    sb.from("chapter_words").select("chapter,words").eq("set_no", setNo),
  ]);
  const wordsByChapter = new Map<number, string[]>();
  (wordRows ?? []).forEach((w: any) => wordsByChapter.set(w.chapter, Array.isArray(w.words) ? w.words : []));

  // จัดกลุ่มคะแนนตามบท
  const byChapter = new Map<number, Map<string, { items: number[] | null; score: number | null; total: number | null }>>();
  (scores ?? []).forEach((s: any) => {
    if (!byChapter.has(s.chapter)) byChapter.set(s.chapter, new Map());
    byChapter.get(s.chapter)!.set(s.student_id, { items: Array.isArray(s.items) ? s.items : null, score: s.score ?? null, total: s.total ?? null });
  });

  // ลำดับชีต: Pre-Test (เสมอ) → บท 1-50 ที่มีคะแนน → Post-Test (เสมอ)
  const codes = [PRE_READ, PRE_RW, ...ALL_CHAPTERS.filter((c) => byChapter.has(c)), POST_READ, POST_RW];
  const stuList = students ?? [];
  const perChapter = codes.map((chapter) => {
    const recs = byChapter.get(chapter);
    const rows: ChapterStudent[] = stuList.map((st: any) => {
      const rec = recs?.get(st.id);
      return { no: st.no ?? null, name: st.name, items: rec?.items ?? null, score: rec?.score ?? null, total: rec?.total ?? null };
    });
    return { chapter, students: rows, words: wordsByChapter.get(chapter) };
  });

  const pairRows = (a: number, b: number): PairStudent[] => stuList.map((st: any) => ({ no: st.no ?? null, name: st.name, a: byChapter.get(a)?.get(st.id)?.score ?? null, b: byChapter.get(b)?.get(st.id)?.score ?? null }));
  const prePair = pairRows(PRE_READ, PRE_RW);
  const postPair = pairRows(POST_READ, POST_RW);

  const buf = await setWorkbookBuffer({ grade, setNo, perChapter, prePair, postPair });
  const filename = `คะแนนทั้งชุด-ป${grade}-ชุด${setNo}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="set.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
