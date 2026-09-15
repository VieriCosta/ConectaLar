-- Execute no SQL Editor do Supabase. Nunca exponha a service_role no frontend.
create type public.user_role as enum ('renter', 'owner');
create type public.property_status as enum ('active', 'paused');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 120),
  role public.user_role not null default 'renter',
  created_at timestamptz not null default now()
);
create table public.properties (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 10 and 140), type text not null, city text not null, neighborhood text not null,
  address text not null, price integer not null check (price > 0), bedrooms smallint not null check (bedrooms >= 0), bathrooms smallint not null check (bathrooms >= 0), parking_spaces smallint not null check (parking_spaces >= 0), area numeric not null check (area > 0), description text not null check (char_length(description) between 20 and 5000), accepts_pets boolean not null default false, furnished boolean not null default false, status public.property_status not null default 'active', created_at timestamptz not null default now()
);
create table public.interests (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade, renter_id uuid not null references public.profiles(id) on delete cascade, message text not null check (char_length(message) between 10 and 2000), created_at timestamptz not null default now(), unique(property_id, renter_id)
);
alter table public.profiles enable row level security; alter table public.properties enable row level security; alter table public.interests enable row level security;
create policy "profile owner read" on public.profiles for select using (auth.uid() = id);
create policy "profile owner update" on public.profiles for update using (auth.uid() = id);
create policy "active properties public read" on public.properties for select using (status = 'active' or owner_id = auth.uid());
create policy "owners create properties" on public.properties for insert with check (owner_id = auth.uid() and (select role from public.profiles where id = auth.uid()) = 'owner');
create policy "owners manage properties" on public.properties for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete properties" on public.properties for delete using (owner_id = auth.uid());
create policy "renters read own interests" on public.interests for select using (renter_id = auth.uid() or exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));
create policy "renters create interest" on public.interests for insert with check (renter_id = auth.uid());
create function public.create_profile() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, full_name, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'), coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'renter')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile();
