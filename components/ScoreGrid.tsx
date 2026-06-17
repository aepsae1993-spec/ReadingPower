"use client";
import { useState, useTransition } from "react";
import { saveScore } from "@/app/entry/actions";
import { TEST_FULL, TEST_PASS } from "@/lib/types";
import { Save, Check, Loader2 } from "lucide-react";
import SuccessOverlay from "@/components/SuccessOverlay";

type Stu = { id: string; name: string };
type Cell = number | null;

export default function ScoreGrid({ setNo, chapter, students, initial }: {
  setNo: number; chapter: number; students: Stu[];
  initial: Record<string, Cell>;
}) {
  const [rows, setRows] = useState(() =>
    students.map((s) => ({ ...s, score: initial[s.id] ?? null, init: initial[s.id] ?? null }))
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setScore = (si: number, val: Cell) =>
    setRows((rs) => rs.map((r, i) => (i === si ? { ...r, score: val } : r)));

  const save = () => {
    setMsg(null);
    // บันทึกเฉพาะคนที่แก้ไขจริง (ค่าต่างจากที่โหลดมา)
    const changed = rows.filter((r) => r.score != null && r.score !== r.init);
    if (changed.length === 0) { setMsg("ยังไม่มีการแก้ไข"); return; }
    start(async () => {
      const res = await saveScore({ setNo, chapter, rows: changed.map((r) => ({ studentId: r.id, score: r.score })) });
      if (res.ok) { setSaved(true); setRows((rs) => rs.map((r) => ({ ...r, init: r.score }))); setTimeout(() => setSaved(false), 2000); }
      else setMsg(res.error ?? "บันทึกไม่สำเร็จ");
    });
  };

  if (students.length === 0)
    return <div className="card p-6 text-center text-slate-400">ยังไม่มีนักเรียนในชั้นนี้ — เพิ่มที่เมนู “นักเรียน”</div>;

  return (
    <div className="space-y-3">
      <SuccessOverlay show={saved} />
      <div className="card overflow-auto max-h-[72vh]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-slate-300">
              <th className="sticky left-0 top-0 z-30 border-b border-white/10 bg-slate-950 px-3 py-2.5 text-left font-bold">ชื่อ-สกุล</th>
              <th className="sticky right-0 top-0 z-30 border-b border-l border-white/10 bg-slate-950 px-3 py-2.5 text-center font-bold">คะแนน (เต็ม {TEST_FULL})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, si) => {
              const state = r.score == null ? "empty" : r.score >= TEST_PASS ? "pass" : "fail";
              return (
                <tr key={r.id} className="group border-t border-white/5">
                  <td className="sticky left-0 z-10 max-w-[260px] truncate bg-slate-950 px-3 py-2 font-medium text-slate-100 group-hover:bg-slate-900">
                    <span className="text-xs tabular-nums text-slate-500">{si + 1}.</span> {r.name}
                  </td>
                  <td className="border-l border-white/10 px-3 py-2 text-center group-hover:bg-indigo-500/10">
                    <input
                      type="number" min={0} max={TEST_FULL} inputMode="numeric" placeholder="–"
                      value={r.score ?? ""}
                      onChange={(e) => setScore(si, parseCell(e.target.value))}
                      className={`h-9 w-16 rounded-md bg-slate-800 text-center text-base font-bold tabular-nums outline-none ring-1 transition placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-400/50 ${
                        state === "pass" ? "text-emerald-300 ring-emerald-500/30" : state === "fail" ? "text-rose-300 ring-rose-500/30" : "text-slate-400 ring-white/10"
                      }`}
                    />
                    <span className={`ml-2 text-xs font-semibold ${state === "pass" ? "text-emerald-400" : state === "fail" ? "text-rose-400" : "text-slate-500"}`}>
                      {state === "empty" ? "" : state === "pass" ? "ผ่าน" : "ไม่ผ่าน"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">{rows.length} คน · แต่งประโยค กรอกคะแนนเต็ม {TEST_FULL} · ผ่านที่ {TEST_PASS} · เว้นว่าง = ยังไม่กรอก</div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-rose-300">{msg}</span>}
          <button onClick={save} disabled={pending}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2.5 font-bold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60">
            {pending ? <Loader2 className="animate-spin" size={18} /> : saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? "บันทึกแล้ว" : "บันทึกคะแนน"}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseCell(raw: string): Cell {
  if (raw.trim() === "") return null;
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return null;
  return Math.min(TEST_FULL, Math.max(0, n));
}
