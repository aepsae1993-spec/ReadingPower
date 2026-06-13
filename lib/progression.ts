import { ChapterResult, MAX_SET, SCORED_CHAPTERS, TESTS_PER_SET, PASS_SCORE, FULL_SCORE } from "./types";

export interface SetProgress {
  setNo: number;
  scores: (number | null)[]; // ตามลำดับ SCORED_CHAPTERS (null = ยังไม่กรอก)
  passed: number;            // บทที่ผ่าน (score >= PASS_SCORE)
  entered: number;           // บทที่กรอกคะแนนแล้ว
  total: number;             // = TESTS_PER_SET (10)
  complete: boolean;         // ผ่านครบทุกบท
}
export interface Progress {
  bySet: SetProgress[];
  completedSets: number;
  currentSet: number;
  currentChapter: number; // บททดสอบล่าสุดที่กรอก (5..50) หรือ 0 ถ้ายังไม่เริ่ม
  isMaxed: boolean;
  totalPassed: number;
  grandTotal: number;     // MAX_SET * TESTS_PER_SET
  rankValue: number;
  percent: number;        // % บทที่ผ่านในชุดปัจจุบัน
  started: boolean;        // เคยกรอกคะแนนแล้วหรือยัง
}

export function computeProgress(results: ChapterResult[]): Progress {
  // map (set-chapter) -> score; รับเฉพาะรูปแบบใหม่ (เต็ม 15) ที่บททดสอบเท่านั้น
  const scoreMap = new Map<string, number>();
  for (const r of results) {
    if (r.total !== FULL_SCORE) continue;
    if (!SCORED_CHAPTERS.includes(r.chapter)) continue;
    scoreMap.set(`${r.setNo}-${r.chapter}`, r.score);
  }

  const bySet: SetProgress[] = [];
  for (let s = 1; s <= MAX_SET; s++) {
    const scores = SCORED_CHAPTERS.map((c) => {
      const v = scoreMap.get(`${s}-${c}`);
      return v == null ? null : v;
    });
    const entered = scores.filter((v) => v != null).length;
    const passed = scores.filter((v) => v != null && v >= PASS_SCORE).length;
    bySet.push({ setNo: s, scores, passed, entered, total: TESTS_PER_SET, complete: passed >= TESTS_PER_SET });
  }

  let completedSets = 0;
  for (const sp of bySet) { if (sp.complete) completedSets++; else break; }

  // ตำแหน่งปัจจุบัน = ชุด/บท สูงสุดที่มีการกรอกคะแนน
  let started = false, cSet = 0, cChap = 0;
  for (let s = 1; s <= MAX_SET; s++) {
    for (const c of SCORED_CHAPTERS) {
      if (scoreMap.has(`${s}-${c}`)) { started = true; cSet = s; cChap = c; }
    }
  }
  const currentSet = started ? cSet : 1;
  const currentChapter = started ? cChap : 0;

  const isMaxed = completedSets >= MAX_SET;
  const totalPassed = bySet.reduce((a, x) => a + x.passed, 0);
  const grandTotal = MAX_SET * TESTS_PER_SET;
  const passedInCurrentSet = bySet[currentSet - 1].passed;

  // จัดอันดับ: ชุดสูงกว่าเก่งกว่า > ผ่านมากกว่า > บทไกลกว่า (คนยังไม่เริ่ม = ท้ายสุด)
  const rankValue = started ? (currentSet * 1_000_000 + totalPassed * 1_000 + currentChapter) : 0;

  return {
    bySet, completedSets, currentSet, currentChapter, isMaxed,
    totalPassed, grandTotal, rankValue, started,
    percent: started ? Math.round((passedInCurrentSet / TESTS_PER_SET) * 100) : 0,
  };
}
