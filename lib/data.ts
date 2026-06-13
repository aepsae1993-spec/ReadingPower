import { computeProgress, Progress } from "./progression";
import { recommendStartSet } from "./placement";
import { ChapterResult, Student } from "./types";

export interface StudentRow extends Student {
  progress: Progress;
  rank?: number;
  recommendedSet: number | null; // ชุดเริ่มต้นที่แนะนำจาก Pre-Test
  placementNote: string;
  placementNeed: number | null;  // ต้องทำ Pre-Test ชุดนี้ก่อนจึงสรุปได้
}

/** pure: รวมนักเรียน + คะแนน → คำนวณความก้าวหน้า + จัดอันดับ */
export function buildRows(students: Student[], results: ChapterResult[]): StudentRow[] {
  const byStu = new Map<string, ChapterResult[]>();
  for (const r of results) {
    if (!byStu.has(r.studentId)) byStu.set(r.studentId, []);
    byStu.get(r.studentId)!.push(r);
  }
  const rows: StudentRow[] = students.map((s) => {
    const res = byStu.get(s.id) ?? [];
    const place = recommendStartSet(s.grade, res);
    return { ...s, progress: computeProgress(res), recommendedSet: place.set, placementNote: place.note, placementNeed: place.need };
  });
  rows.sort((a, b) =>
    b.progress.rankValue - a.progress.rankValue ||
    (a.no ?? 9999) - (b.no ?? 9999) ||
    a.name.localeCompare(b.name, "th")
  );
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
