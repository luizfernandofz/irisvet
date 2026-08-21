-- Módulo Financeiro (Fase 1): moeda, valor do procedimento e valor de
-- deslocamento, preenchidos manualmente pela Dra. Anna na primeira página
-- da ficha. Aplica-se tanto a consultations como a follow_ups (retorno/
-- reavaliação, exame complementar, intervenção) — cada ficha corresponde a
-- um procedimento faturável, independentemente da tabela onde é guardada.
alter table consultations
  add column if not exists moeda text check (moeda in ('EUR', 'BRL')),
  add column if not exists valor numeric(10,2),
  add column if not exists deslocamento numeric(10,2);

alter table follow_ups
  add column if not exists moeda text check (moeda in ('EUR', 'BRL')),
  add column if not exists valor numeric(10,2),
  add column if not exists deslocamento numeric(10,2);
