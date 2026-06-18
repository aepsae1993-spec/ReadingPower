"use client";
import { useState, useTransition } from "react";
import { deleteChapter } from "@/app/entry/actions";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteChapterButton({ grade, setNo, chapter, label }: { grade: number; setNo: number; chapter: number; label: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = () => {
    setMsg(null);
    start(async () => {
      const res = await deleteChapter({ grade, setNo, chapter });
      if (res.ok) window.location.reload();
      else setMsg(res.error ?? "ลบไม่สำเร็จ");
    });
  };

  if (!confirm) {
    return (
      <button onClick={() => { setConfirm(true); setMsg(null); }}
        className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-300 ring-1 ring-rose-500/30 transition hover:bg-rose-500/20">
        <Trash2 size={16} /> ลบคะแนนบทนี้
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-rose-300">ลบ “{label}” ของทั้งห้องถาวร?</span>
      <button onClick={run} disabled={pending} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-rose-500 disabled:opacity-60">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} ยืนยันลบ
      </button>
      <button onClick={() => setConfirm(false)} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/20">ยกเลิก</button>
      {msg && <span className="text-sm text-rose-300">{msg}</span>}
    </div>
  );
}
