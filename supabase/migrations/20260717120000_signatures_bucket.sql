-- Bucket privado para a assinatura pré-definida de cada utilizador
-- (usada como alternativa a desenhar a assinatura de cada vez que se
-- gera um receituário). Nunca fica exposta publicamente — só o próprio
-- utilizador consegue ler/escrever o seu ficheiro.

begin;

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

create policy "signatures: owner can select own file" on storage.objects
  for select using (bucket_id = 'signatures' and owner_id = auth.uid()::text);

create policy "signatures: owner can insert own file" on storage.objects
  for insert with check (bucket_id = 'signatures' and owner_id = auth.uid()::text);

create policy "signatures: owner can update own file" on storage.objects
  for update using (bucket_id = 'signatures' and owner_id = auth.uid()::text)
  with check (bucket_id = 'signatures' and owner_id = auth.uid()::text);

create policy "signatures: owner can delete own file" on storage.objects
  for delete using (bucket_id = 'signatures' and owner_id = auth.uid()::text);

commit;
