"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveChapter(input: {
  setNo: number; stage: number; chapter: number;
  rows: { studentId: string; items: number[]; existed?: boolean }[];
}) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };

  const now = new Date().toISOString();
  // บันทึกเฉพาะคนที่มีคะแนน (>0) หรือเคยมีบันทึกอยู่แล้ว (กันสร้างแถว 0 ของคนที่ยังไม่ได้ทำ)
  const payload = input.rows.filter((r) => r.items.some((v) => v) || r.existed).map((r) => ({
    student_id: r.studentId,
    set_no: input.setNo,
    stage: input.stage,
    chapter: input.chapter,
    score: r.items.reduce((a, b) => a + (b ? 1 : 0), 0),
    total: r.items.length,
    items: r.items,
    updated_by: user.id,
    updated_at: now,
  }));

  const { error } = await sb.from("chapter_scores").upsert(payload, { onConflict: "student_id,set_no,stage,chapter" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout"); // ล้าง cache ทุกหน้า (โรงเรียน/ห้อง/รายคน) ให้เห็นคะแนนใหม่
  return { ok: true, count: payload.length };
}
