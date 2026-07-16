// Cliente Supabase com a service_role key — ignora RLS por completo.
// Só para scripts locais de administração (migrações, testes, limpeza).
// NUNCA importar isto de src/ ou api/ — a chave nunca deve chegar ao
// browser nem a nenhuma função serverless pública.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

function loadEnv() {
  const env = Object.fromEntries(
    fs.readFileSync('.env.local', 'utf8').split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
  )
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY em falta em .env.local')
  }
  return env
}

export function getAdminClient() {
  const env = loadEnv()
  return createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Corre SQL arbitrário via a função exec_sql (criada pela migração
// 20260717130000_exec_sql_helper.sql). Lança erro se a função ainda não
// existir na base de dados.
export async function runSql(sql) {
  const supabase = getAdminClient()
  const { error } = await supabase.rpc('exec_sql', { sql })
  if (error) throw error
}

// Aplica um ficheiro de migração (lido do disco) directamente.
export async function runMigrationFile(path) {
  const sql = fs.readFileSync(path, 'utf8')
  await runSql(sql)
  console.log('Migração aplicada:', path)
}
