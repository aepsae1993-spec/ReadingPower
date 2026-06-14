import { ChapterResult, MAX_SET, CHAPTERS_PER_SET, ALL_CHAPTERS, isTestChapter, chapterFull, chapterPassed, isPostTest, POST_PASS_RATIO } from "./types";

export type SetStatus = "learning" | "awaiting" | "cleared"; // กำลังเรียน · รอ Post-Test · จบชุด

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
  chaptersDone: boolean; // ผ่านครบ 50 บท
  postPct: number | null; // ร้อยละ Post-Test (null = ยังไม่ทำ)
  postPassed: boolean;    // Post-Test ≥50%
  status: SetStatus;
  complete: boolean;    // = จบชุดจริง (ครบ 50 บท + Post-Test ผ่าน)
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
  const postAgg = new Map<number, { score: number; total: number }>(); // Post-Test รวมต่อชุด
  for (const r of results) {
    map.set(`${r.setNo}-${r.chapter}`, { score: r.score, total: r.total });
    if (isPostTest(r.chapter)) {
      const a = postAgg.get(r.setNo) ?? { score: 0, total: 0 };
      a.score += r.score; a.total += r.total; postAgg.set(r.setNo, a);
    }
  }
  const postPctOf = (s: number) => { const a = postAgg.get(s); return a && a.total > 0 ? a.score / a.total : null; };

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
    const chaptersDone = passed >= CHAPTERS_PER_SET;
    const postPct = postPctOf(s);
    const postPassed = postPct != null && postPct >= POST_PASS_RATIO;
    const complete = chaptersDone && postPassed; // จบจริงต้องผ่าน Post-Test ด้วย
    const status: SetStatus = !chaptersDone ? "learning" : complete ? "cleared" : "awaiting";
    bySet.push({ setNo: s, cells, passed, entered, total: CHAPTERS_PER_SET, chaptersDone, postPct, postPassed, status, complete });
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
