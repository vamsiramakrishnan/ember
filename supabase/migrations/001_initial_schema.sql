-- Ember — Supabase schema for the server-side mirror.
-- The client (IndexedDB) is the source of truth.
-- This schema stores the sync operations log and materialized views
-- of the latest state for each record.

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- SYNC OPERATIONS LOG
-- Every client mutation is recorded here. This is the backbone.
-- ============================================================

create table sync_operations (
  id text primary key,
  store text not null,
  action text not null check (action in ('put', 'delete')),
  key text not null,
  payload jsonb,
  client_timestamp bigint not null,
  server_timestamp timestamptz not null default now(),
  device_id text
);

create index idx_sync_ops_timestamp on sync_operations(client_timestamp);
create index idx_sync_ops_store on sync_operations(store);
create index idx_sync_ops_store_key on sync_operations(store, key);

-- ============================================================
-- MATERIALIZED STATE TABLES
-- Denormalized views of the latest state, built from the oplog.
-- These enable fast reads without replaying the entire log.
-- ============================================================

-- Sessions
create table sessions (
  id text primary key,
  number integer unique not null,
  date text not null,
  time_of_day text not null,
  topic text not null,
  created_at bigint not null,
  updated_at bigint not null
);

-- Notebook entries
create table entries (
  id text primary key,
  session_id text not null references sessions(id),
  "order" numeric not null,
  type text not null,
  entry jsonb not null,
  crossed_out boolean not null default false,
  bookmarked boolean not null default false,
  pinned boolean not null default false,
  blob_hash text,
  created_at bigint not null,
  updated_at bigint not null
);

create index idx_entries_session on entries(session_id, "order");
create index idx_entries_type on entries(type);
create index idx_entries_pinned on entries(pinned) where pinned = true;

-- Personal vocabulary
create table lexicon (
  id text primary key,
  number integer unique not null,
  term text unique not null,
  pronunciation text not null,
  definition text not null,
  level text not null,
  percentage integer not null,
  etymology text not null,
  cross_references jsonb not null default '[]',
  created_at bigint not null,
  updated_at bigint not null
);

-- Thinker encounters
create table encounters (
  id text primary key,
  ref text unique not null,
  thinker text not null,
  tradition text not null,
  core_idea text not null,
  session_topic text not null,
  date text not null,
  status text not null check (status in ('active', 'dormant', 'bridged', 'pending')),
  bridged_to text,
  created_at bigint not null,
  updated_at bigint not null
);

create index idx_encounters_thinker on encounters(thinker);
create index idx_encounters_status on encounters(status);

-- Primary texts
create table library (
  id text primary key,
  title text unique not null,
  author text not null,
  is_current boolean not null default false,
  annotation_count integer not null default 0,
  quote text not null,
  created_at bigint not null,
  updated_at bigint not null
);

-- Concept mastery
create table mastery (
  id text primary key,
  concept text unique not null,
  level text not null,
  percentage integer not null,
  created_at bigint not null,
  updated_at bigint not null
);

-- Curiosity threads
create table curiosities (
  id text primary key,
  question text not null,
  created_at bigint not null,
  updated_at bigint not null
);

-- Canvas state per session
create table canvas (
  id text primary key,
  session_id text unique not null references sessions(id),
  positions jsonb not null default '[]',
  connections jsonb not null default '[]',
  created_at bigint not null,
  updated_at bigint not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- When auth is added, these policies restrict to the owner.
-- ============================================================

alter table sync_operations enable row level security;
alter table sessions enable row level security;
alter table entries enable row level security;
alter table lexicon enable row level security;
alter table encounters enable row level security;
alter table library enable row level security;
alter table mastery enable row level security;
alter table curiosities enable row level security;
alter table canvas enable row level security;

-- Permissive policies for anonymous access (demo mode).
-- Replace with auth.uid() policies when authentication is added.
create policy "anon_full_access" on sync_operations for all using (true);
create policy "anon_full_access" on sessions for all using (true);
create policy "anon_full_access" on entries for all using (true);
create policy "anon_full_access" on lexicon for all using (true);
create policy "anon_full_access" on encounters for all using (true);
create policy "anon_full_access" on library for all using (true);
create policy "anon_full_access" on mastery for all using (true);
create policy "anon_full_access" on curiosities for all using (true);
create policy "anon_full_access" on canvas for all using (true);

-- ============================================================
-- STORAGE BUCKET for blobs (sketches, images)
-- ============================================================
-- Run this in Supabase dashboard or via supabase CLI:
--   supabase storage create ember-blobs --public
