"use client";
import { usePathname } from "next/navigation";

/** ซ่อนเมนูครูบนหน้าที่เปิดสาธารณะ (รายงานผู้ปกครอง) */
export default function NavGate({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  if (p?.startsWith("/report")) return null;
  return <>{children}</>;
}
