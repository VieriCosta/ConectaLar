-- Contratos e avaliações fictícias para os imóveis de demonstração.
-- A conta informada pelo usuário atua como locatária/anunciante somente para dados de demo.
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
    or agreement.property_id <> new.property_id then
    raise exception 'Avaliações exigem um aluguel concluído e confirmado.';
  end if;
  if auth.uid() is not null and (
    agreement.renter_id <> auth.uid()
    or agreement.renter_id <> new.author_id
  ) then
    raise exception 'Somente o locatário pode avaliar este imóvel.';
  end if;
  return new;
end;
$$;

insert into public.rental_agreements (id, property_id, renter_id, owner_id, status, confirmed_at)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '3921a01f-0144-4bb8-a427-4b53709a3edb', '3921a01f-0144-4bb8-a427-4b53709a3edb', 'completed', now() - interval '120 days'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '3921a01f-0144-4bb8-a427-4b53709a3edb', '3921a01f-0144-4bb8-a427-4b53709a3edb', 'completed', now() - interval '90 days'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '3921a01f-0144-4bb8-a427-4b53709a3edb', '3921a01f-0144-4bb8-a427-4b53709a3edb', 'completed', now() - interval '60 days'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', '3921a01f-0144-4bb8-a427-4b53709a3edb', '3921a01f-0144-4bb8-a427-4b53709a3edb', 'completed', now() - interval '45 days')
on conflict (property_id, renter_id) do update set status = 'completed', confirmed_at = excluded.confirmed_at;

insert into public.property_reviews (rental_agreement_id, property_id, author_id, rating, comment)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '3921a01f-0144-4bb8-a427-4b53709a3edb', 5, 'Apartamento muito confortável, bem localizado e exatamente como no anúncio.'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '3921a01f-0144-4bb8-a427-4b53709a3edb', 4, 'A casa é espaçosa e o quintal fez muita diferença na rotina da família.'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '3921a01f-0144-4bb8-a427-4b53709a3edb', 5, 'Studio organizado, prático e em uma região excelente para morar.'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', '3921a01f-0144-4bb8-a427-4b53709a3edb', 4, 'Imóvel arejado, com boa varanda e espaços adequados para a família.')
on conflict (rental_agreement_id) do update set
  rating = excluded.rating, comment = excluded.comment;
