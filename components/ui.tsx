import { tier } from "@/lib/design";
import { Progress } from "@/lib/progression";
import { STAGES } from "@/lib/types";
import { BookOpen, CheckCheck, PenLine } from "lucide-react";

export const STAGE_ICON = [BookOpen, CheckCheck, PenLine];

export function TierBadge({ set, name = true, size = "md" }: { set: number; name?: boolean; size?: "sm" | "md" | "lg" }) {
  const t = tier(set);
  const pad = size === "lg" ? "px-4 py-2 text-base" : size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`chip ${pad} bg-gradient-to-r ${t.grad} text-white shadow-neon ring-1 ${t.ring}`}>
      <span className="drop-shadow">{t.emoji}</span> ชุด {set}{name && <span className="opacity-90">· {t.name}</span>}
    </span>
  );
}

export function ProgressBar({ value, max, gradient = "from-indigo-500 to-fuchsia-500", height = "h-2.5" }: { value: number; max: number; gradient?: string; height?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/5 ${height}`}>
      <div className={`h-full rounded-full bg-gradient-to-r ${gradient} shadow-[0_0_12px_-2px_rgba(167,139,250,.7)]`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PositionPill({ p }: { p: Progress }) {
  if (p.isMaxed) return <span className="chip bg-purple-500/20 px-2.5 py-1 text-purple-200 ring-1 ring-purple-400/30">🏆 จบครบทุกชุด</span>;
  const s = STAGES[p.currentStage - 1];
  return (
    <span className="chip bg-white/10 px-2.5 py-1 text-slate-200 ring-1 ring-white/10">
      ด่าน {p.currentStage} · {s.short} · บท {p.currentChapter}
    </span>
  );
}

export function StatCard({ label, value, sub, accent = "text-indigo-300" }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold tracking-tight ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function RankMedal({ rank }: { rank: number }) {
  const map: Record<number, string> = {
    1: "bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-900 shadow-neon",
    2: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900",
    3: "bg-gradient-to-br from-amber-500 to-amber-700 text-white",
  };
  return (
    <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold ${map[rank] ?? "bg-white/10 text-slate-300 ring-1 ring-white/10"}`}>
      {rank}
    </span>
  );
}

/** เส้นทาง 6 ชุด × 3 ด่าน */
export function SetTrack({ p }: { p: Progress }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {p.bySet.map((sp) => {
        const t = tier(sp.setNo);
        const active = sp.setNo === p.currentSet && !p.isMaxed;
        return (
          <div key={sp.setNo} className={`rounded-xl border p-2.5 ${sp.complete ? "border-emerald-400/20 bg-emerald-500/10" : active ? "border-indigo-400/50 bg-indigo-500/10 ring-1 ring-indigo-400/30" : "border-white/10 bg-white/5"}`}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100">{t.emoji} ชุด {sp.setNo}</span>
              {sp.complete && <span className="text-[10px] font-bold text-emerald-400">ผ่าน ✓</span>}
            </div>
            <div className="space-y-1">
              {sp.stages.map((st) => {
                const Icon = STAGE_ICON[st.stage - 1];
                return (
                  <div key={st.stage} className="flex items-center gap-1.5">
                    <Icon size={12} className="shrink-0 text-slate-500" />
                    <ProgressBar value={st.passed} max={st.total} height="h-1.5" gradient={t.grad} />
                    <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-slate-500">{st.passed}/{st.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
