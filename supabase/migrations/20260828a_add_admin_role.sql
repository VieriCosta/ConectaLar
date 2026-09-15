-- Execute esta consulta primeiro e aguarde o sucesso antes das demais migrations.
alter type public.user_role add value if not exists 'admin';
