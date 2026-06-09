import { ChapterResult, MAX_SET, STAGES, StageId, Student } from "./types";

// deterministic PRNG
function rng(seed: number) { return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; }

const FIRST = ["ภานพ","สันติภาพ","อภิรักษ์","กฤติพงษ์","พัชรินทร์","พิชญา","คุณัญญา","ปริชาติ","ธนิดา","บุญญาพร","ฉลิสา","ละอองเกลือ","กวินธิดา","ธัญพร","ศุภวิชญ์","ณัฐวุฒิ","ปุณยวีร์","กันตพงศ์","ธีรภัทร","ชนาภา","ปาริฉัตร","วรินทร","อนันดา","เปมิกา","สิรินดา","ก้องภพ","พิมพ์มาดา","รัชชานนท์","ญาณิศา","ธนกฤต"];
const LAST = ["อนิกร","สินทะเกิด","บุญญาภินันท์","สังข์ทองงาม","กลิ่นประทุม","นุยืนรัมย์","จันทร์หลวง","เสือสี","อุยยาหาญ","อินทร์นิ่ม","ฉ่ำมิ่งขวัญ","ประเสริฐวงษ์","แก้วมณี","ศรีสุข","พงษ์พันธ์","ทองดี","ใจงาม","วังคีรี","บุญมาก","สดใส"];

export function buildMock() {
  const rand = rng(20260609);
  const students: Student[] = [];
  let id = 1;
  for (let grade = 1; grade <= 6; grade++) {
    const n = 8 + Math.floor(rand() * 7); // 8-14 per class
    for (let i = 0; i < n; i++) {
      const name = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
      students.push({ id: `S${id++}`, name, grade, room: "1" });
    }
  }

  const results: ChapterResult[] = [];
  for (const s of students) {
    // higher grades tend to be further; plus randomness so a low grade can shine
    const reach = Math.min(MAX_SET, Math.max(1, Math.round((s.grade / 6) * 6 + (rand() - 0.4) * 3)));
    const stopStage = (1 + Math.floor(rand() * 3)) as StageId;
    const stopChapter = 1 + Math.floor(rand() * STAGES[stopStage - 1].chapters);
    for (let set = 1; set <= reach; set++) {
      const lastSet = set === reach;
      for (const st of STAGES) {
        const upto = lastSet && st.id === stopStage ? stopChapter : lastSet && st.id > stopStage ? 0 : st.chapters;
        for (let c = 1; c <= upto; c++) {
          // chapters already cleared = pass solidly (16-20); only the current frontier varies (some fail)
          const frontier = lastSet && st.id === stopStage && c >= stopChapter - 1;
          const score = frontier
            ? 8 + Math.floor(rand() * 6)        // 8-13 → ~ครึ่งผ่าน
            : 16 + Math.floor(rand() * 5);      // 16-20 → ผ่านชัวร์
          results.push({ studentId: s.id, setNo: set, stage: st.id, chapter: c, score, total: 20 });
        }
      }
    }
  }
  return { students, results };
}
