-- ===== แก้ขอบเขตคอลัมน์ chapter ให้รองรับบท 1-50 + Pre/Post-Test (101-104) =====
-- รันใน Supabase > SQL Editor ครั้งเดียว (ของเดิมจำกัด chapter ไว้ 1-30 จึงบันทึกบท >30 และ Pre/Post ไม่ได้)

alter table public.chapter_scores
  drop constraint if exists chapter_scores_chapter_check;

alter table public.chapter_scores
  add constraint chapter_scores_chapter_check check (chapter between 1 and 110);

-- ให้ stage มีค่าเริ่มต้น = 1 (ระบบใหม่เขียน stage=1 เสมอ)
alter table public.chapter_scores
  alter column stage set default 1;
