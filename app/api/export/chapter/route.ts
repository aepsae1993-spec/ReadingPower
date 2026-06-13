import { NextRequest } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { chapterWorkbookBuffer, ChapterStudent } from "@/lib/excel";
import { CHAPTERS_PER_SET, isTestChapter } from "@/lib/types";

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
  const chapter = clamp(+(sp.get("chapter") ?? 1), 1, CHAPTERS_PER_SET);

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

  const buf = await chapterWorkbookBuffer({ grade, setNo, chapter, students: rows });
  const kind = isTestChapter(chapter) ? "ทดสอบ" : "รายข้อ";
  const filename = `คะแนน-ป${grade}-ชุด${setNo}-บท${chapter}-${kind}.xlsx`;
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
