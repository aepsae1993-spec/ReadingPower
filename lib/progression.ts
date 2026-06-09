import { ChapterResult, MAX_SET, PASS_RATIO, STAGES, StageId, stageChapters } from "./types";

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
  percent: number; // ความก้าวหน้ารวม %
}

const isPass = (r: ChapterResult) => r.total > 0 && r.score / r.total >= PASS_RATIO;

export function computeProgress(results: ChapterResult[]): Progress {
  // passed[set][stage] = Set of chapters passed
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

  const isMaxed = completedSets >= MAX_SET;
  const currentSet = isMaxed ? MAX_SET : completedSets + 1;
  const cs = bySet[currentSet - 1];
  let currentStage: StageId = 1;
  for (const st of cs.stages) { if (!st.complete) { currentStage = st.stage; break; } currentStage = 3; }
  const currentChapter = Math.min(
    cs.stages[currentStage - 1].passed + 1,
    stageChapters(currentStage)
  );

  const totalPassed = bySet.reduce((a, x) => a + x.passedTotal, 0);
  const grandTotal = bySet.reduce((a, x) => a + x.total, 0);

  // monotonic rank: เน้นชุดสูง > ด่าน > บท > จำนวนผ่านรวม
  const rankValue =
    completedSets * 1_000_000 +
    (currentStage - 1) * 100_000 +
    cs.stages[currentStage - 1].passed * 1_000 +
    totalPassed;

  return {
    bySet, completedSets, currentSet, currentStage, currentChapter, isMaxed,
    totalPassed, grandTotal, rankValue,
    percent: Math.round((totalPassed / grandTotal) * 100),
  };
}
