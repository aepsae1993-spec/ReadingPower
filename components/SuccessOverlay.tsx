"use client";

const SPARKLES = [
  { dx: "-70px", dy: "-60px", d: ".15s", c: "bg-amber-300" },
  { dx: "80px", dy: "-50px", d: ".25s", c: "bg-emerald-300" },
  { dx: "-90px", dy: "40px", d: ".3s", c: "bg-fuchsia-300" },
  { dx: "75px", dy: "55px", d: ".2s", c: "bg-sky-300" },
  { dx: "0px", dy: "-90px", d: ".35s", c: "bg-amber-200" },
  { dx: "-40px", dy: "80px", d: ".4s", c: "bg-teal-200" },
];

export default function SuccessOverlay({ show, message = "บันทึกสำเร็จ", sub = "ข้อมูลถูกบันทึกเรียบร้อยแล้ว" }: { show: boolean; message?: string; sub?: string }) {
  if (!show) return null;
  return (
    <div className="success-fade fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        {/* glow */}
        <div className="pointer-events-none absolute left-1/2 top-12 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-500/30 blur-3xl" />

        {/* sparkles */}
        {SPARKLES.map((s, i) => (
          <span key={i} className={`success-sparkle absolute left-1/2 top-16 h-2.5 w-2.5 rounded-full ${s.c} shadow-[0_0_10px_2px_rgba(255,255,255,.5)]`}
            style={{ ["--dx" as any]: s.dx, ["--dy" as any]: s.dy, animationDelay: s.d }} />
        ))}

        {/* badge */}
        <div className="relative grid h-32 w-32 place-items-center">
          <span className="success-ring absolute inset-0 rounded-full ring-4 ring-emerald-400/60" />
          <span className="success-badge relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-600 shadow-[0_0_60px_-6px_rgba(16,185,129,.9),inset_0_2px_8px_rgba(255,255,255,.4)] ring-1 ring-white/40">
            <svg viewBox="0 0 52 52" className="h-20 w-20" fill="none">
              <path className="success-check" d="M14 27 l8 8 l16 -19" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* text */}
        <div className="mt-6 text-center">
          <div className="success-text-shimmer bg-gradient-to-r from-emerald-300 via-amber-200 to-emerald-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow">
            {message}
          </div>
          <div className="success-text mt-2 text-sm font-medium text-slate-300">{sub}</div>
        </div>
      </div>
    </div>
  );
}
