import { createClient } from '@supabase/supabase-js'

// Cria um cliente Supabase que actua como o utilizador autenticado que fez
// o pedido (via o access token do header Authorization) — assim o RLS
// aplica-se exactamente como se o pedido viesse do browser, sem precisar
// de service-role key.
export function supabaseFromRequest(req) {
  const authHeader = req.headers.authorization || ''
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    }
  )
}
