import { supabaseFromRequest } from './_lib/supabaseFromRequest.js'
import { generateReceituarioPdfBytes } from './_lib/receituarioPdf.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { id, lang } = req.query
  if (!id) {
    res.status(400).json({ error: 'id em falta' })
    return
  }

  const supabase = supabaseFromRequest(req)

  const { data: rec, error } = await supabase
    .from('receituarios')
    .select(`
      *,
      patients ( nome, especie, raca, genero, tutors ( nome, telefone, email, nif ) ),
      profiles ( display_name, titulo, registo_profissional, clinica, telefone, email_contato, site, redes_sociais )
    `)
    .eq('id', id)
    .single()

  if (error || !rec) {
    res.status(404).json({ error: 'Receituário não encontrado' })
    return
  }

  try {
    const pdfBytes = await generateReceituarioPdfBytes(rec, lang === 'en' ? 'en' : 'pt')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="receituario-${id}.pdf"`)
    res.status(200).send(Buffer.from(pdfBytes))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
