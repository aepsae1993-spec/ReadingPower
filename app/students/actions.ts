"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function nextNo(sb: ReturnType<typeof createClient>, grade: number) {
  const { data } = await sb.from("students").select("no").eq("grade", grade).eq("active", true).order("no", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
  return ((data?.no as number | null) ?? 0) + 1;
}

export async function addStudent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const grade = Number(formData.get("grade"));
  const room = String(formData.get("room") ?? "").trim() || null;
  if (!name || !(grade >= 1 && grade <= 6)) return;
  const sb = createClient();
  await sb.from("students").insert({ name, grade, room, no: await nextNo(sb, grade) });
  revalidatePath("/students");
}

export async function bulkAddStudents(formData: FormData) {
  const grade = Number(formData.get("grade"));
  const room = String(formData.get("room") ?? "").trim() || null;
  const names = String(formData.get("names") ?? "")
    .split("\n").map((s) => s.trim()).filter(Boolean);
  if (!names.length || !(grade >= 1 && grade <= 6)) return;
  const sb = createClient();
  const start = await nextNo(sb, grade);
  await sb.from("students").insert(names.map((name, i) => ({ name, grade, room, no: start + i })));
  revalidatePath("/students");
}

export async function removeStudent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const sb = createClient();
  await sb.from("students").update({ active: false }).eq("id", id);
  revalidatePath("/students");
}

// รหัสผู้ดูแล (ตั้งผ่าน env ได้ · ค่าเริ่มต้น admin1234)
const ADMIN_PASSWORD = process.env.ADMIN_DELETE_PASSWORD || "admin1234";

/** ลบคะแนนทั้งหมด (chapter_scores) — เก็บข้อมูลนักเรียนไว้ · ต้องใส่รหัสผู้ดูแล */
export async function deleteAllScores(password: string) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "ยังไม่ได้เข้าสู่ระบบ" };
  if (password !== ADMIN_PASSWORD) return { ok: false, error: "รหัสผู้ดูแลไม่ถูกต้อง" };

  const { error, count } = await sb.from("chapter_scores").delete({ count: "exact" }).not("id", "is", null);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, count: count ?? 0 };
}
