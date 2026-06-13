-- ===== ระบบติดตามการอ่าน (Supabase schema) =====
-- รัน SQL นี้ใน Supabase > SQL Editor

-- โปรไฟล์ครู (ผูกกับ auth.users)
create table if not exists public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

-- นักเรียน
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade smallint not null check (grade between 1 and 6),
  room text,
  no smallint, -- เลขที่
  active boolean default true,
  created_at timestamptz default now()
);
create index if not exists students_grade_idx on public.students(grade);

-- คะแนนรายบท: 1 แถว = (นักเรียน, ชุด, บท)
-- chapter: 1..50 = บทในชุด (หาร 5 ลงตัว = แต่งประโยค เต็ม 15 · ที่เหลือ = กดถูก/ผิด เต็ม 20)
--          101=Pre-Test อ่าน 102=Pre-Test ถูกผิด 103=Post-Test อ่าน 104=Post-Test ถูกผิด (กดถูก/ผิด เต็ม 20)
-- stage: คงไว้เพื่อความเข้ากันได้ (ปัจจุบันเขียน 1 เสมอ)
create table if not exists public.chapter_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  set_no smallint not null check (set_no between 1 and 6),
  stage smallint not null default 1 check (stage between 1 and 3),
  chapter smallint not null check (chapter between 1 and 110),
  score smallint not null default 0,         -- คะแนนที่ได้
  total smallint not null default 20,        -- คะแนนเต็มของบทนั้น (20 หรือ 15)
  items jsonb,                               -- รายข้อ 0/1 เช่น [1,0,1,...] (ไว้วิเคราะห์ ง่าย/ดี/ยาก)
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  unique (student_id, set_no, stage, chapter)
);
create index if not exists scores_student_idx on public.chapter_scores(student_id);

-- ===== Row Level Security: ครูที่ล็อกอินแล้วเข้าถึงได้ =====
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.chapter_scores enable row level security;

create policy "teacher reads self" on public.teachers for select using (auth.uid() = id);
create policy "teacher upserts self" on public.teachers for insert with check (auth.uid() = id);

-- ครูที่ล็อกอิน (authenticated) อ่าน/เขียนข้อมูลนักเรียนและคะแนนได้
create policy "auth read students"  on public.students for select using (auth.role() = 'authenticated');
create policy "auth write students" on public.students for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth read scores"    on public.chapter_scores for select using (auth.role() = 'authenticated');
create policy "auth write scores"   on public.chapter_scores for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- (ทางเลือก) ถ้าต้องการให้ "แดชบอร์ดดูสาธารณะ" เปิดอ่านได้โดยไม่ล็อกอิน ให้รันเพิ่ม:
-- create policy "public read students" on public.students for select using (true);
-- create policy "public read scores"   on public.chapter_scores for select using (true);
