-- Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.registrations(
 id uuid primary key default gen_random_uuid(),
 guardian_name text not null,
 guardian_email text not null,
 guardian_phone text not null,
 child_name text not null,
 child_age integer not null check(child_age between 1 and 17),
 bio text default '',
 photo_path text not null,
 photo_url text not null,
 consent boolean not null default false,
 status text not null default 'pending' check(status in('pending','approved','rejected')),
 created_at timestamptz not null default now()
);

alter table public.registrations enable row level security;
revoke all on public.registrations from anon, authenticated;
grant insert on public.registrations to anon;

drop policy if exists "Anyone can submit a registration" on public.registrations;
create policy "Anyone can submit a registration" on public.registrations
for insert to anon with check(
 consent=true and status='pending'
 and char_length(trim(guardian_name)) between 2 and 100
 and char_length(trim(guardian_email)) between 5 and 160
 and char_length(trim(guardian_phone)) between 7 and 30
 and char_length(trim(child_name)) between 2 and 100
 and child_age between 1 and 17
 and char_length(coalesce(bio,''))<=600
);

create table if not exists public.contestants(
 id uuid primary key default gen_random_uuid(),
 contestant_number integer unique not null,
 child_name text not null,
 bio text default '',
 photo_url text not null,
 vote_count integer not null default 0,
 status text not null default 'approved' check(status='approved'),
 created_at timestamptz not null default now()
);

alter table public.contestants enable row level security;
revoke all on public.contestants from anon, authenticated;
grant select on public.contestants to anon;

drop policy if exists "Public can view approved contestants" on public.contestants;
create policy "Public can view approved contestants" on public.contestants
for select to anon using(status='approved');

create or replace view public.contestants_public
with(security_invoker=true) as
select id,contestant_number,child_name,bio,photo_url,vote_count
from public.contestants where status='approved';

grant select on public.contestants_public to anon;

-- Storage: first create a PUBLIC bucket named contestant-photos.
drop policy if exists "Anonymous can upload pending contestant photos" on storage.objects;
create policy "Anonymous can upload pending contestant photos" on storage.objects
for insert to anon with check(
 bucket_id='contestant-photos'
 and (storage.foldername(name))[1]='pending'
 and lower(storage.extension(name)) in('jpg','jpeg','png','webp')
);

drop policy if exists "Public can view contestant photos" on storage.objects;
create policy "Public can view contestant photos" on storage.objects
for select to anon using(bucket_id='contestant-photos');
