import { supabaseFromRequest } from './_lib/supabaseFromRequest.js'
import { generateFichaPdfBytes, nomeArquivoFicha, traduzirCampos } from './_lib/fichaPdf.js'

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

  const { data: consulta, error } = await supabase
    .from('consultations')
    .select(`*, patients (*, tutors (*))`)
    .eq('id', id)
    .single()

  if (error || !consulta) {
    res.status(404).json({ error: 'Ficha não encontrada' })
    return
  }

  try {
    const { data: registos } = await supabase
      .from('images').select('*').eq('consultation_id', id).order('ordem')

    // O pdf-lib precisa dos bytes: descarrega cada imagem do Storage com o
    // RLS do próprio utilizador (o header Authorization é reencaminhado).
    // Pede a versão redimensionada — a coluna do PDF tem ~250pt, portanto
    // 1400px já dá cerca de 400 DPI, e isto reduz o ficheiro ~6x (uma ficha
    // com 3 fotos passa de ~5,7 MB para ~1 MB), o que importa muito para
    // quem descarrega no telemóvel.
    const imagens = await Promise.all((registos || []).map(async img => {
      const bucket = supabase.storage.from('images')
      let { data: blob } = await bucket.download(img.storage_path, {
        transform: { width: 1400, quality: 78 },
      })
      // se a transformação não estiver disponível, usa o original
      if (!blob) ({ data: blob } = await bucket.download(img.storage_path))
      if (!blob) return { ...img, bytes: null }
      const bytes = Buffer.from(await blob.arrayBuffer())
      return { ...img, bytes, contentType: blob.type || '' }
    }))

    const idioma = lang === 'en' ? 'en' : 'pt'
    const traduzidos = idioma === 'en' ? await traduzirCampos(consulta) : {}
    const pdfBytes = await generateFichaPdfBytes(consulta, imagens, idioma, traduzidos)

    // O nome vai no cabeçalho HTTP — é o único ponto que todos os
    // navegadores respeitam (document.title é ignorado no Safari iOS).
    const nome = `${nomeArquivoFicha(consulta)}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"; filename*=UTF-8''${encodeURIComponent(nome)}`)
    res.status(200).send(Buffer.from(pdfBytes))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
