"use client";
import { useState, useTransition } from "react";
import { saveChapter } from "@/app/entry/actions";
import { PASS_RATIO } from "@/lib/types";
import { Save, Check, Loader2 } from "lucide-react";

const N = 20;
type Stu = { id: string; name: string };

export default function EntryGrid({ setNo, stage, chapter, students, initial }: {
  setNo: number; stage: number; chapter: number; students: Stu[];
  initial: Record<string, number[] | null>;
}) {
  const [rows, setRows] = useState(() =>
    students.map((s) => ({ ...s, items: normalize(initial[s.id]) }))
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (si: number, ci: number) =>
    setRows((rs) => rs.map((r, i) => i === si ? { ...r, items: r.items.map((v, j) => (j === ci ? (v ? 0 : 1) : v)) } : r));
  const setAll = (si: number, val: number) =>
    setRows((rs) => rs.map((r, i) => i === si ? { ...r, items: Array(N).fill(val) } : r));

  const save = () => {
    setMsg(null);
    start(async () => {
      const res = await saveChapter({ setNo, stage, chapter, rows: rows.map((r) => ({ studentId: r.id, items: r.items })) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else setMsg(res.error ?? "บันทึกไม่สำเร็จ");
    });
  };

  if (students.length === 0)
    return <div className="card p-6 text-center text-slate-400">ยังไม่มีนักเรียนในชั้นนี้ — เพิ่มที่เมนู “นักเรียน”</div>;

  return (
    <div className="space-y-3">
      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="sticky left-0 z-10 bg-slate-900/95 px-3 py-2 text-left font-semibold">ชื่อ-สกุล</th>
              {Array.from({ length: N }, (_, i) => <th key={i} className="w-8 px-0 py-2 text-center text-[11px] font-semibold">{i + 1}</th>)}
              <th className="px-2 py-2 text-center font-semibold">คะแนน</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, si) => {
              const sc = r.items.reduce((a, b) => a + b, 0);
              const pass = sc / N >= PASS_RATIO;
              return (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="sticky left-0 z-10 max-w-[180px] truncate bg-slate-900/95 px-3 py-1.5 font-medium text-slate-100">
                    {r.name}
                    <div className="flex gap-1 text-[10px]">
                      <button onClick={() => setAll(si, 1)} className="text-emerald-400 hover:underline">ถูกหมด</button>
                      <button onClick={() => setAll(si, 0)} className="text-rose-400 hover:underline">ล้าง</button>
                    </div>
                  </td>
                  {r.items.map((v, ci) => (
                    <td key={ci} className="p-0.5 text-center">
                      <button onClick={() => toggle(si, ci)}
                        className={`h-6 w-6 rounded-md text-xs font-bold transition ${v ? "bg-emerald-500/80 text-white shadow-[0_0_8px_-2px_rgba(16,185,129,.8)]" : "bg-slate-800 text-slate-600 hover:bg-slate-700"}`}>
                        {v ? "✓" : ""}
                      </button>
                    </td>
                  ))}
                  <td className={`px-2 py-1.5 text-center font-extrabold ${pass ? "text-emerald-400" : "text-rose-400"}`}>
                    {sc}/{N}<div className="text-[10px] font-semibold">{pass ? "ผ่าน" : "ไม่ผ่าน"}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">{rows.length} คน · กดช่องเพื่อให้คะแนน (✓ = ถูก)</div>
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

function normalize(a: number[] | null | undefined): number[] {
  const out = Array(N).fill(0);
  if (Array.isArray(a)) for (let i = 0; i < N; i++) out[i] = a[i] ? 1 : 0;
  return out;
}
