export interface Student {
  id: string;
  name: string;
  grade: number; // 1..6  (ป.1 - ป.6)
  room?: string; // e.g. "1" -> ป.4/1
  no?: number;   // เลขที่
}

/** คะแนนของบท 1 บท (บทปกติ เต็ม 20 · บททดสอบทุก 5 บท เต็ม 15) */
export interface ChapterResult {
  studentId: string;
  setNo: number;   // ชุด 1..6
  chapter: number; // บท 1..50
  score: number;   // คะแนนที่ได้
  total: number;   // คะแนนเต็มของบทนั้น (20 หรือ 15)
}

export const MAX_SET = 6;
export const CHAPTERS_PER_SET = 50;     // แต่ละชุดมี 50 บท

export const REGULAR_ITEMS = 20;        // บทปกติ: 20 ข้อ (กดถูก/ผิด)
export const REGULAR_PASS_RATIO = 0.5;  // ผ่านที่ 50% (>=10/20)

export const TEST_STEP = 5;             // บททดสอบทุก 5 บท
export const TEST_FULL = 15;            // บททดสอบ: คะแนนเต็ม 15
export const TEST_PASS = 8;             // ผ่านบททดสอบที่ 8/15

/** บททดสอบ: 5,10,...,50 (10 บท/ชุด) */
export const TEST_CHAPTERS = Array.from({ length: CHAPTERS_PER_SET / TEST_STEP }, (_, i) => (i + 1) * TEST_STEP);
/** ทุกบท: 1..50 */
export const ALL_CHAPTERS = Array.from({ length: CHAPTERS_PER_SET }, (_, i) => i + 1);

/** ระดับความยากง่ายรายข้อ จากสัดส่วนคนตอบถูก (p): ง่าย ≥0.8 · ยาก ≤0.25 · ที่เหลือ = ดี */
export const ITEM_EASY_P = 0.8;
export const ITEM_HARD_P = 0.25;
export type ItemLevel = "ง่าย" | "ยาก" | "ดี";
export const itemLevel = (p: number): ItemLevel => (p >= ITEM_EASY_P ? "ง่าย" : p <= ITEM_HARD_P ? "ยาก" : "ดี");

export const isTestChapter = (c: number) => c % TEST_STEP === 0 && c >= 1 && c <= CHAPTERS_PER_SET;
export const chapterFull = (c: number) => (isTestChapter(c) ? TEST_FULL : REGULAR_ITEMS);
export function chapterPassed(chapter: number, score: number, total: number): boolean {
  if (isTestChapter(chapter)) return score >= TEST_PASS;
  return total > 0 && score / total >= REGULAR_PASS_RATIO;
}
