import "server-only";
import ExcelJS from "exceljs";
import {
  REGULAR_ITEMS, REGULAR_PASS_RATIO, TEST_FULL, TEST_PASS,
  slotKind, itemLevel, chapterPassed, chapterName, chapterShort, chapterSlots, MAX_SET, CHAPTERS_PER_SET,
  PRE_READ, PRE_RW, POST_READ, POST_RW,
} from "./types";

const FONT = "TH Sarabun New";
const C = {
  title: "FF1F4E79",
  header: "FFDCE6F1",
  correct: "FFD9EAD3",
  wrong: "FFF9D6D5",
  total: "FFFFF2CC",
  easy: "FFD9EAD3",
  good: "FFFFF2CC",
  hard: "FFF9D6D5",
  border: "FFB7C2D0",
  band: "FFEFF3F8",
};
const thin = { style: "thin" as const, color: { argb: C.border } };
const ALL_BORDERS = { top: thin, left: thin, bottom: thin, right: thin };
const fill = (argb: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });

/** ตั้งค่าพิมพ์ให้พอดี A4 (กว้าง 1 หน้าเสมอ) */
function printSetup(ws: ExcelJS.Worksheet, orientation: "landscape" | "portrait") {
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0, // สูงกี่หน้าก็ได้
    horizontalCentered: true,
    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
  };
}

const thaiYear = () => new Date().getFullYear() + 543;
const stripTitle = (name: string) => name.replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง)\s*/, "");

function titleBlock(ws: ExcelJS.Worksheet, cols: number, lines: { text: string; big?: boolean }[]) {
  lines.forEach((ln, i) => {
    const r = i + 1;
    ws.mergeCells(r, 1, r, cols);
    const cell = ws.getCell(r, 1);
    cell.value = ln.text;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { bold: !!ln.big, size: ln.big ? 16 : 12, color: { argb: C.title }, name: FONT };
    ws.getRow(r).height = ln.big ? 26 : 19;
  });
  return lines.length;
}

function normalizeItems(a: number[] | null | undefined, n: number): number[] {
  const out = Array(n).fill(0);
  if (Array.isArray(a)) for (let i = 0; i < n; i++) out[i] = a[i] ? 1 : 0;
  return out;
}

export interface ChapterStudent { no?: number | null; name: string; items: number[] | null; score: number | null; total: number | null; }

/** ตารางรวมทั้งห้อง ต่อ 1 บท (กดถูก/ผิด 20 ข้อ + วิเคราะห์รายข้อ · บทแต่งประโยค = คะแนนเต็ม 15) */
export async function chapterWorkbookBuffer(opts: { grade: number; setNo: number; chapter: number; students: ChapterStudent[] }): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "READING POWER";
  if (slotKind(opts.chapter) === "sentence") buildTestSheet(wb, opts);
  else buildRegularSheet(wb, opts);
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export interface PairStudent { no?: number | null; name: string; a: number | null; b: number | null }

