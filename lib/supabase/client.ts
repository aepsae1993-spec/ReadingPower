"use client";
import { createBrowserClient } from "@supabase/ssr";

// จำ session ไว้ ~400 วัน (เข้าครั้งเดียวอยู่ยาว ไม่ต้องล็อกอินบ่อย)
const REMEMBER_DAYS = 400;

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { maxAge: 60 * 60 * 24 * REMEMBER_DAYS, sameSite: "lax", path: "/" } }
  );
