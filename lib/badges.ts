import { StudentRow } from "./data";
import { MAX_SET } from "./types";

export interface Badge { key: string; icon: string; label: string; desc: string; earned: boolean }

/** คำนวณเหรียญ/ความสำเร็จจากความก้าวหน้าของนักเรียน (คำนวณสด ไม่เก็บ DB) */
export function computeBadges(r: StudentRow): Badge[] {
  const p = r.progress;
  const cells = p.bySet.flatMap((s) => s.cells);
  const fullMarks = cells.some((c) => c.score != null && c.total > 0 && c.score === c.total);
  const sentencePassed = cells.filter((c) => c.isTest && c.passed).length;
  const level = p.isMaxed ? MAX_SET : p.currentSet;
  const aheadGrade = p.started && level > r.grade;
  const preStar = (r.recommendedSet ?? 0) > r.grade;

  const def: [string, string, string, string, boolean][] = [
    ["start", "🚀", "เริ่มต้นการเดินทาง", "มีคะแนนแล้วอย่างน้อย 1 บท", p.started],
    ["set1", "🥉", "จบชุดแรก", "ผ่านครบทุกบทของชุดใดชุดหนึ่ง", p.completedSets >= 1],
    ["collect", "📚", "นักสะสมบท", "ผ่านสะสม 25 บท", p.totalPassed >= 25],
    ["sentence", "✍️", "นักแต่งประโยค", "ผ่านบทแต่งประโยค 5 บท", sentencePassed >= 5],
    ["perfect", "💯", "เพอร์เฟกต์", "ทำคะแนนเต็มอย่างน้อย 1 บท", fullMarks],
    ["prestar", "🎯", "ดาวพรีเทส", "Pre-Test ชั้นตัวเอง ≥80%", preStar],
    ["ahead", "📈", "เกินเกณฑ์ชั้น", "ทำชุดสูงกว่าระดับชั้น", aheadGrade],
    ["half", "⭐", "ครึ่งทาง", "ผ่านสะสม 150 บท", p.totalPassed >= 150],
    ["master", "👑", "ปรมาจารย์", "จบครบทั้ง 6 ชุด", p.isMaxed],
  ];
  return def.map(([key, icon, label, desc, earned]) => ({ key, icon, label, desc, earned }));
}

export const earnedCount = (b: Badge[]) => b.filter((x) => x.earned).length;
