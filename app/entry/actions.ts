"use server";
import { createClient } from "@/lib/supabase/server";
import { REGULAR_ITEMS, TEST_FULL } from "@/lib/types";
import { revalidatePath } from "next/cache";

const ROW_BASE = { stage: 1 as const }; // stage คงไว้เพื่อความเข้ากันได้กับตารางเดิม

type Entry = { studentId: string; score: number; items: number[] };

/** บันทึกการสอบ 1 ครั้ง: เก็บประวัติทุกครั้ง + อัปเดต chapter_scores เป็น "คะแนนดีที่สุด" */
async function recordAttempts(sb: ReturnType<typeof createClient>, userId: string, setNo: number, chapter: number, total: number, entries: Entry[]) {
  if (entries.length === 0) return { ok: true as const, count: 0 };
  const now = new Date().toISOString();

  // 1) บันทึกประวัติทุกครั้ง (best-effort — ถ้ายังไม่ได้สร้างตาราง chapter_attempts ก็ข้ามไป)
  await sb.from("chapter_attempts").insert(entries.map((e) => ({
    ...ROW_BASE, student_id: e.studentId, set_no: setNo, chapter, score: e.score, total, items: e.items, created_at: now, updated_by: userId,
  })));

  // 2) คะแนนดีสุดเดิม
  const ids = entries.map((e) => e.studentId);
  const { data: cur } = await sb.from("chapter_scores").select("student_id,score,total").eq("set_no", setNo).eq("chapter", chapter).in("student_id", ids);
  const bestRatio = new Map<string, number>();
  (cur ?? []).forEach((c: any) => bestRatio.set(c.student_id, c.total > 0 ? c.score / c.total : 0));

  // 3) อัปเดตเฉพาะคนที่ครั้งนี้ดีกว่าเดิม (เก็บคะแนนดีสุด)
  const payload = entries
    .filter((e) => (total > 0 ? e.score / total : 0) > (bestRatio.get(e.studentId) ?? -1))
    .map((e) => ({ ...ROW_BASE, student_id: e.studentId, set_no: setNo, chapter, score: e.score, total, items: e.items, updated_by: userId, updated_at: now }));

  if (payload.length) {
    const { error } = await sb.from("chapter_scores").upsert(payload, { onConflict: "student_id,set_no,stage,chapter" });
    if (error) return { ok: false as const, error: error.message };
  }
  return { ok: true as const, count: entries.length };
}

/** บทปกติ: กดถูก/ผิด 20 ข้อ (rows = เฉพาะคนที่แก้ไข · words = คำประจำข้อ) */
export async function saveChecklist(input: { setNo: number; chapter: number; rows: { studentId: string; items: number[] }[]; words?: string[] }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };

  // บันทึกคำประจำข้อ (best-effort — ถ้ายังไม่ได้สร้างตาราง chapter_words ก็ข้าม)
  if (input.words) {
    await sb.from("chapter_words").upsert({ ...ROW_BASE, set_no: input.setNo, chapter: input.chapter, words: input.words, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "set_no,stage,chapter" });
  }

  const entries: Entry[] = input.rows.map((r) => ({ studentId: r.studentId, score: r.items.reduce((a, b) => a + (b ? 1 : 0), 0), items: r.items }));
  const res = await recordAttempts(sb, user.id, input.setNo, input.chapter, REGULAR_ITEMS, entries);
  if (!res.ok) return res;
  revalidatePath("/", "layout");
  return { ok: true, count: res.count };
}

/** บันทึกคำประจำข้อ (โจทย์รายข้อ) ต่อบท — คืน error จริงถ้ายังไม่ได้สร้างตาราง chapter_words */
export async function saveChapterWords(input: { setNo: number; chapter: number; words: string[] }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };
  const { error } = await sb.from("chapter_words").upsert(
    { ...ROW_BASE, set_no: input.setNo, chapter: input.chapter, words: input.words, updated_by: user.id, updated_at: new Date().toISOString() },
    { onConflict: "set_no,stage,chapter" }
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** ลบคะแนน "บทนี้" ของทั้งห้อง (คะแนนจริง + ประวัติ) — ลบถาวร ไม่เหลือร่องรอย */
export async function deleteChapter(input: { grade: number; setNo: number; chapter: number }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };

  const { data: studs } = await sb.from("students").select("id").eq("active", true).eq("grade", input.grade);
  const ids = (studs ?? []).map((s: any) => s.id);
  if (ids.length === 0) return { ok: true, count: 0 };

  // ลบประวัติ (best-effort) ก่อน แล้วลบคะแนนจริง
  await sb.from("chapter_attempts").delete().eq("set_no", input.setNo).eq("chapter", input.chapter).in("student_id", ids);
  const { error, count } = await sb.from("chapter_scores").delete({ count: "exact" }).eq("set_no", input.setNo).eq("chapter", input.chapter).in("student_id", ids);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, count: count ?? 0 };
}

/** บททดสอบ/แต่งประโยค/Pre-Post: กรอกคะแนนเป็นตัวเลข */
export async function saveScore(input: { setNo: number; chapter: number; rows: { studentId: string; score: number | null }[] }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };

  const total = TEST_FULL;
  const entries: Entry[] = input.rows.filter((r) => r.score != null).map((r) => ({ studentId: r.studentId, score: r.score as number, items: [] }));

  const res = await recordAttempts(sb, user.id, input.setNo, input.chapter, total, entries);
  if (!res.ok) return res;
  revalidatePath("/", "layout");
  return { ok: true, count: res.count };
}
