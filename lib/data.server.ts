import "server-only";
import { unstable_noStore as noStore } from "next/cache";
import { createClient, isConfigured } from "./supabase/server";
import { buildMock } from "./mock";
import { buildRows, StudentRow } from "./data";
import { ChapterResult, Student } from "./types";

export const usingMock = () => !isConfigured();

async function fetchAll(): Promise<{ students: Student[]; results: ChapterResult[] }> {
  noStore(); // อ่านข้อมูลสดเสมอ ไม่ใช้ cache
  if (!isConfigured()) return buildMock();
  const sb = createClient();
  const [{ data: st }, { data: sc }] = await Promise.all([
    sb.from("students").select("id,name,grade,room,no").eq("active", true).order("grade").order("no", { nullsFirst: false }),
    sb.from("chapter_scores").select("student_id,set_no,chapter,score,total"),
  ]);
  const students: Student[] = (st ?? []).map((s: any) => ({ id: s.id, name: s.name, grade: s.grade, room: s.room ?? undefined, no: s.no ?? undefined }));
  const results: ChapterResult[] = (sc ?? []).map((r: any) => ({
    studentId: r.student_id, setNo: r.set_no, chapter: r.chapter, score: r.score, total: r.total,
  }));
  return { students, results };
}

export async function getAllStudents(): Promise<StudentRow[]> {
  const { students, results } = await fetchAll();
  return buildRows(students, results);
}

export async function getStudent(id: string): Promise<StudentRow | undefined> {
  return (await getAllStudents()).find((s) => s.id === id);
}

export async function getClassStudents(grade: number): Promise<StudentRow[]> {
  const rows = (await getAllStudents()).filter((r) => r.grade === grade);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

/** ประวัติการสอบซ้ำของนักเรียน (บทที่สอบ ≥2 ครั้ง) เรียงตามเวลา */
export interface RetakeRow { setNo: number; chapter: number; total: number; scores: number[] }
export async function getStudentAttempts(studentId: string): Promise<RetakeRow[]> {
  noStore();
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb.from("chapter_attempts").select("set_no,chapter,score,total,created_at").eq("student_id", studentId).order("created_at", { ascending: true });
  const map = new Map<string, RetakeRow>();
  (data ?? []).forEach((a: any) => {
    const k = `${a.set_no}-${a.chapter}`;
    let row = map.get(k);
    if (!row) { row = { setNo: a.set_no, chapter: a.chapter, total: a.total, scores: [] }; map.set(k, row); }
    row.scores.push(a.score);
  });
  return [...map.values()].filter((r) => r.scores.length >= 2).sort((a, b) => a.setNo - b.setNo || a.chapter - b.chapter);
}
