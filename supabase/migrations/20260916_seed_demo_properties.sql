-- Imóveis fictícios para demonstração no ConectaLar.
alter table public.properties
  add column if not exists condominium integer check (condominium is null or condominium >= 0),
  add column if not exists images text[] not null default '{}';

insert into public.properties (
  id, owner_id, title, type, city, neighborhood, address, price,
  bedrooms, bathrooms, parking_spaces, area, description, accepts_pets,
  furnished, status, condominium, images
) values
(
  '10000000-0000-4000-8000-000000000001', '3921a01f-0144-4bb8-a427-4b53709a3edb',
  'Apartamento iluminado no Meireles', 'Apartamento', 'Fortaleza', 'Meireles', 'Rua Silva Jatahy, 340', 2800,
  2, 2, 1, 72, 'Apartamento completo, bem iluminado e próximo a serviços, restaurantes e à orla.', true, true, 'active', 680,
  array['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80']
),
(
  '10000000-0000-4000-8000-000000000002', '3921a01f-0144-4bb8-a427-4b53709a3edb',
  'Casa com quintal perto da praia', 'Casa', 'Fortaleza', 'Praia do Futuro', 'Rua da Paz, 112', 3500,
  3, 3, 2, 145, 'Casa espaçosa com quintal, ambientes integrados e acesso rápido à praia.', true, false, 'active', null,
  array['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80']
),
(
  '10000000-0000-4000-8000-000000000003', '3921a01f-0144-4bb8-a427-4b53709a3edb',
  'Studio prático no Aldeota', 'Studio', 'Fortaleza', 'Aldeota', 'Av. Santos Dumont, 2090', 1650,
  1, 1, 0, 35, 'Studio mobiliado em localização central, ideal para uma rotina prática.', false, true, 'active', 320,
  array['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80','https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80']
),
(
  '10000000-0000-4000-8000-000000000004', '3921a01f-0144-4bb8-a427-4b53709a3edb',
  'Apartamento familiar com varanda', 'Apartamento', 'Caucaia', 'Centro', 'Rua Coronel Correia, 800', 1900,
  3, 2, 1, 89, 'Apartamento familiar com varanda, boa ventilação e espaços bem distribuídos.', true, false, 'active', 410,
  array['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80']
)
on conflict (id) do update set
  title = excluded.title, price = excluded.price, description = excluded.description,
  accepts_pets = excluded.accepts_pets, furnished = excluded.furnished,
  condominium = excluded.condominium, images = excluded.images;
