"use client";
import { useState, useTransition } from "react";
import { deleteAllScores } from "@/app/students/actions";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

export default function DeleteScoresButton() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = () => {
    setMsg(null);
    start(async () => {
      const res = await deleteAllScores(pw);
      if (res.ok) { setMsg({ ok: true, text: `ลบคะแนนแล้ว ${res.count} รายการ · ข้อมูลนักเรียนยังอยู่ครบ` }); setPw(""); setOpen(false); }
      else setMsg({ ok: false, text: res.error ?? "ลบไม่สำเร็จ" });
    });
  };

  return (
    <section className="card border border-rose-500/30 p-4">
      <div className="flex items-center gap-2 font-bold text-rose-300"><AlertTriangle size={18} /> โซนอันตราย</div>
      <p className="mt-1 text-sm text-slate-300">ลบคะแนนทั้งหมด (รวม Pre/Post-Test) เพื่อล้างข้อมูลทดสอบ — <b className="text-slate-100">ข้อมูลนักเรียนคงไว้</b> · ลบแล้วกู้คืนไม่ได้</p>

      {!open ? (
        <button onClick={() => { setOpen(true); setMsg(null); }}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-300 ring-1 ring-rose-500/30 transition hover:bg-rose-500/25">
          <Trash2 size={16} /> ลบคะแนนทั้งหมด
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="ใส่รหัสผู้ดูแล" autoFocus
            className="w-full max-w-xs rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-rose-400/40" />
          <div className="flex gap-2">
            <button onClick={run} disabled={pending || !pw}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-500 disabled:opacity-50">
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} ยืนยันลบทั้งหมด
            </button>
            <button onClick={() => { setOpen(false); setPw(""); }} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/20">ยกเลิก</button>
          </div>
        </div>
      )}

      {msg && <div className={`mt-2 text-sm font-semibold ${msg.ok ? "text-emerald-300" : "text-rose-300"}`}>{msg.text}</div>}
    </section>
  );
}
