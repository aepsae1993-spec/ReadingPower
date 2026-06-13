"use server";
import { createClient } from "@/lib/supabase/server";
import { SCORED_CHAPTERS, FULL_SCORE } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function saveSet(input: {
  setNo: number;
  rows: { studentId: string; scores: (number | null)[] }[];
}) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };

  const now = new Date().toISOString();
  // บันทึกเฉพาะช่องที่กรอกคะแนนแล้ว (ไม่ null) — stage=1 คงไว้เพื่อความเข้ากันได้กับตารางเดิม
  const payload: any[] = [];
  for (const r of input.rows) {
    r.scores.forEach((v, i) => {
      if (v == null) return;
      payload.push({
        student_id: r.studentId,
        set_no: input.setNo,
        stage: 1,
        chapter: SCORED_CHAPTERS[i],
        score: v,
        total: FULL_SCORE,
        items: [], // คอลัมน์เดิม — ระบบใหม่ใช้ score ตรง ๆ (ส่ง [] กันชน NOT NULL)
        updated_by: user.id,
        updated_at: now,
      });
    });
  }

  if (payload.length === 0) return { ok: true, count: 0 };

  const { error } = await sb.from("chapter_scores").upsert(payload, { onConflict: "student_id,set_no,stage,chapter" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout"); // ล้าง cache ทุกหน้า (โรงเรียน/ห้อง/รายคน) ให้เห็นคะแนนใหม่
  return { ok: true, count: payload.length };
}
