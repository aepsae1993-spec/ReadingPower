import { NextRequest } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { studentWorkbookBuffer, StudentRecord } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isConfigured()) return new Response("ยังไม่ได้เชื่อมต่อฐานข้อมูล", { status: 400 });
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response("ยังไม่ได้เข้าสู่ระบบ", { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("ไม่พบรหัสนักเรียน", { status: 400 });

  const { data: stu } = await sb.from("students").select("id,name,grade").eq("id", id).single();
  if (!stu) return new Response("ไม่พบนักเรียน", { status: 404 });

  const { data: scores } = await sb.from("chapter_scores").select("set_no,chapter,score,total").eq("student_id", id);
  const records: StudentRecord[] = (scores ?? []).map((s: any) => ({ setNo: s.set_no, chapter: s.chapter, score: s.score, total: s.total }));

  const buf = await studentWorkbookBuffer({ name: stu.name, grade: stu.grade, records });
  const filename = `คะแนนรายบุคคล-${stu.name}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="student.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
