-- 우리집 설명서 — Supabase 스키마
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.

-- 1) 설명서 테이블 ----------------------------------------------------------
create table if not exists public.manuals (
  id          uuid        primary key,
  title       text        not null,
  video_path  text        not null,
  video_paths text[]      not null default '{}',
  caption     text,
  user_id     uuid        references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- 기존 테이블 마이그레이션
alter table public.manuals
  add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.manuals
  add column if not exists video_paths text[] not null default '{}';
alter table public.manuals
  add column if not exists caption text;

alter table public.manuals enable row level security;

-- 정책 ----------------------------------------------------------------------
-- 읽기: 누구나 공개. 부모님이 로그인 없이 QR로 재생할 수 있어야 하므로 공개로 둔다.
drop policy if exists "anon read manuals" on public.manuals;
drop policy if exists "public read manuals" on public.manuals;
create policy "public read manuals"
  on public.manuals for select
  using (true);

-- 생성/수정/삭제: 로그인한 본인 것만.
drop policy if exists "anon insert manuals" on public.manuals;
drop policy if exists "auth insert own manuals" on public.manuals;
create policy "auth insert own manuals"
  on public.manuals for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "auth update own manuals" on public.manuals;
create policy "auth update own manuals"
  on public.manuals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "auth delete own manuals" on public.manuals;
create policy "auth delete own manuals"
  on public.manuals for delete
  to authenticated
  using (auth.uid() = user_id);

-- 2) 영상 저장용 Storage 버킷 ----------------------------------------------
-- 공개 버킷(public=true): 재생 URL(getPublicUrl)을 바로 쓸 수 있다.
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- 업로드는 로그인한 사용자만 허용 (재생은 공개 버킷이라 정책 없이 가능)
drop policy if exists "anon upload videos" on storage.objects;
drop policy if exists "auth upload videos" on storage.objects;
create policy "auth upload videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'videos');

-- 삭제는 본인이 올린 파일만 (설명서 삭제 시 영상 파일 제거용)
drop policy if exists "auth delete own videos" on storage.objects;
create policy "auth delete own videos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'videos' and owner = auth.uid());
