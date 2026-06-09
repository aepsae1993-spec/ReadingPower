# แดชบอร์ดนักอ่าน 🏆 (Reading Dashboard)

ระบบติดตามความก้าวหน้าการอ่านแบบเกม สำหรับนักเรียน ป.1–ป.6
**ชุด 1–6** (ยิ่งสูงยิ่งเก่ง) แต่ละชุดมี **3 ด่าน**:

1. **ด่าน 1 — บัญชีคำพื้นฐาน** (30 บท)
2. **ด่าน 2 — อ่านถูกผิด** (20 บท)
3. **ด่าน 3 — แต่งประโยค** (20 บท)

ผ่านบทเมื่อทำคะแนน **≥ 50%** → ครบทุกบทในด่านก็ผ่านด่าน → ครบ 3 ด่านก็เลื่อนชุด (ระบบคิดให้อัตโนมัติ)

แดชบอร์ด: **ประจำโรงเรียน** (อันดับรวม + หอเกียรติยศ) · **ประจำชั้น** (ป.1–6) · **รายคน** (เส้นทาง 6 ชุด)

เทคโนโลยี: **Next.js (App Router) + Tailwind + Supabase** · deploy บน **Vercel**

---

## รันในเครื่อง (เดโม ใช้ข้อมูลตัวอย่าง)
```bash
npm install
npm run dev      # เปิด http://localhost:3000
```
ตอนนี้ใช้ "ข้อมูลตัวอย่าง" (`lib/mock.ts`) จึงเห็นหน้าตาได้ทันทีโดยยังไม่ต้องมีฐานข้อมูล

## ต่อฐานข้อมูลจริง (Supabase)
1. สร้างโปรเจกต์ที่ https://supabase.com → คัดลอก **Project URL** และ **anon key** (Settings → API)
2. SQL Editor → วางและรันไฟล์ [`supabase/schema.sql`](supabase/schema.sql)
3. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่า URL/anon key
4. สร้างบัญชีครู: Supabase → Authentication → Users → Add user (อีเมล+รหัส)

> สถานะ: หน้าจอแดชบอร์ดเสร็จแล้ว (อ่านจาก `lib/data.ts`) — ขั้นต่อไปคือสลับ `getAllStudents()` ให้ดึงจาก Supabase, หน้า **ล็อกอินครู**, และหน้า **กรอกคะแนนรายข้อ 0/1**

## Deploy ขึ้น Vercel
1. push โค้ดขึ้น GitHub (`git init && git add . && git commit -m "init" && git push`)
2. ไป https://vercel.com → New Project → เลือก repo
3. ใส่ Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy 🎉

## โครงสร้าง
```
app/            หน้าเว็บ (โรงเรียน / ห้องเรียน / รายคน)
components/      ชิ้นส่วน UI (การ์ด, แถบความก้าวหน้า, ป้ายชุด)
lib/            types, ตรรกะเลื่อนขั้น (progression.ts), data, mock, design (สีชุด)
supabase/       schema.sql
```
