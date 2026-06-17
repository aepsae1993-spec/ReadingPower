import { NextRequest } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { setSummaryWorkbookBuffer, SetSummaryStudent } from "@/lib/excel";
import { CHAPTERS_PER_SET } from "@/lib/types";

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

  const [{ data: students }, { data: scores }] = await Promise.all([
    sb.from("students").select("id,name,no").eq("active", true).eq("grade", grade).order("no", { nullsFirst: false }),
    sb.from("chapter_scores").select("student_id,chapter,score").eq("set_no", setNo),
  ]);

  // score ต่อ (นักเรียน, บท) — เฉพาะบท 1..50
  const byStu = new Map<string, (number | null)[]>();
  const blank = () => Array<number | null>(CHAPTERS_PER_SET).fill(null);
  (scores ?? []).forEach((s: any) => {
    if (s.chapter < 1 || s.chapter > CHAPTERS_PER_SET) return;
    if (!byStu.has(s.student_id)) byStu.set(s.student_id, blank());
    byStu.get(s.student_id)![s.chapter - 1] = s.score;
  });

  const rows: SetSummaryStudent[] = (students ?? []).map((st: any) => ({ no: st.no ?? null, name: st.name, scores: byStu.get(st.id) ?? blank() }));

  const buf = await setSummaryWorkbookBuffer({ grade, setNo, students: rows });
  const filename = `สรุปคะแนนรายบท-ป${grade}-ชุด${setNo}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="setsummary.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
