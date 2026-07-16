-- Receituários
--
-- Corre-se manualmente no SQL Editor do Supabase, depois das migrações
-- da Fase 2 e dos campos de contacto do perfil.

begin;

create table public.receituarios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  data date not null default current_date,
  idade_no_receituario text,
  -- cada item: { uso, medicacao, distribuicao, apresentacao, acao,
  --   quantidade, formato, locais: [...], frequencia, duracao_tipo,
  --   duracao_texto, comentario }
  medicamentos jsonb not null default '[]'::jsonb,
  -- array de strings das opções fixas seleccionadas
  recomendacoes jsonb not null default '[]'::jsonb,
  comentarios_adicionais text,
  -- assinatura desenhada pelo médico no momento de gravar (PNG em base64,
  -- data URL) — capturada por receituário, nunca guardada como ficheiro
  -- estático no código/Git.
  assinatura_base64 text,
  status text not null default 'finalizado' check (status in ('rascunho', 'finalizado')),
  created_at timestamptz not null default now()
);

alter table public.receituarios enable row level security;

create policy "receituarios: owner or godmode full access" on public.receituarios for all
  using (owner_id = auth.uid() or public.is_godmode())
  with check (owner_id = auth.uid() or public.is_godmode());

commit;
