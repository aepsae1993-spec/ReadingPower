import Link from "next/link";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { PenSquare, Users2, LogOut } from "lucide-react";

export default async function AuthNav() {
  if (!isConfigured()) {
    return <span className="chip bg-amber-500/15 px-2.5 py-1 text-amber-300 ring-1 ring-amber-500/30">เดโม</span>;
  }
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  return (
    <>
      <Link href="/students" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10">
        <Users2 size={16} /> <span className="hidden sm:inline">นักเรียน</span>
      </Link>
      <Link href="/entry" className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-2 font-bold text-white shadow-glow hover:brightness-110">
        <PenSquare size={16} /> กรอกคะแนน
      </Link>
      <form action="/auth/signout" method="post">
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-slate-400 hover:bg-white/10" title="ออกจากระบบ">
          <LogOut size={16} />
        </button>
      </form>
    </>
  );
}
