"use server";
import { createClient } from "@/lib/supabase/server";
import { REGULAR_ITEMS, TEST_FULL } from "@/lib/types";
import { revalidatePath } from "next/cache";

const ROW_BASE = { stage: 1 as const }; // stage คงไว้เพื่อความเข้ากันได้กับตารางเดิม

/** บทปกติ: กดถูก/ผิด 20 ข้อ */
export async function saveChecklist(input: {
  setNo: number; chapter: number;
  rows: { studentId: string; items: number[]; existed?: boolean }[];
}) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };

  const now = new Date().toISOString();
  // บันทึกเฉพาะคนที่มีคะแนน (>0) หรือเคยมีบันทึกอยู่แล้ว
  const payload = input.rows.filter((r) => r.items.some((v) => v) || r.existed).map((r) => ({
    ...ROW_BASE,
    student_id: r.studentId,
    set_no: input.setNo,
    chapter: input.chapter,
    score: r.items.reduce((a, b) => a + (b ? 1 : 0), 0),
    total: REGULAR_ITEMS,
    items: r.items,
    updated_by: user.id,
    updated_at: now,
  }));

  if (payload.length === 0) return { ok: true, count: 0 };
  const { error } = await sb.from("chapter_scores").upsert(payload, { onConflict: "student_id,set_no,stage,chapter" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, count: payload.length };
}

/** บททดสอบ (ทุก 5 บท): กรอกคะแนนเป็นตัวเลข เต็ม 15 */
export async function saveScore(input: {
  setNo: number; chapter: number;
  rows: { studentId: string; score: number | null }[];
}) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };

  const now = new Date().toISOString();
  const payload = input.rows.filter((r) => r.score != null).map((r) => ({
    ...ROW_BASE,
    student_id: r.studentId,
    set_no: input.setNo,
    chapter: input.chapter,
    score: r.score as number,
    total: TEST_FULL,
    items: [], // ไม่ใช้ในบททดสอบ (ส่ง [] กันชน NOT NULL)
    updated_by: user.id,
    updated_at: now,
  }));

  if (payload.length === 0) return { ok: true, count: 0 };
  const { error } = await sb.from("chapter_scores").upsert(payload, { onConflict: "student_id,set_no,stage,chapter" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, count: payload.length };
}
