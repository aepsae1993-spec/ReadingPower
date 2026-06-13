import { ChapterResult, MAX_SET, PRE_READ, PRE_RW } from "./types";

export const PLACE_SKIP = 0.8; // Pre-Test ที่ชุดตามชั้น ≥80% → ข้ามขึ้น 1 ชุด
export const PLACE_PASS = 0.5; // ≥50% → เริ่มเรียนที่ชุดนั้น

export interface PlacementResult {
  set: number | null;  // ชุดเริ่มต้นที่แนะนำ (null = ยังสรุปไม่ได้)
  need: number | null;  // ต้องทำ Pre-Test ชุดนี้ก่อนจึงจะสรุปได้
  note: string;
}

/** ร้อยละ Pre-Test ของชุด — รวมใบที่กรอกแล้ว (อ่าน/ถูกผิด); ยังไม่กรอกเลย = null */
export function preTestPct(results: ChapterResult[], set: number): number | null {
  const rel = results.filter((r) => r.setNo === set && (r.chapter === PRE_READ || r.chapter === PRE_RW));
  if (rel.length === 0) return null;
  const score = rel.reduce((a, r) => a + r.score, 0);
  const total = rel.reduce((a, r) => a + r.total, 0);
  return total > 0 ? score / total : null;
}

/**
 * จัดชุดเริ่มต้นจาก Pre-Test
 * - เริ่มที่ชุดตามชั้น (grade): ≥80% → ข้ามขึ้น 1 ชุด · 50–79% → เริ่มชุดนั้น · <50% → ถอยลงทีละชุด
 * - ถอยลงจนเจอชุดที่ ≥50% → เริ่มเรียนชุดนั้น · ถ้าถึงชุด 1 ยังไม่ถึง → เริ่มชุด 1
 */
export function recommendStartSet(grade: number, results: ChapterResult[]): PlacementResult {
  const g = Math.min(Math.max(grade, 1), MAX_SET);
  const pg = preTestPct(results, g);
  if (pg == null) return { set: null, need: g, note: `ต้องทำ Pre-Test ชุด ${g} ก่อน` };
  if (pg >= PLACE_SKIP) return { set: Math.min(g + 1, MAX_SET), need: null, note: `Pre-Test ชุด ${g} ได้ ${Math.round(pg * 100)}% (≥80%) → ข้ามขึ้นชุด ${Math.min(g + 1, MAX_SET)}` };
  if (pg >= PLACE_PASS) return { set: g, need: null, note: `Pre-Test ชุด ${g} ได้ ${Math.round(pg * 100)}% → เริ่มตามชั้น` };

  for (let k = g - 1; k >= 1; k--) {
    const pk = preTestPct(results, k);
    if (pk == null) return { set: null, need: k, note: `Pre-Test ชุด ${g}..${k + 1} ไม่ถึง 50% → ต้องทำ Pre-Test ชุด ${k} ต่อ` };
    if (pk >= PLACE_PASS) return { set: k, need: null, note: `Pre-Test ชุด ${k} ได้ ${Math.round(pk * 100)}% → เริ่มเรียนชุด ${k}` };
  }
  return { set: 1, need: null, note: "Pre-Test ทุกชุดไม่ถึง 50% → เริ่มจากชุด 1" };
}
