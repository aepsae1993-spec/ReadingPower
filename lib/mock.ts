import { ChapterResult, MAX_SET, CHAPTERS_PER_SET, ALL_CHAPTERS, isTestChapter, Student } from "./types";

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
    const stopChapter = 1 + Math.floor(rand() * CHAPTERS_PER_SET); // กรอกถึงบทที่เท่าไรในชุดสุดท้าย
    for (let set = 1; set <= reach; set++) {
      const lastSet = set === reach;
      const upto = lastSet ? stopChapter : CHAPTERS_PER_SET;
      for (const c of ALL_CHAPTERS) {
        if (c > upto) break;
        const frontier = lastSet && c >= upto - 2; // บทล่าสุด = ผันผวน
        if (isTestChapter(c)) {
          const score = frontier ? 5 + Math.floor(rand() * 9) : 10 + Math.floor(rand() * 6); // 5-13 / 10-15
          results.push({ studentId: s.id, setNo: set, chapter: c, score, total: 15 });
        } else {
          const score = frontier ? 8 + Math.floor(rand() * 6) : 16 + Math.floor(rand() * 5); // 8-13 / 16-20
          results.push({ studentId: s.id, setNo: set, chapter: c, score, total: 20 });
        }
      }
    }
  }
  return { students, results };
}
