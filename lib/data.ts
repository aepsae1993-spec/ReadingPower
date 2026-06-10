import { computeProgress, Progress } from "./progression";
import { ChapterResult, Student } from "./types";

export interface StudentRow extends Student {
  progress: Progress;
  rank?: number;
}

/** pure: รวมนักเรียน + คะแนน → คำนวณความก้าวหน้า + จัดอันดับ */
export function buildRows(students: Student[], results: ChapterResult[]): StudentRow[] {
  const byStu = new Map<string, ChapterResult[]>();
  for (const r of results) {
    if (!byStu.has(r.studentId)) byStu.set(r.studentId, []);
    byStu.get(r.studentId)!.push(r);
  }
  const rows: StudentRow[] = students.map((s) => ({ ...s, progress: computeProgress(byStu.get(s.id) ?? []) }));
  rows.sort((a, b) => b.progress.rankValue - a.progress.rankValue || a.name.localeCompare(b.name, "th"));
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
