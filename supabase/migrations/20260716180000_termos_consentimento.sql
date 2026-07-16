-- Termos de Consentimento Cirúrgico
--
-- Corre-se manualmente no SQL Editor do Supabase, depois de confirmar
-- que a migração da Fase 2 (owner_id / profiles / is_godmode) já foi
-- aplicada — esta depende dessa.

begin;

create table public.consent_forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  data date not null default current_date,
  procedimento text,
  valor text,
  idade_no_termo text,
  observacoes text,
  status text not null default 'rascunho' check (status in ('rascunho', 'finalizado')),
  created_at timestamptz not null default now()
);

alter table public.consent_forms enable row level security;

create policy "consent_forms: owner or godmode full access" on public.consent_forms for all
  using (owner_id = auth.uid() or public.is_godmode())
  with check (owner_id = auth.uid() or public.is_godmode());

commit;
