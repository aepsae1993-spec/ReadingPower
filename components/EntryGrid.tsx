"use client";
import { useState, useTransition } from "react";
import { saveSet } from "@/app/entry/actions";
import { SCORED_CHAPTERS, FULL_SCORE, PASS_SCORE, TESTS_PER_SET } from "@/lib/types";
import { Save, Check, Loader2 } from "lucide-react";

type Stu = { id: string; name: string };
type Cell = number | null;

export default function EntryGrid({ setNo, students, initial }: {
  setNo: number; students: Stu[];
  initial: Record<string, Cell[]>;
}) {
  const [rows, setRows] = useState(() =>
    students.map((s) => ({ ...s, scores: normalize(initial[s.id]) }))
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setScore = (si: number, ci: number, val: Cell) =>
    setRows((rs) => rs.map((r, i) => (i === si ? { ...r, scores: r.scores.map((v, j) => (j === ci ? val : v)) } : r)));

  const save = () => {
    setMsg(null);
    start(async () => {
      const res = await saveSet({ setNo, rows: rows.map((r) => ({ studentId: r.id, scores: r.scores })) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else setMsg(res.error ?? "บันทึกไม่สำเร็จ");
    });
  };

  if (students.length === 0)
    return <div className="card p-6 text-center text-slate-400">ยังไม่มีนักเรียนในชั้นนี้ — เพิ่มที่เมนู “นักเรียน”</div>;

  return (
    <div className="space-y-3">
      <div className="card overflow-auto max-h-[72vh]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-slate-300">
              <th className="sticky left-0 top-0 z-30 border-b border-white/10 bg-slate-950 px-3 py-2.5 text-left font-bold">ชื่อ-สกุล</th>
              {SCORED_CHAPTERS.map((ch) => (
                <th key={ch} className="sticky top-0 z-20 w-16 border-b border-l border-white/10 bg-slate-950 px-0 py-2.5 text-center text-sm font-bold">บท {ch}</th>
              ))}
              <th className="sticky right-0 top-0 z-30 border-b border-l border-white/10 bg-slate-950 px-2 py-2.5 text-center font-bold">ผ่าน</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, si) => {
              const passed = r.scores.filter((v) => v != null && v >= PASS_SCORE).length;
              const entered = r.scores.filter((v) => v != null).length;
              return (
                <tr key={r.id} className="group border-t border-white/5">
                  <td className="sticky left-0 z-10 max-w-[200px] truncate bg-slate-950 px-3 py-1.5 font-medium text-slate-100 group-hover:bg-slate-900">
                    <span className="text-xs tabular-nums text-slate-500">{si + 1}.</span> {r.name}
                  </td>
                  {r.scores.map((v, ci) => {
                    const state = v == null ? "empty" : v >= PASS_SCORE ? "pass" : "fail";
                    return (
                      <td key={ci} className="border-l border-white/10 p-1 text-center group-hover:bg-indigo-500/10">
                        <input
                          type="number" min={0} max={FULL_SCORE} inputMode="numeric" placeholder="–"
                          value={v ?? ""}
                          onChange={(e) => setScore(si, ci, parseCell(e.target.value))}
                          className={`h-9 w-12 rounded-md bg-slate-800 text-center text-base font-bold tabular-nums outline-none ring-1 transition placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-400/50 ${
                            state === "pass" ? "text-emerald-300 ring-emerald-500/30" : state === "fail" ? "text-rose-300 ring-rose-500/30" : "text-slate-400 ring-white/10"
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 border-l border-white/10 bg-slate-950 px-2 py-1.5 text-center font-extrabold text-slate-100 group-hover:bg-slate-900">
                    <span className="tabular-nums">{passed}/{TESTS_PER_SET}</span>
                    <div className="text-[11px] font-semibold text-slate-400">กรอก {entered}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">{rows.length} คน · กรอกคะแนนบททดสอบ (เต็ม {FULL_SCORE}) · ผ่านที่ {PASS_SCORE} · เว้นว่าง = ยังไม่กรอก</div>
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
  let n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return null;
  return Math.min(FULL_SCORE, Math.max(0, n));
}

function normalize(a: Cell[] | undefined): Cell[] {
  const out: Cell[] = Array(TESTS_PER_SET).fill(null);
  if (Array.isArray(a)) for (let i = 0; i < TESTS_PER_SET; i++) out[i] = a[i] ?? null;
  return out;
}
