"use client";
import { useState, useTransition } from "react";
import { saveChecklist } from "@/app/entry/actions";
import { REGULAR_ITEMS, REGULAR_PASS_RATIO, itemLevel } from "@/lib/types";
import { Save, Check, Loader2, Type, ChevronDown } from "lucide-react";
import SuccessOverlay from "@/components/SuccessOverlay";

const N = REGULAR_ITEMS; // 20 ข้อ
type Stu = { id: string; name: string };

export default function EntryGrid({ setNo, chapter, students, initial, initialWords }: {
  setNo: number; chapter: number; students: Stu[];
  initial: Record<string, number[] | null>;
  initialWords?: string[];
}) {
  const [rows, setRows] = useState(() =>
    students.map((s) => { const init = normalize(initial[s.id]); return { ...s, items: init.slice(), init, existed: initial[s.id] != null }; })
  );
  const [words, setWords] = useState<string[]>(() => normalizeWords(initialWords));
  const [initWords, setInitWords] = useState<string[]>(() => normalizeWords(initialWords));
  const [showWords, setShowWords] = useState(false);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (si: number, ci: number) =>
    setRows((rs) => rs.map((r, i) => i === si ? { ...r, items: r.items.map((v, j) => (j === ci ? (v ? 0 : 1) : v)) } : r));
  const setAll = (si: number, val: number) =>
    setRows((rs) => rs.map((r, i) => i === si ? { ...r, items: Array(N).fill(val) } : r));

  const save = () => {
    setMsg(null);
    const changed = rows.filter((r) => r.items.some((v, i) => v !== r.init[i]));
    const wordsChanged = JSON.stringify(words) !== JSON.stringify(initWords);
    if (changed.length === 0 && !wordsChanged) { setMsg("ยังไม่มีการแก้ไข"); return; }
    start(async () => {
      const res = await saveChecklist({ setNo, chapter, rows: changed.map((r) => ({ studentId: r.id, items: r.items })), words });
      if (res.ok) {
        setSaved(true);
        setRows((rs) => rs.map((r) => ({ ...r, init: r.items.slice(), existed: r.existed || r.items.some((v) => v) })));
        setInitWords(words.slice());
        setTimeout(() => setSaved(false), 2000);
      } else setMsg(res.error ?? "บันทึกไม่สำเร็จ");
    });
  };

  if (students.length === 0)
    return <div className="card p-6 text-center text-slate-400">ยังไม่มีนักเรียนในชั้นนี้ — เพิ่มที่เมนู “นักเรียน”</div>;

  // วิเคราะห์ข้อสอบสด
  const taken = rows.filter((r) => r.existed || r.items.some((v) => v));
  const nT = taken.length;
  const itemCorrect = Array.from({ length: N }, (_, i) => taken.reduce((a, r) => a + (r.items[i] ? 1 : 0), 0));
  const totalScore = taken.reduce((a, r) => a + r.items.reduce((x, y) => x + y, 0), 0);
  const totalMax = nT * N;
  const chapterPct = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;
  const lvlColor = (lv: string) => (lv === "ง่าย" ? "bg-emerald-500/15 text-emerald-300" : lv === "ยาก" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300");

  return (
    <div className="space-y-3">
      <SuccessOverlay show={saved} />

      {/* ตั้งคำประจำข้อ (1–20) */}
      <div className="card overflow-hidden">
        <button onClick={() => setShowWords((v) => !v)} className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5">
          <span className="flex items-center gap-2"><Type size={16} className="text-indigo-300" /> ตั้งคำประจำข้อ (1–20) <span className="font-normal text-slate-400">— โชว์บนหัวตาราง + ในไฟล์ Excel</span></span>
          <ChevronDown size={18} className={`transition ${showWords ? "rotate-180" : ""}`} />
        </button>
        {showWords && (
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {words.map((w, i) => (
              <label key={i} className="flex items-center gap-1.5 text-xs">
                <span className="w-9 shrink-0 text-right font-semibold text-slate-400">ข้อ {i + 1}</span>
                <input value={w} onChange={(e) => setWords((ws) => ws.map((x, j) => (j === i ? e.target.value : x)))} placeholder="คำ"
                  className="w-full rounded-md bg-slate-800 px-2 py-1 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400/40" />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-auto max-h-[72vh]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-slate-300">
              <th className="sticky left-0 top-0 z-30 border-b border-white/10 bg-slate-950 px-3 py-2 text-left font-bold">ชื่อ-สกุล</th>
              {Array.from({ length: N }, (_, i) => (
                <th key={i} className={`sticky top-0 z-20 w-12 border-b border-white/10 bg-slate-950 px-0.5 py-2 text-center align-bottom text-xs font-bold ${i > 0 && i % 5 === 0 ? "border-l border-white/15" : ""}`}>
                  <div>{i + 1}</div>
                  {words[i] ? <div className="truncate text-[9px] font-normal leading-tight text-amber-300/90" title={words[i]}>{words[i]}</div> : null}
                </th>
              ))}
              <th className="sticky right-0 top-0 z-30 border-b border-l border-white/10 bg-slate-950 px-2 py-2 text-center font-bold">คะแนน</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, si) => {
              const sc = r.items.reduce((a, b) => a + b, 0);
              const pass = sc / N >= REGULAR_PASS_RATIO;
              return (
                <tr key={r.id} className="group border-t border-white/5">
                  <td className="sticky left-0 z-10 max-w-[190px] truncate bg-slate-950 px-3 py-1.5 font-medium text-slate-100 group-hover:bg-slate-900">
                    <div className="flex items-center gap-1.5"><span className="text-xs tabular-nums text-slate-500">{si + 1}.</span> {r.name}</div>
                    <div className="flex gap-2 pl-4 text-[11px]">
                      <button onClick={() => setAll(si, 1)} className="text-emerald-400 hover:underline">ถูกหมด</button>
                      <button onClick={() => setAll(si, 0)} className="text-rose-400 hover:underline">ล้าง</button>
                    </div>
                  </td>
                  {r.items.map((v, ci) => (
                    <td key={ci} className={`p-0.5 text-center transition group-hover:bg-indigo-500/10 ${ci > 0 && ci % 5 === 0 ? "border-l border-white/10" : ""}`}>
                      <button onClick={() => toggle(si, ci)}
                        className={`h-6 w-6 rounded-md text-xs font-bold transition ${v ? "bg-emerald-500/90 text-white shadow-[0_0_8px_-2px_rgba(16,185,129,.9)]" : "bg-slate-800 text-slate-600 hover:bg-slate-600"}`}>
                        {v ? "✓" : ""}
                      </button>
                    </td>
                  ))}
                  <td className={`sticky right-0 z-10 border-l border-white/10 bg-slate-950 px-2 py-1.5 text-center font-extrabold group-hover:bg-slate-900 ${pass ? "text-emerald-400" : "text-rose-400"}`}>
                    {sc}/{N}<div className="text-[11px] font-semibold">{pass ? "ผ่าน" : "ไม่ผ่าน"}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">{rows.length} คน · กดช่องเพื่อให้คะแนนรายข้อ (✓ = ถูก) · ผ่านที่ 50%</div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-rose-300">{msg}</span>}
          <button onClick={save} disabled={pending}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2.5 font-bold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60">
            {pending ? <Loader2 className="animate-spin" size={18} /> : saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? "บันทึกแล้ว" : "บันทึกคะแนน"}
          </button>
        </div>
      </div>

      {nT > 0 && (
        <div className="card overflow-auto p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-ink">วิเคราะห์ข้อสอบ (สด)</h3>
            <span className="text-sm text-slate-300">ทั้งบท {totalScore}/{totalMax} · <b className="text-amber-300">{chapterPct}%</b> · จาก {nT} คน</span>
          </div>
          <table className="border-collapse text-center text-sm">
            <tbody>
              <tr>
                <th className="border border-white/10 bg-slate-900 px-2 py-1.5 text-right font-bold text-slate-300">ข้อ</th>
                {Array.from({ length: N }, (_, i) => (
                  <th key={i} className="w-10 border border-white/10 bg-slate-900 px-0.5 py-1.5 font-bold align-bottom">
                    <div>{i + 1}</div>
                    {words[i] ? <div className="truncate text-[9px] font-normal text-amber-300/90" title={words[i]}>{words[i]}</div> : null}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-white/10 bg-slate-900 px-2 py-1.5 text-right font-semibold text-slate-300">ถูก (คน)</th>
                {itemCorrect.map((c, i) => <td key={i} className="border border-white/10 px-0 py-1.5 tabular-nums text-emerald-300">{c}</td>)}
              </tr>
              <tr>
                <th className="border border-white/10 bg-slate-900 px-2 py-1.5 text-right font-semibold text-slate-300">ระดับ</th>
                {itemCorrect.map((c, i) => {
                  const lv = itemLevel(c / nT);
                  return <td key={i} className={`border border-white/10 px-0 py-1.5 text-xs font-bold ${lvlColor(lv)}`}>{lv}</td>;
                })}
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-xs text-slate-400">ง่าย = ตอบถูก ≥80% · ดี = 50–79% · ยาก = ตอบถูก &lt;50%</div>
        </div>
      )}
    </div>
  );
}

function normalize(a: number[] | null | undefined): number[] {
  const out = Array(N).fill(0);
  if (Array.isArray(a)) for (let i = 0; i < N; i++) out[i] = a[i] ? 1 : 0;
  return out;
}
function normalizeWords(a: string[] | null | undefined): string[] {
  const out = Array(N).fill("");
  if (Array.isArray(a)) for (let i = 0; i < N; i++) out[i] = typeof a[i] === "string" ? a[i] : "";
  return out;
}
