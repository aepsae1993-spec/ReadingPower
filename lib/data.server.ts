import "server-only";
import { createClient, isConfigured } from "./supabase/server";
import { buildMock } from "./mock";
import { buildRows, StudentRow } from "./data";
import { ChapterResult, Student } from "./types";

export const usingMock = () => !isConfigured();

async function fetchAll(): Promise<{ students: Student[]; results: ChapterResult[] }> {
  if (!isConfigured()) return buildMock();
  const sb = createClient();
  const [{ data: st }, { data: sc }] = await Promise.all([
    sb.from("students").select("id,name,grade,room").eq("active", true).order("grade"),
    sb.from("chapter_scores").select("student_id,set_no,stage,chapter,score,total"),
  ]);
  const students: Student[] = (st ?? []).map((s: any) => ({ id: s.id, name: s.name, grade: s.grade, room: s.room ?? undefined }));
  const results: ChapterResult[] = (sc ?? []).map((r: any) => ({
    studentId: r.student_id, setNo: r.set_no, stage: r.stage, chapter: r.chapter, score: r.score, total: r.total,
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
