import { ChapterResult, MAX_SET, SCORED_CHAPTERS, TESTS_PER_SET, FULL_SCORE, Student } from "./types";

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
    const stopTest = 1 + Math.floor(rand() * TESTS_PER_SET); // กรอกถึงบททดสอบที่เท่าไร (1..10) ในชุดสุดท้าย
    for (let set = 1; set <= reach; set++) {
      const lastSet = set === reach;
      const upto = lastSet ? stopTest : TESTS_PER_SET;
      for (let i = 0; i < upto; i++) {
        // บทที่ผ่านมาแล้ว = คะแนนดี (10-15); บทล่าสุด (frontier) = ผันผวน (5-13)
        const frontier = lastSet && i >= upto - 2;
        const score = frontier
          ? 5 + Math.floor(rand() * 9)    // 5-13
          : 10 + Math.floor(rand() * 6);  // 10-15
        results.push({ studentId: s.id, setNo: set, chapter: SCORED_CHAPTERS[i], score, total: FULL_SCORE });
      }
    }
  }
  return { students, results };
}
