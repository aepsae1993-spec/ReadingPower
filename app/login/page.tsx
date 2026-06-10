"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, LogIn, Loader2 } from "lucide-react";

const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message === "Invalid login credentials" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : (e?.message ?? "เข้าสู่ระบบไม่สำเร็จ"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="mb-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-glow">
          <Sparkles />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">READING POWER</h1>
        <p className="text-sm text-slate-400">เข้าสู่ระบบสำหรับครู</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-3 p-5">
        <div>
          <label className="text-xs font-semibold text-slate-400">อีเมล</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-slate-100 outline-none ring-indigo-400/40 placeholder:text-slate-500 focus:ring-2"
            placeholder="teacher@school.ac.th" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400">รหัสผ่าน</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-slate-100 outline-none ring-indigo-400/40 placeholder:text-slate-500 focus:ring-2"
            placeholder="••••••••" />
        </div>
        {err && <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/30">{err}</div>}
        {!configured && <div className="rounded-lg bg-amber-500/15 px-3 py-2 text-xs text-amber-300 ring-1 ring-amber-500/30">โหมดเดโม: ยังไม่ได้ตั้งค่า Supabase (ดูแดชบอร์ดข้อมูลตัวอย่างได้โดยไม่ต้องล็อกอิน)</div>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2.5 font-bold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} เข้าสู่ระบบ
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-slate-500">สร้างบัญชีครูได้ที่ Supabase → Authentication → Users</p>
    </div>
  );
}
