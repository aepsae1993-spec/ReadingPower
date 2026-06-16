-- ===== ประวัติการสอบ (รองรับสอบซ้ำ/พัฒนาคะแนน) =====
-- รันใน Supabase > SQL Editor ครั้งเดียว
-- ทุกครั้งที่กรอกคะแนนจะบันทึกที่นี่ · ตาราง chapter_scores เก็บ "คะแนนดีที่สุด" เป็นค่าทางการ

create table if not exists public.chapter_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  set_no smallint not null,
  stage smallint not null default 1,
  chapter smallint not null,
  score smallint not null,
  total smallint not null,
  items jsonb,
  created_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);
create index if not exists attempts_lookup on public.chapter_attempts(student_id, set_no, chapter, created_at);

alter table public.chapter_attempts enable row level security;

drop policy if exists "auth read attempts" on public.chapter_attempts;
drop policy if exists "auth write attempts" on public.chapter_attempts;
drop policy if exists "public read attempts" on public.chapter_attempts;

create policy "auth read attempts"  on public.chapter_attempts for select using (auth.role() = 'authenticated');
create policy "auth write attempts" on public.chapter_attempts for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- ให้ลิงก์ผู้ปกครอง (/report) เห็นประวัติพัฒนาการด้วย:
create policy "public read attempts" on public.chapter_attempts for select using (true);
