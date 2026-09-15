alter table public.interests
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined'));
alter table public.interests
  add column if not exists reviewed_at timestamptz;
create index if not exists interests_property_status_idx on public.interests(property_id, status);