/** ชีตสรุป Pre/Post-Test รวม 2 ใบ (อ่าน + ถูกผิด) + เฉลี่ยรายคน */
function buildPairSummary(wb: ExcelJS.Workbook, opts: { grade: number; setNo: number; kind: "pre" | "post"; rows: PairStudent[] }) {
  const { grade, setNo, kind, rows } = opts;
  const label = kind === "pre" ? "Pre-Test" : "Post-Test";
  const COLS = 5;
  const ws = wb.addWorksheet(`${label} รวม`, { views: [{ state: "frozen", ySplit: 4 }] });
  printSetup(ws, "portrait");
  ws.getColumn(1).width = 5; ws.getColumn(2).width = 30; ws.getColumn(3).width = 12; ws.getColumn(4).width = 12; ws.getColumn(5).width = 12;
  const top = titleBlock(ws, COLS, [
    { text: `${label} — รวม & เฉลี่ยรายคน`, big: true },
    { text: `ชั้นประถมศึกษาปีที่ ${grade} ปีการศึกษา ${thaiYear()}` },
    { text: `ชุดที่ ${setNo} · เต็มใบละ 20 · เฉลี่ย = (อ่าน + ถูกผิด) / 40` },
  ]);
  const HR = top + 1;
  ["ที่", "ชื่อ-สกุล", "อ่าน (20)", "ถูกผิด (20)", "เฉลี่ย"].forEach((h, i) => {
    const c = ws.getCell(HR, i + 1);
    c.value = h; c.alignment = { horizontal: "center", vertical: "middle" }; c.font = { bold: true, name: FONT, size: 13 }; c.fill = fill(C.header); c.border = ALL_BORDERS;
  });
  ws.getRow(HR).height = 20;
  let sumPct = 0, cntPct = 0;
  rows.forEach((r, i) => {
    const rr = HR + 1 + i;
    const entered = [r.a, r.b].filter((x): x is number => x != null);
    const pct = entered.length ? entered.reduce((a, b) => a + b, 0) / (20 * entered.length) : null;
    setCell(ws, rr, 1, i + 1, { center: true, border: true });
    setCell(ws, rr, 2, r.name, { border: true });
    setCell(ws, rr, 3, r.a, { center: true, border: true });
    setCell(ws, rr, 4, r.b, { center: true, border: true });
    const pc = ws.getCell(rr, 5);
    if (pct != null) { pc.value = pct; pc.numFmt = "0%"; }
    pc.alignment = { horizontal: "center" }; pc.font = { name: FONT, size: 13, bold: true }; pc.border = ALL_BORDERS;
    pc.fill = fill(pct == null ? C.total : pct >= 0.5 ? C.easy : C.hard);
    ws.getRow(rr).height = 18;
    if (pct != null) { sumPct += pct; cntPct++; }
  });
  const fr = HR + 1 + rows.length;
  ws.mergeCells(fr, 1, fr, 2);
  setCell(ws, fr, 1, "เฉลี่ยทั้งห้อง", { bold: true, center: true, fill: C.band, border: true });
  setCell(ws, fr, 3, "", { fill: C.band, border: true });
  setCell(ws, fr, 4, "", { fill: C.band, border: true });
  const fpc = ws.getCell(fr, 5);
  if (cntPct) { fpc.value = sumPct / cntPct; fpc.numFmt = "0%"; }
  fpc.alignment = { horizontal: "center" }; fpc.font = { name: FONT, size: 13, bold: true }; fpc.fill = fill(C.band); fpc.border = ALL_BORDERS;
}

