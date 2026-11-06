-- ============================================================
-- Barangay Blotter Management System — Supabase Schema
-- Run this once in the Supabase SQL Editor on a fresh project.
-- Tables: profiles, blotter_records, audit_logs
-- Reconstructed from what the app code reads/writes.
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'Desk Officer' check (role in ('Brgy. Captain', 'Secretary', 'Desk Officer')),
  email text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  last_active timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- service_role bypasses RLS anyway; kept explicit for clarity.
create policy "Service role can manage all profiles"
  on public.profiles for all
  to service_role
  using (true);

-- 2. Blotter records
-- id is a bigint identity: the UI renders it as BLT-<year>-<id padded to 4>.
create table if not exists public.blotter_records (
  id bigint generated always as identity primary key,
  complainant_name text not null,
  complainant_age integer,
  complainant_gender text,
  respondent_name text,
  respondent_age integer,
  respondent_gender text,
  incident_type text not null,
  location text,
  narrative text,
  status text not null default 'Open' check (status in ('Open', 'Investigating', 'Resolved')),
  incident_date date,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blotter_records enable row level security;

create policy "Authenticated users can read blotter records"
  on public.blotter_records for select
  to authenticated
  using (true);

create policy "Authenticated users can insert blotter records"
  on public.blotter_records for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update blotter records"
  on public.blotter_records for update
  to authenticated
  using (true);

create policy "Authenticated users can delete blotter records"
  on public.blotter_records for delete
  to authenticated
  using (true);

-- Keep updated_at fresh (the dashboard uses updated_at - created_at
-- as the resolution time for Resolved records).
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_blotter_record_updated on public.blotter_records;
create trigger on_blotter_record_updated
  before update on public.blotter_records
  for each row execute procedure public.handle_updated_at();

-- 3. Audit logs (immutable: no update/delete policies)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  user_id text,
  user_name text not null default 'Unknown',
  action text not null check (action in (
    'Login', 'Logout', 'Failed Login', 'Password Reset',
    'Record Created', 'Record Edited', 'Record Deleted', 'Status Changed',
    'Data Exported', 'Report Generated', 'Settlement Generated', 'Summons Generated',
    'User Created', 'Access Revoked', 'Access Restored'
  )),
  details text,
  ip_address text default '0.0.0.0',
  status text not null default 'Success' check (status in ('Success', 'Warning', 'Failed'))
);

alter table public.audit_logs enable row level security;

create policy "Authenticated users can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (true);

create policy "Authenticated users can insert audit logs"
  on public.audit_logs for insert
  to authenticated
  with check (true);

-- 4. Indexes
create index if not exists idx_blotter_created_at on public.blotter_records(created_at);
create index if not exists idx_blotter_incident_type on public.blotter_records(incident_type);
create index if not exists idx_blotter_status on public.blotter_records(status);
create index if not exists idx_blotter_location on public.blotter_records(location);
create index if not exists idx_audit_logs_timestamp on public.audit_logs(timestamp desc);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
