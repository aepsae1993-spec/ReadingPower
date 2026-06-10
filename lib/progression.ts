import { ChapterResult, MAX_SET, PASS_RATIO, STAGES, StageId } from "./types";

export interface StageProgress {
  stage: StageId;
  passed: number;
  total: number;
  complete: boolean;
}
export interface SetProgress {
  setNo: number;
  stages: StageProgress[];
  complete: boolean;
  passedTotal: number;
  total: number;
}
export interface Progress {
  bySet: SetProgress[];
  completedSets: number;
  currentSet: number;
  currentStage: StageId;
  currentChapter: number; // บทถัดไปที่ต้องทำ (หรือบทสุดท้ายถ้าจบ)
  isMaxed: boolean;
  totalPassed: number;
  grandTotal: number;
  rankValue: number;
  percent: number; // ความก้าวหน้าในชุดปัจจุบัน %
  started: boolean; // เคยมีคะแนน (>0) แล้วหรือยัง
}

const isPass = (r: ChapterResult) => r.total > 0 && r.score / r.total >= PASS_RATIO;

export function computeProgress(results: ChapterResult[]): Progress {
  const passed = new Map<string, Set<number>>();
  for (const r of results) {
    if (!isPass(r)) continue;
    const k = `${r.setNo}-${r.stage}`;
    if (!passed.has(k)) passed.set(k, new Set());
    passed.get(k)!.add(r.chapter);
  }
  const passedCount = (s: number, st: StageId) => passed.get(`${s}-${st}`)?.size ?? 0;

  const bySet: SetProgress[] = [];
  for (let s = 1; s <= MAX_SET; s++) {
    const stages: StageProgress[] = STAGES.map((m) => {
      const p = Math.min(passedCount(s, m.id), m.chapters);
      return { stage: m.id, passed: p, total: m.chapters, complete: p >= m.chapters };
    });
    const passedTotal = stages.reduce((a, x) => a + x.passed, 0);
    const total = stages.reduce((a, x) => a + x.total, 0);
    bySet.push({ setNo: s, stages, complete: stages.every((x) => x.complete), passedTotal, total });
  }

  let completedSets = 0;
  for (const sp of bySet) { if (sp.complete) completedSets++; else break; }

  // ตำแหน่งปัจจุบัน = "จุดล่าสุดที่มีคะแนนจริง (>0)" — 0/20 (คนที่ยังไม่ได้ทำ) ไม่นับ
  const scored = results.filter((r) => r.score > 0);
  const started = scored.length > 0;
  let cSet = 0, cStage = 0, cChap = 0;
  for (const r of scored) {
    if (r.setNo > cSet || (r.setNo === cSet && r.stage > cStage) || (r.setNo === cSet && r.stage === cStage && r.chapter > cChap)) {
      cSet = r.setNo; cStage = r.stage; cChap = r.chapter;
    }
  }
  const currentSet = started ? cSet : 1;
  const currentStage = (started ? cStage : 1) as StageId;
  const currentChapter = started ? cChap : 1;

  const isMaxed = completedSets >= MAX_SET;
  const totalPassed = bySet.reduce((a, x) => a + x.passedTotal, 0);
  const grandTotal = bySet.reduce((a, x) => a + x.total, 0);
  const passedInCurrentSet = bySet[currentSet - 1].passedTotal;

  // จัดอันดับ: ชุดสูงกว่าเก่งกว่า > ผ่านมากกว่า > ด่าน/บท ไกลกว่า (คนยังไม่เริ่ม = อยู่ท้ายสุด)
  const rankValue = started ? (currentSet * 1_000_000 + totalPassed * 1_000 + currentStage * 100 + currentChapter) : 0;

  return {
    bySet, completedSets, currentSet, currentStage, currentChapter, isMaxed,
    totalPassed, grandTotal, rankValue, started,
    percent: started ? Math.round((passedInCurrentSet / bySet[currentSet - 1].total) * 100) : 0,
  };
}
