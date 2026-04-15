-- ============================================
-- GigBoard — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Events table
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  address text default '',
  latitude double precision,
  longitude double precision,
  price numeric(10,2),
  start_date timestamptz not null,
  end_date timestamptz not null,
  created_at timestamptz default now()
);

-- Tags table
create table if not exists tags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  color text default '#6366f1'
);

-- Event <-> Tag junction
create table if not exists event_tags (
  event_id uuid references events(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (event_id, tag_id)
);

-- Bands (lineup per event)
create table if not exists bands (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  name text not null
);

-- Checkboxes (tickets, participants, etc.)
create table if not exists checkboxes (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  label text not null,
  checked boolean default false
);

-- Enable Row Level Security but allow all access (open/shared)
alter table events enable row level security;
alter table tags enable row level security;
alter table event_tags enable row level security;
alter table bands enable row level security;
alter table checkboxes enable row level security;

create policy "Allow all on events" on events for all using (true) with check (true);
create policy "Allow all on tags" on tags for all using (true) with check (true);
create policy "Allow all on event_tags" on event_tags for all using (true) with check (true);
create policy "Allow all on bands" on bands for all using (true) with check (true);
create policy "Allow all on checkboxes" on checkboxes for all using (true) with check (true);

-- Seed a few default tags (customize these!)
insert into tags (name, color) values
  ('Rock', '#ef4444'),
  ('Jazz', '#f59e0b'),
  ('Electronic', '#8b5cf6'),
  ('Hip-Hop', '#10b981'),
  ('Classical', '#3b82f6'),
  ('Metal', '#64748b'),
  ('Indie', '#ec4899'),
  ('Reggae', '#14b8a6')
on conflict (name) do nothing;
