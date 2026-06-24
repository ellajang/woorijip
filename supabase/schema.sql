-- 우리집 설명서 — Supabase 초기 스키마
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- (또는 supabase CLI: supabase db execute -f supabase/schema.sql)

-- 1) 설명서 테이블 ----------------------------------------------------------
create table if not exists public.manuals (
  id          uuid        primary key,
  title       text        not null,
  video_path  text        not null,
  created_at  timestamptz not null default now()
);

alter table public.manuals enable row level security;

-- ⚠️ MVP 단계 정책: 로그인이 없으므로 익명(anon)에게 읽기/쓰기를 모두 허용한다.
--    누구나 insert/select 가능 → 검증 단계 한정. 절대 운영에 그대로 두지 말 것.
--    TODO(Auth 도입 시): owner_id uuid 컬럼 추가 + "본인 것만 쓰기 / 공개 읽기"로 교체.
drop policy if exists "anon read manuals" on public.manuals;
create policy "anon read manuals"
  on public.manuals for select
  to anon
  using (true);

drop policy if exists "anon insert manuals" on public.manuals;
create policy "anon insert manuals"
  on public.manuals for insert
  to anon
  with check (true);

-- 2) 영상 저장용 Storage 버킷 ----------------------------------------------
-- 공개 버킷(public=true): 재생 URL(getPublicUrl)을 바로 쓸 수 있다.
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- 익명 업로드 허용 (MVP 한정 — Auth 도입 시 좁힐 것)
drop policy if exists "anon upload videos" on storage.objects;
create policy "anon upload videos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'videos');

-- 공개 버킷이라 읽기는 정책 없이도 공개 URL로 접근 가능하다.
