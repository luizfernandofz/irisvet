import { supabaseFromRequest } from './_lib/supabaseFromRequest.js'
import { generateReavaliacaoPdfBytes, nomeArquivoReavaliacao, traduzirCampos } from './_lib/reavaliacaoPdf.js'

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

  const { data: followUp, error } = await supabase
    .from('follow_ups')
    .select(`*, patients (nome, especie, raca, tutors (nome))`)
    .eq('id', id)
    .single()

  if (error || !followUp) {
    res.status(404).json({ error: 'Ficha não encontrada' })
    return
  }

  try {
    const { data: registos } = await supabase
      .from('images').select('*').eq('follow_up_id', id).order('ordem')

    // O pdf-lib precisa dos bytes: descarrega cada imagem do Storage com o
    // RLS do próprio utilizador. Pede a versão redimensionada, como em
    // ficha-pdf.js.
    const imagens = await Promise.all((registos || []).map(async img => {
      const bucket = supabase.storage.from('images')
      let { data: blob } = await bucket.download(img.storage_path, {
        transform: { width: 1400, quality: 78 },
      })
      if (!blob) ({ data: blob } = await bucket.download(img.storage_path))
      if (!blob) return { ...img, bytes: null }
      const bytes = Buffer.from(await blob.arrayBuffer())
      return { ...img, bytes, contentType: blob.type || '' }
    }))

    const idioma = lang === 'en' ? 'en' : 'pt'
    const traduzidos = idioma === 'en' ? await traduzirCampos(followUp) : {}
    const pdfBytes = await generateReavaliacaoPdfBytes(followUp, imagens, idioma, traduzidos)

    const nome = `${nomeArquivoReavaliacao(followUp)}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"; filename*=UTF-8''${encodeURIComponent(nome)}`)
    res.status(200).send(Buffer.from(pdfBytes))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
