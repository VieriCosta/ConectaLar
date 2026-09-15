-- Execute depois da migration inicial, no SQL Editor do Supabase.
-- Execute 20260828a_add_admin_role.sql antes deste arquivo.
-- O papel de administrador é atribuído exclusivamente no banco, nunca pelo navegador.

create or replace function public.create_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
    case when lower(new.email) = 'viericostayt@gmail.com' then 'admin'::public.user_role else 'renter'::public.user_role end
  );
  return new;
end;
$$;

-- Promove a conta já existente e garante que a role também fique nos app_metadata,
-- que são campos imutáveis pelo usuário autenticado.
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id and lower(u.email) = 'viericostayt@gmail.com';

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) = 'viericostayt@gmail.com';

-- Mantém as permissões de perfil: usuários podem editar apenas o próprio nome,
-- sem elevar o próprio papel.
create or replace function public.keep_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role then raise exception 'O papel da conta não pode ser alterado.'; end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles for each row execute procedure public.keep_profile_role();
