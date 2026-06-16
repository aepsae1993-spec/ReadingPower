import { NextRequest } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { retakeWorkbookBuffer, RetakeExportRow } from "@/lib/excel";

export const dynamic = "force-dynamic";

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : lo);

export async function GET(req: NextRequest) {
  if (!isConfigured()) return new Response("ยังไม่ได้เชื่อมต่อฐานข้อมูล", { status: 400 });
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response("ยังไม่ได้เข้าสู่ระบบ", { status: 401 });

  const grade = clamp(+(req.nextUrl.searchParams.get("grade") ?? 1), 1, 6);
  const { data: students } = await sb.from("students").select("id,name,no").eq("active", true).eq("grade", grade).order("no", { nullsFirst: false });
  const stuList = students ?? [];
  const order = new Map(stuList.map((s: any, i: number) => [s.id, i]));

  const { data: attempts } = await sb
    .from("chapter_attempts")
    .select("student_id,set_no,chapter,score,total,created_at")
    .in("student_id", stuList.map((s: any) => s.id))
    .order("created_at", { ascending: true });

  // จัดกลุ่มตาม (นักเรียน, ชุด, บท) → เก็บคะแนนตามลำดับเวลา
  const groups = new Map<string, { sid: string; setNo: number; chapter: number; total: number; scores: number[] }>();
  (attempts ?? []).forEach((a: any) => {
    const k = `${a.student_id}-${a.set_no}-${a.chapter}`;
    let g = groups.get(k);
    if (!g) { g = { sid: a.student_id, setNo: a.set_no, chapter: a.chapter, total: a.total, scores: [] }; groups.set(k, g); }
    g.scores.push(a.score);
  });

  const byId = new Map(stuList.map((s: any) => [s.id, s]));
  const rows: RetakeExportRow[] = [...groups.values()]
    .filter((g) => g.scores.length >= 2)
    .sort((a, b) => (order.get(a.sid) ?? 0) - (order.get(b.sid) ?? 0) || a.setNo - b.setNo || a.chapter - b.chapter)
    .map((g) => { const s: any = byId.get(g.sid); return { no: s?.no ?? null, name: s?.name ?? "?", setNo: g.setNo, chapter: g.chapter, total: g.total, scores: g.scores }; });

  const buf = await retakeWorkbookBuffer({ grade, rows });
  const filename = `ประวัติพัฒนา-ป${grade}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="retakes.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
