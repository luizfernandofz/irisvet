import { Resend } from 'resend'
import { supabaseFromRequest } from './_lib/supabaseFromRequest.js'
import { generateConsentPdfBytes } from './_lib/consentPdf.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { id, lang, to } = req.body || {}
  if (!id || !to) {
    res.status(400).json({ error: 'id e to são obrigatórios' })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'RESEND_API_KEY não configurada no servidor' })
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
    const resolvedLang = lang === 'en' ? 'en' : 'pt'
    const pdfBytes = await generateConsentPdfBytes(termo, resolvedLang)
    const nomePaciente = termo.patients?.nome || ''

    const assunto = resolvedLang === 'en'
      ? `Surgical Consent Form — ${nomePaciente}`
      : `Termo de Consentimento Cirúrgico — ${nomePaciente}`
    const corpo = resolvedLang === 'en'
      ? `<p>Hello,</p><p>Please find attached the surgical consent form for <strong>${nomePaciente}</strong>.</p><p>írisvet — Dra. Anna Clara B. Hussein Zanuto</p>`
      : `<p>Olá,</p><p>Segue em anexo o termo de consentimento cirúrgico de <strong>${nomePaciente}</strong>.</p><p>írisvet — Dra. Anna Clara B. Hussein Zanuto</p>`

    const resend = new Resend(apiKey)
    const { error: sendError } = await resend.emails.send({
      from: 'írisvet <onboarding@resend.dev>',
      to: [to],
      subject: assunto,
      html: corpo,
      attachments: [{
        filename: `termo-consentimento-${nomePaciente || id}.pdf`,
        content: Buffer.from(pdfBytes),
      }],
    })

    if (sendError) throw new Error(sendError.message || 'Falha ao enviar email')

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
