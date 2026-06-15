import Image from "next/image";
import { getAllStudents } from "@/lib/data.server";
import ReportBrowser from "@/components/ReportBrowser";

export const dynamic = "force-dynamic";

const LOGO_URL = "https://bwnjcxewplhtpvvnclfc.supabase.co/storage/v1/object/public/logo/school-logo.png";

export default async function ReportIndexPage() {
  const rows = await getAllStudents();
  const students = rows
    .map((r) => ({ id: r.id, name: r.name, grade: r.grade }))
    .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "th"));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="card overflow-hidden">
        <div className="flex items-center gap-4 bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-6 py-6 text-white">
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Image src={LOGO_URL} alt="โลโก้โรงเรียน" width={56} height={56} className="h-full w-full object-contain p-0.5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold">รายงานความก้าวหน้าการอ่าน</h1>
            <p className="text-sm text-white/85">สำหรับผู้ปกครอง — ค้นหาชื่อหรือเลือกชั้นเพื่อดูรายงานของบุตรหลาน</p>
          </div>
        </div>
      </section>

      <ReportBrowser students={students} />

      <p className="px-1 pb-2 text-center text-xs text-slate-500">ระบบ READING POWER · โรงเรียนวัดบางขุด (อุ่นพิทยาคาร)</p>
    </div>
  );
}
