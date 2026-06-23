import { NextRequest } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { chapterWorkbookBuffer, testPairWorkbookBuffer, ChapterStudent, PairStudent } from "@/lib/excel";
import { isValidChapterCode, slotKind, chapterShort, PRE_READ, PRE_RW, POST_READ, POST_RW } from "@/lib/types";

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
  const codeRaw = +(sp.get("chapter") ?? 1);
  const chapter = isValidChapterCode(codeRaw) ? codeRaw : 1;

  // คำประจำข้อ (best-effort)
  const fetchWords = async (chs: number[]) => {
    const { data } = await sb.from("chapter_words").select("chapter,words").eq("set_no", setNo).in("chapter", chs);
    const m = new Map<number, string[]>();
    (data ?? []).forEach((w: any) => m.set(w.chapter, Array.isArray(w.words) ? w.words : []));
    return m;
  };

  // Pre/Post-Test → ออกไฟล์รวม 2 ใบ (อ่าน+ถูกผิด) + เฉลี่ยรายคน
  const isPre = chapter === PRE_READ || chapter === PRE_RW;
  const isPost = chapter === POST_READ || chapter === POST_RW;
  if (isPre || isPost) {
    const codeA = isPre ? PRE_READ : POST_READ;
    const codeB = isPre ? PRE_RW : POST_RW;
    const [{ data: students }, { data: scores }] = await Promise.all([
      sb.from("students").select("id,name,no").eq("active", true).eq("grade", grade).order("no", { nullsFirst: false }),
      sb.from("chapter_scores").select("student_id,chapter,items,score,total").eq("set_no", setNo).in("chapter", [codeA, codeB]),
    ]);
    const byStu = new Map<string, { a: any; b: any }>();
    (scores ?? []).forEach((s: any) => {
      const e = byStu.get(s.student_id) ?? { a: null, b: null };
      if (s.chapter === codeA) e.a = s; else e.b = s;
      byStu.set(s.student_id, e);
    });
    const rows: PairStudent[] = [], gridA: ChapterStudent[] = [], gridB: ChapterStudent[] = [];
    (students ?? []).forEach((st: any) => {
      const e = byStu.get(st.id);
      rows.push({ no: st.no ?? null, name: st.name, a: e?.a?.score ?? null, b: e?.b?.score ?? null });
      gridA.push({ no: st.no ?? null, name: st.name, items: Array.isArray(e?.a?.items) ? e!.a.items : null, score: e?.a?.score ?? null, total: e?.a?.total ?? null });
      gridB.push({ no: st.no ?? null, name: st.name, items: Array.isArray(e?.b?.items) ? e!.b.items : null, score: e?.b?.score ?? null, total: e?.b?.total ?? null });
    });
    const wm = await fetchWords([codeA, codeB]);
    const buf = await testPairWorkbookBuffer({ grade, setNo, kind: isPre ? "pre" : "post", rows, gridA, gridB, wordsA: wm.get(codeA), wordsB: wm.get(codeB) });
    return xlsx(buf, `คะแนน-ป${grade}-ชุด${setNo}-${isPre ? "PreTest" : "PostTest"}-รวม.xlsx`);
  }

  const [{ data: students }, { data: scores }] = await Promise.all([
    sb.from("students").select("id,name,no").eq("active", true).eq("grade", grade).order("no", { nullsFirst: false }),
    sb.from("chapter_scores").select("student_id,items,score,total").eq("set_no", setNo).eq("chapter", chapter),
  ]);

  const byStu = new Map<string, { items: number[] | null; score: number | null; total: number | null }>();
  (scores ?? []).forEach((s: any) => byStu.set(s.student_id, { items: Array.isArray(s.items) ? s.items : null, score: s.score ?? null, total: s.total ?? null }));

  const rows: ChapterStudent[] = (students ?? []).map((s: any) => {
    const rec = byStu.get(s.id);
    return { no: s.no ?? null, name: s.name, items: rec?.items ?? null, score: rec?.score ?? null, total: rec?.total ?? null };
  });

  const wm = await fetchWords([chapter]);
  const buf = await chapterWorkbookBuffer({ grade, setNo, chapter, students: rows, words: wm.get(chapter) });
  const kind = slotKind(chapter) === "sentence" ? "ประโยค" : "รายข้อ";
  const filename = `คะแนน-ป${grade}-ชุด${setNo}-${chapterShort(chapter)}-${kind}.xlsx`;
  return xlsx(buf, filename);
}

function xlsx(buf: ArrayBuffer, filename: string) {
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
