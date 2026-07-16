import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { translateLabel } from '../../src/lib/pdfTranslations.js'
import { composerFraseMedicamento } from '../../src/lib/receituarioOptions.js'
import { translateTexts } from './deepl.js'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 50
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const PURPLE = rgb(83 / 255, 74 / 255, 183 / 255)
const GRAY = rgb(0.45, 0.45, 0.45)
const LIGHT_GRAY = rgb(0.94, 0.94, 0.97)
const BLACK = rgb(0.1, 0.1, 0.1)

function wrapText(text, font, size, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function formatarDataCurta(dataStr) {
  if (!dataStr) return '—'
  const [ano, mes, dia] = dataStr.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${dia}/${meses[parseInt(mes, 10) - 1]}/${ano}`
}

export async function generateReceituarioPdfBytes(rec, lang = 'pt') {
  const paciente = rec.patients || {}
  const tutor = paciente.tutors || {}
  const perfil = rec.profiles || {}
  const medicamentos = Array.isArray(rec.medicamentos) ? rec.medicamentos : []
  const recomendacoes = Array.isArray(rec.recomendacoes) ? rec.recomendacoes : []

  const L = (t) => translateLabel(lang, t)

  // compor frases PT primeiro; se EN, traduzir tudo em lote
  const frasesPt = medicamentos.map(m => composerFraseMedicamento(m))
  let medicacoesTraduzidas = medicamentos.map(m => m.medicacao || '')
  let frasesTraduzidas = frasesPt
  let comentariosMedTraduzidos = medicamentos.map(m => m.comentario || '')
  let comentariosAdicionais = rec.comentarios_adicionais || ''
  let idade = rec.idade_no_receituario || ''

  if (lang === 'en') {
    const textos = [...medicacoesTraduzidas, ...frasesPt, ...comentariosMedTraduzidos, comentariosAdicionais, idade]
    const entradas = textos.map((t, i) => ({ i, t })).filter(x => x.t && x.t.trim())
    if (entradas.length > 0) {
      const traduzidos = await translateTexts(entradas.map(e => e.t), 'EN-US')
      const resultado = [...textos]
      entradas.forEach((e, idx) => { resultado[e.i] = traduzidos[idx] })
      const n = medicamentos.length
      medicacoesTraduzidas = resultado.slice(0, n)
      frasesTraduzidas = resultado.slice(n, n * 2)
      comentariosMedTraduzidos = resultado.slice(n * 2, n * 3)
      comentariosAdicionais = resultado[n * 3]
      idade = resultado[n * 3 + 1]
    }
  }

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  let assinaturaImg = null
  if (rec.assinatura_base64) {
    try {
      const base64 = rec.assinatura_base64.split(',').pop()
      const bytes = Buffer.from(base64, 'base64')
      assinaturaImg = await pdfDoc.embedPng(bytes)
    } catch { /* assinatura inválida — ignora */ }
  }

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function newPageIfNeeded(minSpace) {
    if (y < MARGIN + minSpace) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  function drawText(text, { size = 10, bold = false, italic = false, color = BLACK, gap = 4, x = MARGIN } = {}) {
    newPageIfNeeded(size + gap)
    const f = bold ? fontBold : italic ? fontItalic : font
    page.drawText(text, { x, y: y - size, size, font: f, color })
    y -= size + gap
  }

  function drawParagraph(text, { size = 9.5, color = BLACK, gap = 10, x = MARGIN, width = CONTENT_WIDTH } = {}) {
    const lines = wrapText(text, font, size, width)
    for (const line of lines) {
      newPageIfNeeded(size + 2)
      page.drawText(line, { x, y: y - size, size, font, color })
      y -= size + 2
    }
    y -= gap
  }

  function drawSectionTitle(text) {
    newPageIfNeeded(28)
    y -= 4
    page.drawText(text.toUpperCase(), { x: MARGIN, y: y - 11, size: 10.5, font: fontBold, color: PURPLE })
    y -= 18
  }

  // linha compacta de campos lado a lado (label pequeno em cima, valor por
  // baixo) — quebra o valor até 2 linhas em vez de cortar texto se não
  // couber na largura da coluna.
  function drawFieldRow(colWidths, fields) {
    const valueSize = 9
    const linesPerField = fields.map((f, i) => {
      const maxW = colWidths[i] - 12
      return wrapText(f.value || '—', font, valueSize, maxW).slice(0, 2)
    })
    const maxLines = Math.max(...linesPerField.map(l => l.length))
    const rowHeight = 16 + maxLines * (valueSize + 2)
    newPageIfNeeded(rowHeight + 4)

    const rowTop = y
    page.drawRectangle({ x: MARGIN, y: rowTop - rowHeight, width: CONTENT_WIDTH, height: rowHeight, color: LIGHT_GRAY })
    let cx = MARGIN + 8
    fields.forEach((f, i) => {
      page.drawText(f.label.toUpperCase(), { x: cx, y: rowTop - 11, size: 6.5, font: fontBold, color: GRAY })
      linesPerField[i].forEach((line, li) => {
        page.drawText(line, { x: cx, y: rowTop - 24 - li * (valueSize + 2), size: valueSize, font, color: BLACK })
      })
      cx += colWidths[i]
    })
    page.drawLine({ start: { x: MARGIN, y: rowTop - rowHeight }, end: { x: MARGIN + CONTENT_WIDTH, y: rowTop - rowHeight }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
    y = rowTop - rowHeight - 12
  }

  // cabeçalho
  page.drawText('írisvet', { x: MARGIN, y: y - 20, size: 20, font: fontBold, color: PURPLE })
  y -= 26
  drawText(L('RECEITUÁRIO'), { size: 15, bold: true, gap: 14 })

  drawSectionTitle(L('Dados do Paciente'))
  drawFieldRow(
    [150, 83, 83, 83, 84],
    [
      { label: L('Nome do Paciente'), value: paciente.nome },
      { label: L('Idade'), value: idade },
      { label: L('Raça'), value: paciente.raca },
      { label: L('Espécie'), value: L(paciente.especie) },
      { label: L('Género'), value: L(paciente.genero) },
    ]
  )

  drawSectionTitle(L('Dados do Responsável'))
  drawFieldRow(
    [150, 110, 110, 113],
    [
      { label: L('Nome do Responsável'), value: tutor.nome },
      { label: 'NIF/CPF', value: tutor.nif },
      { label: L('Telefone'), value: tutor.telefone },
      { label: L('Email'), value: tutor.email },
    ]
  )

  y -= 6

  // medicações agrupadas por "uso"
  const gruposOrdem = []
  medicamentos.forEach(m => { if (m.uso && !gruposOrdem.includes(m.uso)) gruposOrdem.push(m.uso) })
  if (medicamentos.some(m => !m.uso)) gruposOrdem.push('')

  let contador = 0
  for (const grupo of gruposOrdem) {
    const itensDoGrupo = medicamentos
      .map((m, idx) => ({ m, idx }))
      .filter(({ m }) => (m.uso || '') === grupo)
    if (itensDoGrupo.length === 0) continue

    if (grupo) {
      newPageIfNeeded(24)
      drawText(L(grupo).toUpperCase(), { size: 10, bold: true, color: PURPLE, gap: 8 })
    }

    for (const { idx } of itensDoGrupo) {
      contador += 1
      const nomeMed = medicacoesTraduzidas[idx] || '(sem nome)'
      const distrib = L(medicamentos[idx].distribuicao)
      const apres = L(medicamentos[idx].apresentacao)
      const cabecalho = [nomeMed, distrib, apres].filter(Boolean).join(' — ')
      newPageIfNeeded(30)
      drawText(`${contador}) ${cabecalho}`, { size: 10, bold: true, gap: 3 })
      if (frasesTraduzidas[idx]) {
        drawParagraph(frasesTraduzidas[idx], { size: 9.5, gap: 4 })
      }
      if (comentariosMedTraduzidos[idx]) {
        drawParagraph(comentariosMedTraduzidos[idx], { size: 8.5, color: GRAY, gap: 8 })
      } else {
        y -= 4
      }
    }
  }

  if (recomendacoes.length > 0) {
    y -= 4
    drawSectionTitle(L('Recomendações'))
    for (const r of recomendacoes) {
      drawParagraph(`•  ${L(r)}`, { size: 8.5, color: GRAY, gap: 4 })
    }
    y -= 6
  }

  if (comentariosAdicionais && comentariosAdicionais.trim()) {
    drawSectionTitle(L('Comentários Adicionais'))
    drawParagraph(comentariosAdicionais, { size: 9.5, gap: 10 })
  }

  // assinatura
  newPageIfNeeded(120)
  y -= 10
  if (assinaturaImg) {
    const maxW = 160
    const scale = maxW / assinaturaImg.width
    const h = assinaturaImg.height * scale
    newPageIfNeeded(h + 10)
    page.drawImage(assinaturaImg, { x: MARGIN, y: y - h, width: maxW, height: h })
    y -= h + 4
  }
  if (perfil.display_name) {
    drawText(`${perfil.titulo ? perfil.titulo + ' ' : ''}${perfil.display_name}`.trim(), { size: 10, bold: true, gap: 2 })
  }
  if (perfil.registo_profissional) {
    drawText(perfil.registo_profissional, { size: 8.5, color: GRAY, gap: 2 })
  }

  // rodapé
  const footerY = MARGIN - 6
  page.drawLine({ start: { x: MARGIN, y: footerY + 24 }, end: { x: MARGIN + CONTENT_WIDTH, y: footerY + 24 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  const dataGeracao = formatarDataCurta(new Date().toISOString().split('T')[0])
  const linha1 = [perfil.clinica, perfil.telefone].filter(Boolean).join('   ·   ')
  const linha2 = [perfil.email_contato, perfil.site, perfil.redes_sociais].filter(Boolean).join('   ·   ')
  const footerSize = 7.5
  if (linha1) {
    const w = font.widthOfTextAtSize(linha1, footerSize)
    page.drawText(linha1, { x: (PAGE_WIDTH - w) / 2, y: footerY + 12, size: footerSize, font, color: GRAY })
  }
  if (linha2) {
    const w = font.widthOfTextAtSize(linha2, footerSize)
    page.drawText(linha2, { x: (PAGE_WIDTH - w) / 2, y: footerY + 2, size: footerSize, font, color: GRAY })
  }
  const dataLabel = `${L('Data')}: ${dataGeracao}`
  const dataWidth = font.widthOfTextAtSize(dataLabel, footerSize)
  page.drawText(dataLabel, { x: PAGE_WIDTH - MARGIN - dataWidth, y: footerY + 24 + 4, size: footerSize, font, color: GRAY })

  return pdfDoc.save()
}
