"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ParentLinkButton({ id, label }: { id?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}${id ? `/report/${id}` : "/report"}`;
    try { await navigator.clipboard.writeText(url); } catch { window.prompt("คัดลอกลิงก์สำหรับผู้ปกครอง:", url); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} title="คัดลอกลิงก์รายงานสำหรับผู้ปกครอง (เปิดดูได้โดยไม่ต้องล็อกอิน)"
      className="flex items-center gap-2 rounded-xl bg-sky-500/15 px-4 py-2 text-sm font-bold text-sky-300 ring-1 ring-sky-500/30 transition hover:bg-sky-500/25">
      {copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? "คัดลอกลิงก์แล้ว" : (label ?? "ลิงก์ผู้ปกครอง")}
    </button>
  );
}
