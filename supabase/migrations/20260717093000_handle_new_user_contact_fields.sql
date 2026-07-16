-- Actualiza o trigger de signup para também gravar os novos campos de
-- contacto/profissionais vindos do formulário de registo.
-- Depende de 20260717090000_profile_contact_fields.sql já ter corrido
-- (as colunas têm de existir).

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, display_name, role,
    titulo, registo_profissional, clinica, telefone, email_contato, site, redes_sociais
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user',
    coalesce(new.raw_user_meta_data->>'titulo', ''),
    coalesce(new.raw_user_meta_data->>'registo_profissional', ''),
    coalesce(new.raw_user_meta_data->>'clinica', ''),
    coalesce(new.raw_user_meta_data->>'telefone', ''),
    coalesce(new.raw_user_meta_data->>'email_contato', ''),
    coalesce(new.raw_user_meta_data->>'site', ''),
    coalesce(new.raw_user_meta_data->>'redes_sociais', '')
  );
  return new;
end;
$$;

commit;
