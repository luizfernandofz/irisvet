import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { translateLabel } from '../../src/lib/pdfTranslations.js'
import { configSimplificado } from '../../src/lib/tiposAtendimento.js'
import { translateTexts } from './deepl.js'
import { LOGO_PNG_BASE64 } from './logoBase64.js'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const COL_GAP = 14
const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2

// paleta alinhada com src/styles/design-tokens.css
const SAGE = rgb(0x5B / 255, 0x6E / 255, 0x58 / 255)
const INK = rgb(0x31 / 255, 0x2E / 255, 0x29 / 255)
const INK_MUTED = rgb(0x72 / 255, 0x6C / 255, 0x61 / 255)
const LINE = rgb(0xE7 / 255, 0xE2 / 255, 0xD7 / 255)
const BG = rgb(0xFA / 255, 0xF8 / 255, 0xF3 / 255)

const CAMPOS_LIVRES = ['motivo', 'avaliacao', 'diagnostico', 'tratamento', 'observacoes']

// As fontes Standard do PDF usam WinAnsi, que não cobre emoji nem alguns
// símbolos. Sanitiza para não rebentar o embedding com um erro opaco.
function winAnsi(text) {
  return String(text ?? '')
    .replace(/—|–/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    // mantem o \n (0x0A), que fica fora de \x20-\xFF mas e preciso para o
    // wrapText separar paragrafos — sem isto, texto com quebras de linha
    // (ex.: Avaliação/Observações com varios paragrafos) colava tudo numa
    // linha só.
    .replace(/[^\x20-\xFF\n]/g, '')
    .trim()
}

// O pdf-lib mede strings aplicando os pares de kerning da fonte, mas o
// drawText escreve o texto sem kerning — medir caractere a caractere devolve
// a largura real do que vai ser desenhado (ver fichaPdf.js para o contexto).
const cacheLarguras = new WeakMap()
function larguraTexto(font, texto, size) {
  let porFonte = cacheLarguras.get(font)
  if (!porFonte) { porFonte = new Map(); cacheLarguras.set(font, porFonte) }
  let total = 0
  for (const ch of String(texto)) {
    const chave = `${size}|${ch}`
    let w = porFonte.get(chave)
    if (w === undefined) {
      try { w = font.widthOfTextAtSize(ch, size) } catch { w = 0 }
      porFonte.set(chave, w)
    }
    total += w
  }
  return total
}

function wrapText(text, font, size, maxWidth) {
  const paragrafos = String(text ?? '').split('\n')
  const lines = []
  for (const par of paragrafos) {
    const words = par.split(/\s+/).filter(Boolean)
    if (words.length === 0) { lines.push(''); continue }
    let current = ''
    for (const word of words) {
      let pendente = word
      while (larguraTexto(font, pendente, size) > maxWidth) {
        if (current) { lines.push(current); current = '' }
        let corte = 1
        while (
          corte < pendente.length &&
          larguraTexto(font, pendente.slice(0, corte + 1), size) <= maxWidth
        ) corte++
        lines.push(pendente.slice(0, corte))
        pendente = pendente.slice(corte)
      }
      const test = current ? `${current} ${pendente}` : pendente
      if (larguraTexto(font, test, size) > maxWidth && current) {
        lines.push(current)
        current = pendente
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines.length > 0 ? lines : ['']
}

function formatarData(dataStr) {
  if (!dataStr) return ''
  const m = String(dataStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return String(dataStr)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${m[3]}/${meses[parseInt(m[2], 10) - 1]}/${m[1]}`
}

export function nomeArquivoReavaliacao(fu) {
  const sanitizar = s => winAnsi(s).replace(/[\\/:*?"<>|]/g, '').trim()
  const paciente = fu.patients || {}
  const tutor = paciente.tutors || {}
  const nomePaciente = sanitizar(paciente.nome) || 'Paciente'
  const primeiroTutor = sanitizar((tutor.nome || '').trim().split(/\s+/)[0]) || 'Tutor'
  const data = sanitizar(fu.data)
  return [nomePaciente, primeiroTutor, data].filter(Boolean).join('_')
}

export async function traduzirCampos(fu) {
  const chaves = CAMPOS_LIVRES.filter(k => fu[k] && String(fu[k]).trim())
  if (chaves.length === 0) return {}
  const traduzidos = await translateTexts(chaves.map(k => String(fu[k])), 'EN-US')
  return Object.fromEntries(chaves.map((k, i) => [k, traduzidos[i]]))
}

export async function generateReavaliacaoPdfBytes(fu, imagens = [], lang = 'pt', traduzidos = {}) {
  const paciente = fu.patients || {}
  const tutor = paciente.tutors || {}
  const config = configSimplificado(fu.tipo_atendimento)

  const L = (t) => winAnsi(translateLabel(lang, t))
  const V = (chave, original) => winAnsi(lang === 'en' ? (traduzidos[chave] ?? original) : original)

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const logoImg = await pdfDoc.embedPng(Buffer.from(LOGO_PNG_BASE64, 'base64'))

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function novaPagina() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
  }

  function garantirEspaco(altura) {
    if (y - altura < MARGIN) novaPagina()
  }

  function cabecalho() {
    const logoH = 34
    const logoW = (logoImg.width / logoImg.height) * logoH
    page.drawImage(logoImg, { x: MARGIN, y: y - logoH, width: logoW, height: logoH })
    const textoX = MARGIN + logoW + 12
    page.drawText(winAnsi('Dra. Anna Clara B. Hussein Zanuto'), {
      x: textoX, y: y - 15, size: 13, font: fontBold, color: SAGE,
    })
    page.drawText(winAnsi('OMV 10.122 · PT: +351 916720461 · annaoftalmovet.com.pt'), {
      x: textoX, y: y - 28, size: 8, font, color: INK_MUTED,
    })
    y -= logoH + 8
    page.drawLine({
      start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
      thickness: 1.5, color: SAGE,
    })
    y -= 16
  }

  function tituloSeccao(texto) {
    garantirEspaco(30)
    const h = 16
    page.drawRectangle({ x: MARGIN, y: y - h, width: CONTENT_WIDTH, height: h, color: LINE })
    page.drawText(L(texto).toUpperCase(), {
      x: MARGIN + 8, y: y - 11.5, size: 8, font: fontBold, color: SAGE,
    })
    y -= h + 10
  }

  function alturaCampo(valor, largura, label = 'x') {
    const linhas = wrapText(valor || '—', font, 9, largura - 16)
    return (label ? 12 : 0) + Math.max(1, linhas.length) * 11 + 8
  }

  function desenharCampo(label, valor, x, largura, topo) {
    const texto = valor || '—'
    const linhas = wrapText(texto, font, 9, largura - 16)
    const alturaCaixa = Math.max(1, linhas.length) * 11 + 8
    const alturaLabel = label ? 12 : 0
    if (label) {
      page.drawText(winAnsi(label).toUpperCase(), {
        x, y: topo - 8, size: 6.5, font: fontBold, color: INK_MUTED,
      })
    }
    const caixaTopo = topo - alturaLabel
    page.drawRectangle({
      x, y: caixaTopo - alturaCaixa, width: largura, height: alturaCaixa,
      color: BG, borderColor: LINE, borderWidth: 0.5,
    })
    linhas.forEach((linha, i) => {
      page.drawText(linha, {
        x: x + 8, y: caixaTopo - 12 - i * 11, size: 9,
        font, color: valor ? INK : INK_MUTED,
      })
    })
    return alturaLabel + alturaCaixa + 8
  }

  // Distribui campos em duas colunas, como o Grid2 da ficha. Campos marcados
  // com full: true ocupam a largura toda.
  function grelhaCampos(campos) {
    let i = 0
    while (i < campos.length) {
      const campo = campos[i]
      if (campo.full) {
        const h = alturaCampo(campo.valor, CONTENT_WIDTH)
        garantirEspaco(h)
        desenharCampo(campo.label, campo.valor, MARGIN, CONTENT_WIDTH, y)
        y -= h
        i += 1
        continue
      }
      const proximo = campos[i + 1]
      const par = proximo && !proximo.full ? proximo : null
      const h = Math.max(
        alturaCampo(campo.valor, COL_WIDTH),
        par ? alturaCampo(par.valor, COL_WIDTH) : 0
      )
      garantirEspaco(h)
      desenharCampo(campo.label, campo.valor, MARGIN, COL_WIDTH, y)
      if (par) desenharCampo(par.label, par.valor, MARGIN + COL_WIDTH + COL_GAP, COL_WIDTH, y)
      y -= h
      i += par ? 2 : 1
    }
  }

  // ---------- conteudo ----------

  cabecalho()

  tituloSeccao('Consulta')
  grelhaCampos([
    { label: L('Data'), valor: winAnsi(formatarData(fu.data)) },
    { label: L('Local / Clínica'), valor: winAnsi(fu.local) },
    { label: L('Tipo de atendimento'), valor: L(fu.tipo_atendimento), full: true },
  ])

  tituloSeccao('Paciente')
  grelhaCampos([
    { label: L('Nome do animal'), valor: winAnsi(paciente.nome) },
    { label: L('Raça'), valor: winAnsi(paciente.raca) },
    { label: L('Tutor'), valor: winAnsi(tutor.nome), full: true },
  ])

  tituloSeccao('Avaliação clínica')
  grelhaCampos([
    { label: L(config.labelMotivo), valor: V('motivo', fu.motivo), full: true },
    ...config.campos.map(({ campo, label }) => ({
      label: L(label), valor: V(campo, fu[campo]), full: true,
    })),
  ])

  // ---------- imagens ----------
  const porOlho = {
    OD: imagens.filter(i => i.olho === 'OD'),
    OE: imagens.filter(i => i.olho === 'OE'),
  }

  const embutidas = { OD: [], OE: [] }
  for (const olho of ['OD', 'OE']) {
    for (const img of porOlho[olho]) {
      if (!img.bytes) continue
      try {
        const embed = img.contentType?.includes('png')
          ? await pdfDoc.embedPng(img.bytes)
          : await pdfDoc.embedJpg(img.bytes)
        embutidas[olho].push(embed)
      } catch { /* formato nao suportado — ignora a imagem */ }
    }
  }

  if (embutidas.OD.length > 0 || embutidas.OE.length > 0) {
    const ALTURA_MAX_FOTO = 300

    function dimsFoto(im) {
      let w = COL_WIDTH
      let h = (im.height / im.width) * COL_WIDTH
      if (h > ALTURA_MAX_FOTO) {
        h = ALTURA_MAX_FOTO
        w = (im.width / im.height) * h
      }
      return { w, h }
    }

    function rotulosOlhos() {
      for (const [idx, label] of [[0, 'Olho Direito (OD)'], [1, 'Olho Esquerdo (OE)']]) {
        const texto = L(label)
        const largura = larguraTexto(fontBold, texto, 8)
        const centro = MARGIN + idx * (COL_WIDTH + COL_GAP) + COL_WIDTH / 2
        page.drawText(texto, { x: centro - largura / 2, y: y - 9, size: 8, font: fontBold, color: INK_MUTED })
      }
      y -= 18
    }

    const pares = []
    const maxFotos = Math.max(embutidas.OD.length, embutidas.OE.length)
    for (let i = 0; i < maxFotos; i++) {
      const par = [embutidas.OD[i], embutidas.OE[i]]
      const altura = Math.max(...par.map(im => (im ? dimsFoto(im).h : 0)), 0)
      if (altura > 0) pares.push({ par, altura })
    }

    garantirEspaco(26 + 18 + (pares[0]?.altura || 0))
    tituloSeccao('Imagens')
    rotulosOlhos()

    for (const { par, altura } of pares) {
      if (y - altura < MARGIN) {
        novaPagina()
        rotulosOlhos()
      }
      par.forEach((im, idx) => {
        if (!im) return
        const { w, h } = dimsFoto(im)
        const x = MARGIN + idx * (COL_WIDTH + COL_GAP) + (COL_WIDTH - w) / 2
        page.drawImage(im, { x, y: y - h, width: w, height: h })
        page.drawRectangle({
          x, y: y - h, width: w, height: h,
          borderColor: LINE, borderWidth: 0.5,
        })
      })
      y -= altura + 10
    }
  }

  // ---------- rodape com numeracao ----------
  const paginas = pdfDoc.getPages()
  paginas.forEach((p, i) => {
    const texto = `${i + 1} / ${paginas.length}`
    const largura = larguraTexto(font, texto, 7.5)
    p.drawText(texto, {
      x: PAGE_WIDTH - MARGIN - largura, y: MARGIN / 2,
      size: 7.5, font, color: INK_MUTED,
    })
  })

  return await pdfDoc.save()
}
