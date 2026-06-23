-- ===== คำประจำข้อ (โจทย์รายข้อ) ต่อบท =====
-- รันใน Supabase > SQL Editor ครั้งเดียว · ไม่กระทบคะแนนเดิม (เพิ่มตารางใหม่เท่านั้น)
-- เก็บคำ 20 ข้อ ต่อ (ชุด, บท) ใช้ร่วมทุกห้อง

create table if not exists public.chapter_words (
  set_no smallint not null,
  stage smallint not null default 1,
  chapter smallint not null,
  words jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  primary key (set_no, stage, chapter)
);

alter table public.chapter_words enable row level security;
drop policy if exists "auth read words" on public.chapter_words;
drop policy if exists "auth write words" on public.chapter_words;
drop policy if exists "public read words" on public.chapter_words;
create policy "auth read words"  on public.chapter_words for select using (auth.role() = 'authenticated');
create policy "auth write words" on public.chapter_words for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "public read words" on public.chapter_words for select using (true);
