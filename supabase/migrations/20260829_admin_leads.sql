create table if not exists public.admin_leads (
  id uuid primary key default gen_random_uuid(), full_name text not null check (char_length(full_name) between 3 and 120), email text not null unique check (char_length(email) <= 254), phone text not null check (char_length(phone) between 8 and 30), property_name text not null check (char_length(property_name) between 3 and 160), location text not null check (char_length(location) between 3 and 160), monthly_budget integer not null check (monthly_budget > 0), status text not null default 'new' check (status in ('new', 'contacted', 'visit_scheduled')), created_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.profiles where id = auth.uid() and role::text = 'admin'); $$;
alter table public.admin_leads enable row level security;
drop policy if exists "admins read leads" on public.admin_leads;
create policy "admins read leads" on public.admin_leads for select using (public.is_admin());
insert into public.admin_leads (full_name, email, phone, property_name, location, monthly_budget, status, created_at) values
('Camila Rodrigues', 'camila.rodrigues@example.test', '(85) 98810-2457', 'Casa com quintal perto da praia', 'Praia do Futuro, Fortaleza', 3500, 'new', now() - interval '2 hours'),
('João Victor Lima', 'joao.lima@example.test', '(85) 99145-7732', 'Casa contemporânea em Eusébio', 'Guaribas, Eusébio', 4200, 'contacted', now() - interval '4 hours'),
('Mariana Alves', 'mariana.alves@example.test', '(85) 98722-1108', 'Apartamento familiar com varanda', 'Centro, Caucaia', 1900, 'new', now() - interval '1 day'),
('Rafael Nunes', 'rafael.nunes@example.test', '(85) 99603-6284', 'Apartamento iluminado no Meireles', 'Meireles, Fortaleza', 2800, 'visit_scheduled', now() - interval '1 day 3 hours'),
('Beatriz Costa', 'beatriz.costa@example.test', '(85) 98977-4391', 'Studio prático no Aldeota', 'Aldeota, Fortaleza', 1650, 'contacted', now() - interval '2 days')
on conflict (email) do update set full_name = excluded.full_name, phone = excluded.phone, property_name = excluded.property_name, location = excluded.location, monthly_budget = excluded.monthly_budget, status = excluded.status;
