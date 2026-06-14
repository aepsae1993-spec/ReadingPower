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

/** บทที่หาร 5 ลงตัว (5,10,...,50) = บทแต่งประโยค (กรอกคะแนนเต็ม 15) */
export const isTestChapter = (c: number) => c % TEST_STEP === 0 && c >= 1 && c <= CHAPTERS_PER_SET;
export const chapterFull = (c: number) => (isTestChapter(c) ? TEST_FULL : REGULAR_ITEMS);
export function chapterPassed(chapter: number, score: number, total: number): boolean {
  if (isTestChapter(chapter)) return score >= TEST_PASS;
  return total > 0 && score / total >= REGULAR_PASS_RATIO;
}

// ── Pre-Test / Post-Test (นอกเหนือ 50 บท) — กดถูก/ผิด 20 ข้อ ─────────────
export const PRE_READ = 101, PRE_RW = 102, POST_READ = 103, POST_RW = 104;
export const SPECIAL_CODES = [PRE_READ, PRE_RW, POST_READ, POST_RW];

export type SlotKind = "checklist" | "sentence"; // checklist = 20 ข้อ · sentence = คะแนน 15
export interface ChapterSlot { code: number; label: string; kind: SlotKind }

/** ลำดับช่องบทในดรอปดาวน์: Pre-Test → บท 1-50 → Post-Test */
export function chapterSlots(): ChapterSlot[] {
  return [
    { code: PRE_READ, label: "Pre-Test อ่าน", kind: "checklist" },
    { code: PRE_RW, label: "Pre-Test ถูกผิด", kind: "checklist" },
    ...ALL_CHAPTERS.map((c): ChapterSlot => ({ code: c, label: isTestChapter(c) ? `บท ${c} · ประโยค` : `บท ${c}`, kind: isTestChapter(c) ? "sentence" : "checklist" })),
    { code: POST_READ, label: "Post-Test อ่าน", kind: "checklist" },
    { code: POST_RW, label: "Post-Test ถูกผิด", kind: "checklist" },
  ];
}

export const POST_PASS_RATIO = 0.5; // Post-Test ผ่านที่ 50% → ปิดชุด เลื่อนขึ้นชุดถัดไป
export const isPostTest = (c: number) => c === POST_READ || c === POST_RW;

export const isValidChapterCode = (c: number) => (c >= 1 && c <= CHAPTERS_PER_SET) || SPECIAL_CODES.includes(c);
export const slotKind = (c: number): SlotKind => (isTestChapter(c) ? "sentence" : "checklist");

/** ชื่อเต็มของช่องบท (ใช้บนหัวรายงาน Excel) */
export function chapterName(code: number): string {
  switch (code) {
    case PRE_READ: return "Pre-Test อ่าน";
    case PRE_RW: return "Pre-Test ถูกผิด";
    case POST_READ: return "Post-Test อ่าน";
    case POST_RW: return "Post-Test ถูกผิด";
    default: return isTestChapter(code) ? `บทที่ ${code} (แต่งประโยค)` : `บทที่ ${code}`;
  }
}
/** ชื่อสั้น (ใช้ในตารางรายบุคคล) */
export function chapterShort(code: number): string {
  switch (code) {
    case PRE_READ: return "Pre-อ่าน";
    case PRE_RW: return "Pre-ถูกผิด";
    case POST_READ: return "Post-อ่าน";
    case POST_RW: return "Post-ถูกผิด";
    default: return isTestChapter(code) ? `บท ${code} · ประโยค` : `บท ${code}`;
  }
}
