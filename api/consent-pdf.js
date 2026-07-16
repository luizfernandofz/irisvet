import { supabaseFromRequest } from './_lib/supabaseFromRequest.js'
import { generateConsentPdfBytes } from './_lib/consentPdf.js'

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

  const { data: termo, error } = await supabase
    .from('consent_forms')
    .select(`*, patients ( nome, especie, raca, genero, tutors ( nome, telefone, email, nif, morada ) )`)
    .eq('id', id)
    .single()

  if (error || !termo) {
    res.status(404).json({ error: 'Termo não encontrado' })
    return
  }

  try {
    const pdfBytes = await generateConsentPdfBytes(termo, lang === 'en' ? 'en' : 'pt')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="termo-consentimento-${id}.pdf"`)
    res.status(200).send(Buffer.from(pdfBytes))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
