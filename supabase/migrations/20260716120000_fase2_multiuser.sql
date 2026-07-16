-- Fase 2 — Multi-utilizador (GodMode + contas de vet/staff)
--
-- Este ficheiro corre-se manualmente no SQL Editor do Supabase (produção,
-- não há staging). Corre secção a secção, NA ORDEM.
--
-- Reconhecimento (secção 0) já foi feito. Resultados:
--   - Única conta existente: 39ca790c-a24d-4be3-b03d-edf0781736a4
--     (luizfernandofz@gmail.com — conta da Dra. Anna)
--   - RLS já estava ATIVO nas 5 tabelas de domínio, mas com políticas
--     "ALL, true, true" (Utilizador autenticado — X) que abrem tudo.
--   - Bucket 'images' do Storage já tinha 3 políticas abertas para
--     qualquer autenticado: "Upload autenticado" (INSERT),
--     "Leitura autenticada" (SELECT), "Delete autenticado" (DELETE).
--   - storage.objects tem AMBAS as colunas `owner` (uuid) e `owner_id`
--     (text) preenchidas de forma idêntica — a usar `owner_id` (text),
--     que é a recomendada nas versões recentes do Supabase Storage.
--
-- Todas as políticas antigas acima são explicitamente apagadas antes de
-- criar as novas, para não ficarem a somar-se por OR e reabrir o acesso.

-- =====================================================================
-- SECÇÃO 0 — RECONHECIMENTO (já corrido — mantido aqui só como histórico)
-- =====================================================================

-- select id, email, created_at from auth.users order by created_at;
-- select relname, relrowsecurity from pg_class
-- where relname in ('tutors','patients','consultations','follow_ups','images');
-- select schemaname, tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where tablename in ('tutors','patients','consultations','follow_ups','images');
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects';
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'storage' and table_name = 'objects'
--   and column_name in ('owner', 'owner_id');


-- A partir daqui corre tudo dentro de UMA transação: se algo falhar a
-- meio (ex: nome de política não bate certo), a base de dados volta
-- exactamente ao estado anterior — nada fica aplicado parcialmente.
begin;

-- =====================================================================
-- SECÇÃO 1 — profiles, is_godmode(), trigger de signup
-- =====================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'user' check (role in ('user', 'godmode')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_godmode()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'godmode'
  );
$$;

grant execute on function public.is_godmode() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles: user can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: godmode can read all profiles"
  on public.profiles for select
  using (public.is_godmode());
-- Sem política de insert/update/delete para o role `authenticated` —
-- o trigger (security definer) é o único a escrever aqui, de propósito.


-- =====================================================================
-- SECÇÃO 2 — promover a Dra. Anna a godmode
-- =====================================================================

insert into public.profiles (id, display_name, role)
values ('39ca790c-a24d-4be3-b03d-edf0781736a4', 'Dra. Anna Clara', 'godmode')
on conflict (id) do update set role = 'godmode';


-- =====================================================================
-- SECÇÃO 3 — owner_id nas 5 tabelas de domínio
-- =====================================================================
-- Ordem importa: adicionar nullable → backfill → NOT NULL → DEFAULT.
-- (auth.uid() é NULL quando corrido no SQL Editor sem sessão de
-- utilizador, por isso não dá para pôr o DEFAULT antes do backfill.)

alter table public.tutors        add column owner_id uuid references public.profiles(id) on delete restrict;
alter table public.patients      add column owner_id uuid references public.profiles(id) on delete restrict;
alter table public.consultations add column owner_id uuid references public.profiles(id) on delete restrict;
alter table public.follow_ups    add column owner_id uuid references public.profiles(id) on delete restrict;
alter table public.images        add column owner_id uuid references public.profiles(id) on delete restrict;

update public.tutors        set owner_id = '39ca790c-a24d-4be3-b03d-edf0781736a4' where owner_id is null;
update public.patients      set owner_id = '39ca790c-a24d-4be3-b03d-edf0781736a4' where owner_id is null;
update public.consultations set owner_id = '39ca790c-a24d-4be3-b03d-edf0781736a4' where owner_id is null;
update public.follow_ups    set owner_id = '39ca790c-a24d-4be3-b03d-edf0781736a4' where owner_id is null;
update public.images        set owner_id = '39ca790c-a24d-4be3-b03d-edf0781736a4' where owner_id is null;

alter table public.tutors        alter column owner_id set not null;
alter table public.patients      alter column owner_id set not null;
alter table public.consultations alter column owner_id set not null;
alter table public.follow_ups    alter column owner_id set not null;
alter table public.images        alter column owner_id set not null;

alter table public.tutors        alter column owner_id set default auth.uid();
alter table public.patients      alter column owner_id set default auth.uid();
alter table public.consultations alter column owner_id set default auth.uid();
alter table public.follow_ups    alter column owner_id set default auth.uid();
alter table public.images        alter column owner_id set default auth.uid();


-- =====================================================================
-- SECÇÃO 4 — RLS nas 5 tabelas de domínio
-- =====================================================================
-- RLS já estava ativo, mas com as políticas abertas abaixo — apagar
-- antes de criar as novas, scoped por owner_id.

drop policy "Utilizador autenticado — tutors" on public.tutors;
drop policy "Utilizador autenticado — patients" on public.patients;
drop policy "Utilizador autenticado — consultations" on public.consultations;
drop policy "Utilizador autenticado — follow_ups" on public.follow_ups;
drop policy "Utilizador autenticado — images" on public.images;

alter table public.tutors        enable row level security;
alter table public.patients      enable row level security;
alter table public.consultations enable row level security;
alter table public.follow_ups    enable row level security;
alter table public.images        enable row level security;

create policy "tutors: owner or godmode full access" on public.tutors for all
  using (owner_id = auth.uid() or public.is_godmode())
  with check (owner_id = auth.uid() or public.is_godmode());

create policy "patients: owner or godmode full access" on public.patients for all
  using (owner_id = auth.uid() or public.is_godmode())
  with check (owner_id = auth.uid() or public.is_godmode());

create policy "consultations: owner or godmode full access" on public.consultations for all
  using (owner_id = auth.uid() or public.is_godmode())
  with check (owner_id = auth.uid() or public.is_godmode());

create policy "follow_ups: owner or godmode full access" on public.follow_ups for all
  using (owner_id = auth.uid() or public.is_godmode())
  with check (owner_id = auth.uid() or public.is_godmode());

create policy "images: owner or godmode full access" on public.images for all
  using (owner_id = auth.uid() or public.is_godmode())
  with check (owner_id = auth.uid() or public.is_godmode());


-- =====================================================================
-- SECÇÃO 5 — storage.objects policies para o bucket 'images'
-- =====================================================================
-- Apagar as 3 políticas abertas encontradas no reconhecimento antes de
-- criar as novas, scoped por owner_id.

drop policy "Upload autenticado" on storage.objects;
drop policy "Leitura autenticada" on storage.objects;
drop policy "Delete autenticado" on storage.objects;

create policy "images bucket: owner or godmode select" on storage.objects
  for select using (bucket_id = 'images' and (owner_id = auth.uid()::text or public.is_godmode()));

create policy "images bucket: owner insert" on storage.objects
  for insert with check (bucket_id = 'images' and owner_id = auth.uid()::text);

create policy "images bucket: owner or godmode delete" on storage.objects
  for delete using (bucket_id = 'images' and (owner_id = auth.uid()::text or public.is_godmode()));

-- Sem política de UPDATE — mantém o comportamento atual (upsert
-- bloqueado, a app já faz insert-new + delete-old).

commit;
