-- Função auxiliar para permitir correr migrações futuras directamente
-- (via service_role key, nunca exposta ao browser) em vez de colar SQL
-- manualmente no SQL Editor a cada vez.
--
-- Só o service_role consegue chamar esta função — anon e authenticated
-- ficam explicitamente sem permissão, por isso não há risco de um
-- utilizador normal (ou um pedido autenticado comum da app) conseguir
-- executar SQL arbitrário através dela.

begin;

create or replace function public.exec_sql(sql text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute sql;
end;
$$;

revoke all on function public.exec_sql(text) from public, anon, authenticated;
grant execute on function public.exec_sql(text) to service_role;

commit;
