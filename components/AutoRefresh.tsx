"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  const [now, setNow] = useState("");

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setNow(fmt());
    const clock = setInterval(() => setNow(fmt()), 1000);
    const refresh = setInterval(() => router.refresh(), seconds * 1000);
    return () => { clearInterval(clock); clearInterval(refresh); };
  }, [router, seconds]);

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      เรียลไทม์ · {now || "—"} · รีเฟรชทุก {seconds} วิ
    </div>
  );
}
