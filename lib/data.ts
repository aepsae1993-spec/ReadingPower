import { buildMock } from "./mock";
import { computeProgress, Progress } from "./progression";
import { Student } from "./types";

export interface StudentRow extends Student {
  progress: Progress;
  rank?: number;
}

/** Data source. Swap buildMock() for Supabase queries later (lib/data.server.ts). */
export function getAllStudents(): StudentRow[] {
  const { students, results } = buildMock();
  const byStu = new Map<string, typeof results>();
  for (const r of results) {
    if (!byStu.has(r.studentId)) byStu.set(r.studentId, []);
    byStu.get(r.studentId)!.push(r);
  }
  const rows: StudentRow[] = students.map((s) => ({ ...s, progress: computeProgress(byStu.get(s.id) ?? []) }));
  rows.sort((a, b) => b.progress.rankValue - a.progress.rankValue);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export function getStudent(id: string): StudentRow | undefined {
  return getAllStudents().find((s) => s.id === id);
}
