"use client";
import { useRouter } from "next/navigation";
import { STAGES, stageChapters } from "@/lib/types";

export default function EntrySelector({ grade, setNo, stage, chapter }: { grade: number; setNo: number; stage: number; chapter: number }) {
  const router = useRouter();
  const go = (p: Record<string, number>) => {
    const q = new URLSearchParams({ grade: String(grade), set: String(setNo), stage: String(stage), chapter: String(chapter), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) });
    // reset chapter to 1 if stage changes and chapter out of range
    const ns = p.stage ?? stage;
    if (Number(q.get("chapter")) > stageChapters(ns as any)) q.set("chapter", "1");
    router.push(`/entry?${q.toString()}`);
  };
  const sel = "rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/40";
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label="ชั้น">
        <select value={grade} onChange={(e) => go({ grade: +e.target.value })} className={sel}>
          {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>ป.{g}</option>)}
        </select>
      </Field>
      <Field label="ชุด">
        <select value={setNo} onChange={(e) => go({ set: +e.target.value })} className={sel}>
          {[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>ชุด {s}</option>)}
        </select>
      </Field>
      <Field label="ด่าน">
        <select value={stage} onChange={(e) => go({ stage: +e.target.value })} className={sel}>
          {STAGES.map((s) => <option key={s.id} value={s.id}>ด่าน {s.id} · {s.short}</option>)}
        </select>
      </Field>
      <Field label="บท">
        <select value={chapter} onChange={(e) => go({ chapter: +e.target.value })} className={sel}>
          {Array.from({ length: stageChapters(stage as any) }, (_, i) => i + 1).map((c) => <option key={c} value={c}>บท {c}</option>)}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-400">{label}</span>
      {children}
    </label>
  );
}
