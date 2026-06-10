import { createClient, isConfigured } from "@/lib/supabase/server";
import { gradeName } from "@/lib/design";
import { addStudent, bulkAddStudents, removeStudent } from "./actions";
import { UserPlus, Trash2, Users2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  if (!isConfigured()) {
    return <div className="card p-8 text-center text-slate-300">โหมดเดโม — เชื่อมต่อ Supabase ก่อนจึงจะจัดการนักเรียนได้</div>;
  }
  const sb = createClient();
  const { data: students } = await sb.from("students").select("id,name,grade").eq("active", true).order("grade").order("name");
  const byGrade = (g: number) => (students ?? []).filter((s: any) => s.grade === g);
  const sel = "rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/40";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink"><Users2 /> จัดการนักเรียน</h1>
        <p className="text-sm text-slate-400">เพิ่มทีละคน หรือวางหลายชื่อ (บรรทัดละ 1 ชื่อ) · ทั้งหมด {students?.length ?? 0} คน</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* single */}
        <form action={addStudent} className="card space-y-3 p-4">
          <div className="flex items-center gap-2 font-bold text-ink"><UserPlus size={18} /> เพิ่มนักเรียน</div>
          <input name="name" required placeholder="ชื่อ-สกุล" className={`${sel} w-full`} />
          <div className="flex gap-2">
            <select name="grade" className={sel} defaultValue={4}>{[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>ป.{g}</option>)}</select>
            <input name="room" placeholder="ห้อง (ถ้ามี)" className={`${sel} w-24`} />
            <button className="ml-auto rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 font-bold text-white shadow-glow">เพิ่ม</button>
          </div>
        </form>
        {/* bulk */}
        <form action={bulkAddStudents} className="card space-y-3 p-4">
          <div className="font-bold text-ink">วางหลายชื่อพร้อมกัน</div>
          <textarea name="names" rows={4} placeholder={"เด็กชาย ก\nเด็กหญิง ข\n..."} className={`${sel} w-full resize-none`} />
          <div className="flex items-center gap-2">
            <select name="grade" className={sel} defaultValue={4}>{[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>ป.{g}</option>)}</select>
            <input name="room" placeholder="ห้อง" className={`${sel} w-24`} />
            <button className="ml-auto rounded-lg bg-white/10 px-4 py-2 font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/20">เพิ่มทั้งหมด</button>
          </div>
        </form>
      </div>

      {[1, 2, 3, 4, 5, 6].map((g) => {
        const list = byGrade(g);
        if (!list.length) return null;
        return (
          <section key={g} className="card overflow-hidden">
            <div className="border-b border-white/10 px-4 py-2.5 font-bold text-ink">{gradeName(g)} <span className="text-sm font-normal text-slate-400">· {list.length} คน</span></div>
            <ul className="divide-y divide-white/5">
              {list.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-2">
                  <span className="text-slate-100">{s.name}</span>
                  <form action={removeStudent}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-300" title="นำออก"><Trash2 size={15} /></button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
