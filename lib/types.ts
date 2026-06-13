export interface Student {
  id: string;
  name: string;
  grade: number; // 1..6  (ป.1 - ป.6)
  room?: string; // e.g. "1" -> ป.4/1
  no?: number;   // เลขที่
}

/** คะแนนบททดสอบ 1 บท — มีเฉพาะบทที่ 5,10,...,50 ของแต่ละชุด (เต็ม 15) */
export interface ChapterResult {
  studentId: string;
  setNo: number;   // ชุด 1..6
  chapter: number; // บททดสอบ: 5,10,...,50
  score: number;   // คะแนนที่ได้ 0..15
  total: number;   // คะแนนเต็ม = 15
}

export const MAX_SET = 6;
export const CHAPTERS_PER_SET = 50;     // แต่ละชุดมี 50 บท
export const FULL_SCORE = 15;           // คะแนนเต็มต่อบททดสอบ
export const PASS_SCORE = 8;            // ผ่านที่ 8/15 (≈ ครึ่งหนึ่ง)

/** บททดสอบทุก 5 บท → 5,10,...,50 (10 บท/ชุด) */
export const SCORED_CHAPTERS = Array.from({ length: CHAPTERS_PER_SET / 5 }, (_, i) => (i + 1) * 5);
export const TESTS_PER_SET = SCORED_CHAPTERS.length; // 10
