-- Campos de contacto/profissionais no perfil, usados no rodapé dos
-- receituários (e futuramente noutros documentos gerados).
--
-- Corre-se manualmente no SQL Editor do Supabase, depois da migração da
-- Fase 2 (já tem a tabela profiles).

begin;

alter table public.profiles add column titulo text not null default '';
alter table public.profiles add column registo_profissional text not null default '';
alter table public.profiles add column clinica text not null default '';
alter table public.profiles add column telefone text not null default '';
alter table public.profiles add column email_contato text not null default '';
alter table public.profiles add column site text not null default '';
alter table public.profiles add column redes_sociais text not null default '';

-- O backfill dos dados de contacto reais da Dra. Anna foi corrido à parte,
-- directamente no SQL Editor (não incluído aqui de propósito — este
-- repositório é público, e os dados de contacto pessoais não devem ficar
-- no histórico do Git). Podem ser preenchidos/editados a qualquer momento
-- em "Meu Perfil" dentro da app.

-- Permitir que o próprio utilizador actualize o seu perfil (display_name +
-- campos de contacto). O `role` nunca deve poder ser alterado por esta via
-- — só manualmente por SQL Editor (fora do contexto de uma sessão
-- autenticada), como já era o caso desde a Fase 2.

create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- só se aplica a updates feitos com uma sessão de utilizador autenticado
  -- (via app/PostgREST); updates directos no SQL Editor (sem JWT) passam.
  if auth.uid() is not null and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_self_change();

create policy "profiles: user can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

commit;
