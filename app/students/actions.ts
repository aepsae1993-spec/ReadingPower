"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addStudent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const grade = Number(formData.get("grade"));
  const room = String(formData.get("room") ?? "").trim() || null;
  if (!name || !(grade >= 1 && grade <= 6)) return;
  const sb = createClient();
  await sb.from("students").insert({ name, grade, room });
  revalidatePath("/students");
}

export async function bulkAddStudents(formData: FormData) {
  const grade = Number(formData.get("grade"));
  const room = String(formData.get("room") ?? "").trim() || null;
  const names = String(formData.get("names") ?? "")
    .split("\n").map((s) => s.trim()).filter(Boolean);
  if (!names.length || !(grade >= 1 && grade <= 6)) return;
  const sb = createClient();
  await sb.from("students").insert(names.map((name) => ({ name, grade, room })));
  revalidatePath("/students");
}

export async function removeStudent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const sb = createClient();
  await sb.from("students").update({ active: false }).eq("id", id);
  revalidatePath("/students");
}
