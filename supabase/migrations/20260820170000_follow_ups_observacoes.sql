-- Campo de observações para follow_ups (retorno/reavaliação, exame
-- complementar, intervenção), reutilizado com rótulo diferente por tipo.
alter table follow_ups add column if not exists observacoes text;
