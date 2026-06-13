import { tier } from "@/lib/design";
import { Progress } from "@/lib/progression";
import { SCORED_CHAPTERS, PASS_SCORE } from "@/lib/types";
import { Crown } from "lucide-react";

/** ช่อมะกอกประดับเหรียญ */
function Laurel({ className = "" }: { className?: string }) {
  const leaves: [number, number, number][] = [[30, 72, -22], [24, 60, -12], [21, 48, -2], [22, 36, 10], [27, 25, 26], [35, 16, 42]];
  return (
    <svg viewBox="0 0 120 92" className={className} fill="none">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity=".85">
        <path d="M45 86 C26 76 17 53 26 24" />
        <path d="M75 86 C94 76 103 53 94 24" />
      </g>
      <g fill="currentColor">
        {leaves.map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="7" ry="3.4" transform={`rotate(${r} ${x} ${y})`} />)}
        {leaves.map(([x, y, r], i) => <ellipse key={"r" + i} cx={120 - x} cy={y} rx="7" ry="3.4" transform={`rotate(${-r} ${120 - x} ${y})`} />)}
      </g>
    </svg>
  );
}

/** เหรียญหอเกียรติยศ (ทรงกลม + ช่อมะกอก + เรืองแสง) */
export function RankEmblem({ rank }: { rank: number }) {
  const p = rank === 1
    ? { ring: "from-fuchsia-400 via-violet-400 to-indigo-500", glow: "shadow-[0_0_44px_-6px_rgba(168,85,247,.85)]", lau: "text-fuchsia-300/70" }
    : rank === 2
    ? { ring: "from-slate-200 to-slate-400", glow: "shadow-[0_0_30px_-8px_rgba(148,163,184,.8)]", lau: "text-slate-300/60" }
    : { ring: "from-amber-400 to-amber-700", glow: "shadow-[0_0_30px_-8px_rgba(217,119,6,.8)]", lau: "text-amber-400/60" };
  return (
    <div className="relative mx-auto h-24 w-28">
      <Laurel className={`absolute inset-0 h-full w-full ${p.lau}`} />
      <div className={`absolute left-1/2 top-1/2 grid h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br ${p.ring} ${p.glow}`}>
        <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-slate-950/85 ring-1 ring-white/20">
          {rank === 1 ? <Crown className="text-amber-300 drop-shadow" size={28} /> : <span className="text-2xl font-extrabold text-white">{rank}</span>}
        </div>
      </div>
    </div>
  );
}

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
  if (!p.started) return <span className="chip bg-white/5 px-2.5 py-1 text-slate-500 ring-1 ring-white/10">ยังไม่เริ่ม</span>;
  if (p.isMaxed) return <span className="chip bg-purple-500/20 px-2.5 py-1 text-purple-200 ring-1 ring-purple-400/30">🏆 จบครบทุกชุด</span>;
  return (
    <span className="chip bg-white/10 px-2.5 py-1 text-slate-200 ring-1 ring-white/10">
      บท {p.currentChapter}/50
    </span>
  );
}

/** ป้ายระดับ: ยังไม่เริ่ม = เทา, เริ่มแล้ว = ป้ายชุด */
export function LevelBadge({ p, name = true, size = "sm" }: { p: Progress; name?: boolean; size?: "sm" | "md" | "lg" }) {
  if (!p.started) return <span className="chip bg-white/5 px-2.5 py-1 text-xs text-slate-500 ring-1 ring-white/10">ยังไม่เริ่ม</span>;
  return <TierBadge set={p.isMaxed ? 6 : p.currentSet} name={name} size={size} />;
}

export function StatCard({ label, value, sub, accent = "text-indigo-300" }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold tracking-tight ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 text-sm text-slate-400">{sub}</div>}
    </div>
  );
}

export function RankMedal({ rank }: { rank: number }) {
  const g = rank === 1 ? "from-amber-300 to-yellow-500" : rank === 2 ? "from-slate-200 to-slate-400" : rank === 3 ? "from-amber-500 to-amber-700" : "from-indigo-400 to-fuchsia-500";
  return (
    <span className="relative grid h-9 w-8 shrink-0 place-items-center">
      <span className={`hexclip absolute inset-0 bg-gradient-to-br ${g} ${rank <= 3 ? "shadow-neon" : ""}`} />
      <span className="hexclip absolute inset-[2px] bg-slate-950" />
      <span className="relative text-sm font-extrabold text-white">{rank}</span>
    </span>
  );
}

/** เส้นทาง 6 ชุด — แต่ละชุดมี 10 บททดสอบ */
export function SetTrack({ p }: { p: Progress }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {p.bySet.map((sp) => {
        const t = tier(sp.setNo);
        const active = sp.setNo === p.currentSet && !p.isMaxed;
        return (
          <div key={sp.setNo} className={`rounded-xl border p-2.5 ${sp.complete ? "border-emerald-400/20 bg-emerald-500/10" : active ? "border-indigo-400/50 bg-indigo-500/10 ring-1 ring-indigo-400/30" : "border-white/10 bg-white/5"}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-100">{t.emoji} ชุด {sp.setNo}</span>
              {sp.complete ? <span className="text-[11px] font-bold text-emerald-400">ผ่าน ✓</span> : <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{sp.passed}/{sp.total}</span>}
            </div>
            <ProgressBar value={sp.passed} max={sp.total} height="h-1.5" gradient={t.grad} />
            <div className="mt-2 grid grid-cols-5 gap-1">
              {sp.scores.map((v, i) => (
                <span key={i} title={`บท ${SCORED_CHAPTERS[i]}${v == null ? "" : ` · ${v}/15`}`}
                  className={`h-2.5 rounded-full ${v == null ? "bg-slate-700" : v >= PASS_SCORE ? "bg-emerald-400" : "bg-rose-400/80"}`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