/** ส่งออก Pre/Post-Test: ชีตสรุปรวม+เฉลี่ย แล้วตามด้วยตารางรายข้อของ "อ่าน" และ "ถูกผิด" */
export async function testPairWorkbookBuffer(opts: { grade: number; setNo: number; kind: "pre" | "post"; rows: PairStudent[]; gridA: ChapterStudent[]; gridB: ChapterStudent[] }): Promise<ArrayBuffer> {
  const { grade, setNo, kind, rows, gridA, gridB } = opts;
  const wb = new ExcelJS.Workbook();
  wb.creator = "READING POWER";
  buildPairSummary(wb, { grade, setNo, kind, rows });
  buildRegularSheet(wb, { grade, setNo, chapter: kind === "pre" ? PRE_READ : POST_READ, students: gridA });
  buildRegularSheet(wb, { grade, setNo, chapter: kind === "pre" ? PRE_RW : POST_RW, students: gridB });
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

/** ทั้งชุด (รายห้อง): สรุป Pre/Post รวม + ชีตรายบท */
export async function setWorkbookBuffer(opts: { grade: number; setNo: number; perChapter: { chapter: number; students: ChapterStudent[] }[]; prePair?: PairStudent[]; postPair?: PairStudent[] }): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "READING POWER";
  if (opts.prePair && opts.prePair.some((r) => r.a != null || r.b != null)) buildPairSummary(wb, { grade: opts.grade, setNo: opts.setNo, kind: "pre", rows: opts.prePair });
  for (const pc of opts.perChapter) {
    const args = { grade: opts.grade, setNo: opts.setNo, chapter: pc.chapter, students: pc.students };
    if (slotKind(pc.chapter) === "sentence") buildTestSheet(wb, args);
    else buildRegularSheet(wb, args);
  }
  if (opts.postPair && opts.postPair.some((r) => r.a != null || r.b != null)) buildPairSummary(wb, { grade: opts.grade, setNo: opts.setNo, kind: "post", rows: opts.postPair });
  if (wb.worksheets.length === 0) wb.addWorksheet("ว่าง").getCell(1, 1).value = "ยังไม่มีคะแนนในชุดนี้";
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

/** ประวัติการพัฒนา (สอบซ้ำ) ทั้งห้อง — เฉพาะบทที่สอบ ≥2 ครั้ง */
export interface RetakeExportRow { no?: number | null; name: string; setNo: number; chapter: number; total: number; scores: number[] }
export async function retakeWorkbookBuffer(opts: { grade: number; rows: RetakeExportRow[] }): Promise<ArrayBuffer> {
  const { grade, rows } = opts;
  const COLS = 8;
  const wb = new ExcelJS.Workbook();
  wb.creator = "READING POWER";
  const ws = wb.addWorksheet(`ประวัติพัฒนา ป.${grade}`, { views: [{ state: "frozen", ySplit: 4 }] });
  printSetup(ws, "landscape");
  [5, 26, 6, 16, 6, 26, 8, 9].forEach((w, i) => (ws.getColumn(i + 1).width = w));

  const top = titleBlock(ws, COLS, [
    { text: "ประวัติการพัฒนา (สอบซ้ำ)", big: true },
    { text: `ชั้นประถมศึกษาปีที่ ${grade} ปีการศึกษา ${thaiYear()}` },
    { text: "เฉพาะบทที่สอบ ≥ 2 ครั้ง · คะแนนทางการ = ครั้งที่ดีที่สุด" },
  ]);
  const HR = top + 1;
  ["ที่", "ชื่อ-สกุล", "ชุด", "รายการ", "ครั้ง", "คะแนนแต่ละครั้ง", "ดีสุด", "พัฒนา"].forEach((h, i) => {
    const c = ws.getCell(HR, i + 1);
    c.value = h; c.alignment = { horizontal: "center", vertical: "middle" }; c.font = { bold: true, name: FONT, size: 13 }; c.fill = fill(C.header); c.border = ALL_BORDERS;
  });
  ws.getRow(HR).height = 20;

  if (rows.length === 0) {
    const r = HR + 1;
    ws.mergeCells(r, 1, r, COLS);
    setCell(ws, r, 1, "ยังไม่มีการสอบซ้ำในห้องนี้", { center: true });
    return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  }

  rows.forEach((row, i) => {
    const r = HR + 1 + i;
    const best = Math.max(...row.scores);
    const gain = best - row.scores[0];
    setCell(ws, r, 1, i + 1, { center: true, border: true });
    setCell(ws, r, 2, row.name, { border: true });
    setCell(ws, r, 3, row.setNo, { center: true, border: true });
    setCell(ws, r, 4, chapterShort(row.chapter), { center: true, border: true });
    setCell(ws, r, 5, row.scores.length, { center: true, border: true });
    setCell(ws, r, 6, row.scores.join("  →  ") + `  (เต็ม ${row.total})`, { center: true, border: true });
    setCell(ws, r, 7, `${best}/${row.total}`, { center: true, bold: true, fill: C.total, border: true });
    setCell(ws, r, 8, gain > 0 ? `+${gain}` : `${gain}`, { center: true, bold: true, fill: gain > 0 ? C.easy : C.band, border: true });
    ws.getRow(r).height = 18;
  });

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

function buildRegularSheet(wb: ExcelJS.Workbook, { grade, setNo, chapter, students }: { grade: number; setNo: number; chapter: number; students: ChapterStudent[] }) {
  const N = REGULAR_ITEMS;
  const COLS = 2 + N + 2; // ที่ + ชื่อ + 20 ข้อ + รวม + ร้อยละ
  const ws = wb.addWorksheet(`ชุด${setNo} ${chapterShort(chapter)}`.slice(0, 31), { views: [{ state: "frozen", xSplit: 2, ySplit: 4 }] });
  printSetup(ws, "landscape");

  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 24;
  for (let i = 0; i < N; i++) ws.getColumn(3 + i).width = 4;
  ws.getColumn(3 + N).width = 9;
  ws.getColumn(4 + N).width = 7;

  const top = titleBlock(ws, COLS, [
    { text: "แบบบันทึกคะแนนรายข้อ", big: true },
    { text: `ชั้นประถมศึกษาปีที่ ${grade} ปีการศึกษา ${thaiYear()}` },
    { text: `ชุดที่ ${setNo} · ${chapterName(chapter)}  (เต็ม ${N} ข้อ · ผ่านที่ ${Math.ceil(N * REGULAR_PASS_RATIO)}/${N})` },
  ]);

  const HR = top + 1;
  const header = ["ที่", "ชื่อ-สกุล", ...Array.from({ length: N }, (_, i) => String(i + 1)), "รวมคะแนน", "ร้อยละ"];
  header.forEach((h, idx) => {
    const cell = ws.getCell(HR, idx + 1);
    cell.value = h;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { bold: true, name: FONT, size: 13 };
    cell.fill = fill(C.header);
    cell.border = ALL_BORDERS;
  });
  ws.getRow(HR).height = 20;

  const itemCorrect = Array(N).fill(0);
  let takers = 0, grandScore = 0;
  students.forEach((s, si) => {
    const r = HR + 1 + si;
    const has = s.items != null || s.score != null;
    const items = normalizeItems(s.items, N);
    setCell(ws, r, 1, si + 1, { center: true, border: true });
    setCell(ws, r, 2, s.name, { border: true });
    for (let i = 0; i < N; i++) {
      const cell = ws.getCell(r, 3 + i);
      if (has) {
        cell.value = items[i];
        cell.fill = fill(items[i] ? C.correct : C.wrong);
        if (items[i]) itemCorrect[i]++;
      }
      cell.alignment = { horizontal: "center" };
      cell.font = { name: FONT, size: 12 };
      cell.border = ALL_BORDERS;
    }
    const sum = has ? items.reduce((a, b) => a + b, 0) : null;
    setCell(ws, r, 3 + N, sum, { center: true, bold: true, fill: C.total, border: true });
    const pctCell = ws.getCell(r, 4 + N);
    pctCell.value = sum == null ? null : sum / N;
    pctCell.numFmt = "0%";
    pctCell.alignment = { horizontal: "center" };
    pctCell.font = { name: FONT, size: 13 };
    pctCell.fill = fill(C.total);
    pctCell.border = ALL_BORDERS;
    ws.getRow(r).height = 18;
    if (has) { takers++; grandScore += sum!; }
  });

  // แถววิเคราะห์รายข้อ
  let r = HR + 1 + students.length;
  const grandMax = takers * N;
  // รวมคะแนนแต่ละข้อ (ถูกกี่คน) + รวม/ร้อยละทั้งบท
  analysisRow(ws, r, N, "รวมคะแนนแต่ละข้อ", itemCorrect, { fill: C.easy, totalValue: grandScore, pctValue: grandMax ? grandScore / grandMax : null });
  r++;
  analysisRow(ws, r, N, "ตอบผิด (คน)", itemCorrect.map((c) => Math.max(takers - c, 0)), { fill: C.hard });
  r++;
  // ระดับแต่ละข้อ
  const levels = itemCorrect.map((c) => (takers ? itemLevel(c / takers) : "-"));
  levelRow(ws, r, N, "ระดับแต่ละข้อ", levels);
}

function buildTestSheet(wb: ExcelJS.Workbook, { grade, setNo, chapter, students }: { grade: number; setNo: number; chapter: number; students: ChapterStudent[] }) {
  const COLS = 5; // ที่ ชื่อ คะแนน ร้อยละ ผล
  const ws = wb.addWorksheet(`ชุด${setNo} ${chapterShort(chapter)}`.slice(0, 31), { views: [{ state: "frozen", ySplit: 4 }] });
  printSetup(ws, "portrait");
  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 30;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 10;
  ws.getColumn(5).width = 10;

  const top = titleBlock(ws, COLS, [
    { text: "แบบบันทึกคะแนนแต่งประโยค", big: true },
    { text: `ชั้นประถมศึกษาปีที่ ${grade} ปีการศึกษา ${thaiYear()}` },
    { text: `ชุดที่ ${setNo} · ${chapterName(chapter)} (เต็ม ${TEST_FULL} · ผ่านที่ ${TEST_PASS})` },
  ]);
  const HR = top + 1;
  ["ที่", "ชื่อ-สกุล", `คะแนน (เต็ม ${TEST_FULL})`, "ร้อยละ", "ผล"].forEach((h, idx) => {
    const cell = ws.getCell(HR, idx + 1);
    cell.value = h;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { bold: true, name: FONT, size: 13 };
    cell.fill = fill(C.header);
    cell.border = ALL_BORDERS;
  });
  ws.getRow(HR).height = 20;

  let takers = 0, sumScore = 0;
  students.forEach((s, si) => {
    const r = HR + 1 + si;
    const has = s.score != null;
    const pass = has && s.score! >= TEST_PASS;
    setCell(ws, r, 1, si + 1, { center: true, border: true });
    setCell(ws, r, 2, s.name, { border: true });
    setCell(ws, r, 3, has ? s.score : null, { center: true, bold: true, fill: C.total, border: true });
    const pctCell = ws.getCell(r, 4);
    pctCell.value = has ? s.score! / TEST_FULL : null;
    pctCell.numFmt = "0%";
    pctCell.alignment = { horizontal: "center" };
    pctCell.font = { name: FONT, size: 13 };
    pctCell.fill = fill(C.total);
    pctCell.border = ALL_BORDERS;
    setCell(ws, r, 5, has ? (pass ? "ผ่าน" : "ไม่ผ่าน") : "", { center: true, border: true, fill: has ? (pass ? C.easy : C.hard) : undefined });
    ws.getRow(r).height = 18;
    if (has) { takers++; sumScore += s.score!; }
  });

  const r = HR + 1 + students.length;
  setCell(ws, r, 1, "", { fill: C.band, border: true });
  setCell(ws, r, 2, "เฉลี่ยทั้งห้อง", { bold: true, fill: C.band, border: true });
  setCell(ws, r, 3, takers ? Math.round((sumScore / takers) * 10) / 10 : null, { center: true, bold: true, fill: C.band, border: true });
  const pctCell = ws.getCell(r, 4);
  pctCell.value = takers ? sumScore / (takers * TEST_FULL) : null;
  pctCell.numFmt = "0%";
  pctCell.alignment = { horizontal: "center" };
  pctCell.font = { name: FONT, size: 13, bold: true };
  pctCell.fill = fill(C.band);
  pctCell.border = ALL_BORDERS;
  setCell(ws, r, 5, `${takers} คน`, { center: true, fill: C.band, border: true });
}

/** รายงานรายบุคคล: ทุกบทที่กรอกแล้ว แยกตามชุด + สรุปร้อยละ */
export interface StudentRecord { setNo: number; chapter: number; score: number; total: number; }
export async function studentWorkbookBuffer(opts: { name: string; grade: number; rank?: number; records: StudentRecord[] }): Promise<ArrayBuffer> {
  const { name, grade, rank, records } = opts;
  const wb = new ExcelJS.Workbook();
  wb.creator = "READING POWER";
  const COLS = 6; // ชุด บท ชนิด คะแนน ร้อยละ ผล
  const ws = wb.addWorksheet(stripTitle(name).slice(0, 28) || "รายบุคคล");
  printSetup(ws, "portrait");
  ws.getColumn(1).width = 7;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 10;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 9;
  ws.getColumn(6).width = 9;

  const byKey = new Map<string, StudentRecord>();
  for (const r of records) byKey.set(`${r.setNo}-${r.chapter}`, r);
  const done = records.slice().sort((a, b) => a.setNo - b.setNo || a.chapter - b.chapter);
  const scoreSum = done.reduce((a, r) => a + r.score, 0);
  const scoreMax = done.reduce((a, r) => a + r.total, 0);
  const passed = done.filter((r) => chapterPassed(r.chapter, r.score, r.total)).length;

  const top = titleBlock(ws, COLS, [
    { text: "รายงานคะแนนรายบุคคล", big: true },
    { text: `${name} · ชั้นประถมศึกษาปีที่ ${grade}${rank ? ` · อันดับโรงเรียน #${rank}` : ""}` },
    { text: `ทำแล้ว ${done.length} บท · ผ่าน ${passed} บท · คะแนนรวม ${scoreSum}/${scoreMax} = ${scoreMax ? Math.round((scoreSum / scoreMax) * 100) : 0}%` },
  ]);

  const HR = top + 1;
  ["ชุด", "รายการ", "ชนิด", "คะแนน", "ร้อยละ", "ผล"].forEach((h, idx) => {
    const cell = ws.getCell(HR, idx + 1);
    cell.value = h;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { bold: true, name: FONT, size: 13 };
    cell.fill = fill(C.header);
    cell.border = ALL_BORDERS;
  });
  ws.getRow(HR).height = 20;

  const slotCodes = chapterSlots().map((s) => s.code);
  const kindLabel = (code: number) => (slotKind(code) === "sentence" ? "ประโยค" : code > CHAPTERS_PER_SET ? "ทดสอบ" : "ปกติ");

  let r = HR + 1;
  for (let set = 1; set <= MAX_SET; set++) {
    const inSet = slotCodes.map((c) => byKey.get(`${set}-${c}`)).filter(Boolean) as StudentRecord[];
    if (inSet.length === 0) continue;
    for (const rec of inSet) {
      const sentence = slotKind(rec.chapter) === "sentence";
      const pass = chapterPassed(rec.chapter, rec.score, rec.total);
      setCell(ws, r, 1, set, { center: true, border: true });
      setCell(ws, r, 2, chapterShort(rec.chapter), { center: true, border: true });
      setCell(ws, r, 3, kindLabel(rec.chapter), { center: true, border: true, fill: sentence ? C.total : undefined });
      setCell(ws, r, 4, `${rec.score}/${rec.total}`, { center: true, bold: true, border: true });
      const pctCell = ws.getCell(r, 5);
      pctCell.value = rec.total ? rec.score / rec.total : 0;
      pctCell.numFmt = "0%";
      pctCell.alignment = { horizontal: "center" };
      pctCell.font = { name: FONT, size: 13 };
      pctCell.border = ALL_BORDERS;
      setCell(ws, r, 6, pass ? "ผ่าน" : "ไม่ผ่าน", { center: true, border: true, fill: pass ? C.easy : C.hard });
      ws.getRow(r).height = 18;
      r++;
    }
    // สรุปชุด
    const sSum = inSet.reduce((a, x) => a + x.score, 0);
    const sMax = inSet.reduce((a, x) => a + x.total, 0);
    ws.mergeCells(r, 1, r, 3);
    setCell(ws, r, 1, `รวมชุด ${set}`, { bold: true, center: true, fill: C.band, border: true });
    setCell(ws, r, 4, `${sSum}/${sMax}`, { center: true, bold: true, fill: C.band, border: true });
    const pc = ws.getCell(r, 5);
    pc.value = sMax ? sSum / sMax : 0; pc.numFmt = "0%"; pc.alignment = { horizontal: "center" }; pc.font = { name: FONT, size: 13, bold: true }; pc.fill = fill(C.band); pc.border = ALL_BORDERS;
    setCell(ws, r, 6, "", { fill: C.band, border: true });
    ws.getRow(r).height = 18;
    r++;
  }
  if (r === HR + 1) { setCell(ws, r, 1, "ยังไม่มีคะแนน", { center: true }); ws.mergeCells(r, 1, r, COLS); }

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

// helpers ---------------------------------------------------------------
function setCell(ws: ExcelJS.Worksheet, r: number, c: number, value: any, o: { center?: boolean; bold?: boolean; fill?: string; border?: boolean } = {}) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.font = { name: FONT, size: 13, bold: !!o.bold };
  cell.alignment = { horizontal: o.center ? "center" : "left", vertical: "middle" };
  if (o.fill) cell.fill = fill(o.fill);
  if (o.border) cell.border = ALL_BORDERS;
  return cell;
}

function analysisRow(ws: ExcelJS.Worksheet, r: number, n: number, label: string, values: number[], o: { fill: string; totalValue?: number; pctValue?: number | null }) {
  ws.mergeCells(r, 1, r, 2);
  setCell(ws, r, 1, label, { bold: true, center: true, fill: C.band, border: true });
  for (let i = 0; i < n; i++) setCell(ws, r, 3 + i, values[i], { center: true, fill: o.fill, border: true });
  setCell(ws, r, 3 + n, o.totalValue ?? "", { center: true, bold: true, fill: C.total, border: true });
  const pctCell = ws.getCell(r, 4 + n);
  if (o.pctValue != null) { pctCell.value = o.pctValue; pctCell.numFmt = "0%"; }
  pctCell.alignment = { horizontal: "center" };
  pctCell.font = { name: FONT, size: 13, bold: true };
  pctCell.fill = fill(C.total);
  pctCell.border = ALL_BORDERS;
  ws.getRow(r).height = 18;
}

function levelRow(ws: ExcelJS.Worksheet, r: number, n: number, label: string, levels: string[]) {
  ws.mergeCells(r, 1, r, 2);
  setCell(ws, r, 1, label, { bold: true, center: true, fill: C.band, border: true });
  for (let i = 0; i < n; i++) {
    const lv = levels[i];
    const bg = lv === "ง่าย" ? C.easy : lv === "ยาก" ? C.hard : lv === "ดี" ? C.good : C.band;
    setCell(ws, r, 3 + i, lv, { center: true, fill: bg, border: true });
  }
  setCell(ws, r, 3 + n, "", { fill: C.band, border: true });
  setCell(ws, r, 4 + n, "", { fill: C.band, border: true });
  ws.getRow(r).height = 18;
}
