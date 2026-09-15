-- Avaliações somente podem ser criadas após a conclusão de uma locação.
create table if not exists public.rental_agreements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'cancelled')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (property_id, renter_id)
);

create table if not exists public.property_reviews (
  id uuid primary key default gen_random_uuid(),
  rental_agreement_id uuid not null unique references public.rental_agreements(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 10 and 800),
  created_at timestamptz not null default now()
);

create or replace function public.validate_property_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  agreement public.rental_agreements;
begin
  select * into agreement from public.rental_agreements where id = new.rental_agreement_id;
  if agreement.id is null
    or agreement.status <> 'completed'
    or agreement.renter_id <> auth.uid()
    or agreement.renter_id <> new.author_id
    or agreement.property_id <> new.property_id then
    raise exception 'Avaliações exigem um aluguel concluído e confirmado.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_property_review on public.property_reviews;
create trigger validate_property_review
before insert on public.property_reviews
for each row execute procedure public.validate_property_review();

alter table public.rental_agreements enable row level security;
alter table public.property_reviews enable row level security;

drop policy if exists "participants read rental agreements" on public.rental_agreements;
create policy "participants read rental agreements" on public.rental_agreements
for select using (renter_id = auth.uid() or owner_id = auth.uid() or public.is_admin());

drop policy if exists "public read property reviews" on public.property_reviews;
create policy "public read property reviews" on public.property_reviews
for select using (true);

drop policy if exists "completed renters create one review" on public.property_reviews;
create policy "completed renters create one review" on public.property_reviews
for insert with check (author_id = auth.uid());

create index if not exists property_reviews_property_id_created_at_idx
on public.property_reviews (property_id, created_at desc);
