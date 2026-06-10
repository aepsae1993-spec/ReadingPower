export type StageId = 1 | 2 | 3;

export interface Student {
  id: string;
  name: string;
  grade: number; // 1..6  (ป.1 - ป.6)
  room?: string; // e.g. "1" -> ป.4/1
  no?: number;   // เลขที่
}

/** One graded chapter result (e.g. ชุด3 ด่าน1 บท12 = 18/20) */
export interface ChapterResult {
  studentId: string;
  setNo: number; // ชุด 1..6
  stage: StageId; // 1 บัญชีคำ, 2 ถูกผิด, 3 แต่งประโยค
  chapter: number; // บท
  score: number; // ทำถูกกี่ข้อ
  total: number; // ข้อทั้งหมด
}

export const PASS_RATIO = 0.5; // ผ่านที่ 50%
export const MAX_SET = 6;

export interface StageMeta {
  id: StageId;
  name: string;
  short: string;
  chapters: number;
}

export const STAGES: StageMeta[] = [
  { id: 1, name: "บัญชีคำพื้นฐาน", short: "บัญชีคำ", chapters: 30 },
  { id: 2, name: "อ่านถูกผิด", short: "ถูกผิด", chapters: 20 },
  { id: 3, name: "แต่งประโยค", short: "แต่งประโยค", chapters: 20 },
];

export function stageChapters(stage: StageId): number {
  return STAGES[stage - 1].chapters;
}
