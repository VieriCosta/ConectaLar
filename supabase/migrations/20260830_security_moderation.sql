-- Segurança, moderação e recursos de conta do ConectaLar.
-- Execute esta migration após as migrations anteriores.

alter type public.property_status add value if not exists 'pending';
alter type public.property_status add value if not exists 'removed';

alter table public.profiles
  add column if not exists phone text check (phone is null or char_length(phone) between 8 and 30),
  add column if not exists is_phone_verified boolean not null default false;

alter table public.properties
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists moderation_note text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute procedure public.set_updated_at();

create or replace function public.prevent_owner_status_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.owner_id and not public.is_admin() and new.status <> old.status then
    if not (
      (old.status = 'active' and new.status = 'paused')
      or (old.status = 'paused' and new.status = 'active')
    ) then
      raise exception 'A moderação é responsável por alterar este status.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_owner_status_escalation on public.properties;
create trigger prevent_owner_status_escalation
before update on public.properties
for each row execute procedure public.prevent_owner_status_escalation();

-- Novos anúncios aguardam revisão antes de serem públicos.
drop policy if exists "active properties public read" on public.properties;
create policy "active properties public read" on public.properties
for select using (status = 'active' or owner_id = auth.uid() or public.is_admin());

drop policy if exists "owners create properties" on public.properties;
create policy "owners create pending properties" on public.properties
for insert with check (
  owner_id = auth.uid()
  and status = 'pending'
  and (select role from public.profiles where id = auth.uid()) = 'owner'
);

drop policy if exists "owners manage properties" on public.properties;
create policy "owners manage own properties" on public.properties
for update using (owner_id = auth.uid())
with check (owner_id = auth.uid() and status in ('pending', 'active', 'paused'));

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
alter table public.favorites enable row level security;
create policy "users manage own favorites" on public.favorites
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  reason text not null check (reason in ('fraud', 'inaccurate_information', 'offensive_content', 'other')),
  details text not null check (char_length(details) between 10 and 1500),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "users create own reports" on public.reports
for insert with check (reporter_id = auth.uid());
create policy "users read own reports" on public.reports
for select using (reporter_id = auth.uid() or public.is_admin());
create policy "admins update reports" on public.reports
for update using (public.is_admin()) with check (public.is_admin());

-- Informações de contato ficam privadas: não há política pública para perfis.
-- Configure no painel do Supabase: confirmação de e-mail e proteção contra senhas vazadas.
