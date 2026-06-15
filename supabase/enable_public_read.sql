-- ===== เปิดให้ "อ่านอย่างเดียว" แบบสาธารณะ (สำหรับลิงก์รายงานผู้ปกครอง /report) =====
-- รันใน Supabase > SQL Editor ครั้งเดียว
-- จำเป็นเฉพาะถ้าต้องการให้ผู้ปกครองเปิดลิงก์ /report/<id> ได้โดยไม่ต้องล็อกอิน
-- (การกรอก/แก้ไขคะแนนยังต้องล็อกอินเหมือนเดิม — นี่คือสิทธิ์ SELECT เท่านั้น)

drop policy if exists "public read students" on public.students;
drop policy if exists "public read scores" on public.chapter_scores;

create policy "public read students" on public.students for select using (true);
create policy "public read scores"   on public.chapter_scores for select using (true);
