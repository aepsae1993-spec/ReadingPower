import { ChapterResult, MAX_SET, CHAPTERS_PER_SET, ALL_CHAPTERS, isTestChapter, chapterFull, chapterPassed } from "./types";

export interface ChapterCell {
  chapter: number;
  isTest: boolean;
  score: number | null; // null = ยังไม่กรอก
  total: number;        // คะแนนเต็มของบทนั้น
  passed: boolean;
}
export interface SetProgress {
  setNo: number;
  cells: ChapterCell[]; // 50 บท
  passed: number;       // บทที่ผ่าน
  entered: number;      // บทที่กรอกแล้ว
  total: number;        // = CHAPTERS_PER_SET (50)
  complete: boolean;    // ผ่านครบทุกบท
}
export interface Progress {
  bySet: SetProgress[];
  completedSets: number;
  currentSet: number;
  currentChapter: number; // บทล่าสุดที่กรอก (1..50) หรือ 0
  isMaxed: boolean;
  totalPassed: number;
  grandTotal: number;     // MAX_SET * CHAPTERS_PER_SET
  rankValue: number;
  percent: number;        // % บทที่ผ่านในชุดปัจจุบัน
  started: boolean;
}

export function computeProgress(results: ChapterResult[]): Progress {
  const map = new Map<string, { score: number; total: number }>();
  for (const r of results) map.set(`${r.setNo}-${r.chapter}`, { score: r.score, total: r.total });

  const bySet: SetProgress[] = [];
  for (let s = 1; s <= MAX_SET; s++) {
    const cells: ChapterCell[] = ALL_CHAPTERS.map((c) => {
      const isTest = isTestChapter(c);
      const hit = map.get(`${s}-${c}`);
      if (!hit) return { chapter: c, isTest, score: null, total: chapterFull(c), passed: false };
      return { chapter: c, isTest, score: hit.score, total: hit.total, passed: chapterPassed(c, hit.score, hit.total) };
    });
    const entered = cells.filter((x) => x.score != null).length;
    const passed = cells.filter((x) => x.passed).length;
    bySet.push({ setNo: s, cells, passed, entered, total: CHAPTERS_PER_SET, complete: passed >= CHAPTERS_PER_SET });
  }

  let completedSets = 0;
  for (const sp of bySet) { if (sp.complete) completedSets++; else break; }

  // ตำแหน่งปัจจุบัน = ชุด/บท สูงสุดที่มีการกรอกคะแนน
  let started = false, cSet = 0, cChap = 0;
  for (let s = 1; s <= MAX_SET; s++) {
    for (const c of ALL_CHAPTERS) {
      if (map.has(`${s}-${c}`)) { started = true; cSet = s; cChap = c; }
    }
  }
  const currentSet = started ? cSet : 1;
  const currentChapter = started ? cChap : 0;

  const isMaxed = completedSets >= MAX_SET;
  const totalPassed = bySet.reduce((a, x) => a + x.passed, 0);
  const grandTotal = MAX_SET * CHAPTERS_PER_SET;
  const passedInCurrentSet = bySet[currentSet - 1].passed;

  // จัดอันดับ: ชุดสูงกว่าเก่งกว่า > ผ่านมากกว่า > บทไกลกว่า (คนยังไม่เริ่ม = ท้ายสุด)
  const rankValue = started ? (currentSet * 1_000_000 + totalPassed * 1_000 + currentChapter) : 0;

  return {
    bySet, completedSets, currentSet, currentChapter, isMaxed,
    totalPassed, grandTotal, rankValue, started,
    percent: started ? Math.round((passedInCurrentSet / CHAPTERS_PER_SET) * 100) : 0,
  };
}
