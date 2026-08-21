import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { translateLabel } from '../../src/lib/pdfTranslations.js'
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
const SAGE_LIGHT = rgb(0xE7 / 255, 0xEB / 255, 0xE5 / 255)

const REFLEXOS = [
  'Blefarospasmo', 'Ofuscamento', 'Resposta à Ameaça',
  'RPL Direto', 'RPL Consensual', 'RPL Vermelho', 'RPL Azul',
]
const TESTES = ['TLS (mm/min)', 'PIO (mmHg)', 'Corantes', 'Teste de Jones', 'Seidel']
const SEGMENTAR = [
  'Bulbo Ocular', 'Aparelho Lacrimal', 'Pálpebras', 'Conjuntiva e Esclera',
  'Córnea', 'Câmara Anterior', 'Íris e Pupila', 'Lente', 'Retina e Vítreo',
]
const SINAIS = [
  'Hiperemia', 'Secreção', 'Lacrimejamento', 'Blefarospasmo', 'Prurido',
  'Fotofobia', 'Sangramento', 'Neoformação', 'Bulbo ocular', 'Déficit visual',
  'Midríase/Miose',
]

// As fontes Standard do PDF usam WinAnsi, que não cobre emoji nem alguns
// símbolos. Sanitiza para não rebentar o embedding com um erro opaco.
function winAnsi(text) {
  return String(text ?? '')
    .replace(/—|–/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    // mantem apenas o que a codificacao WinAnsi consegue representar
    .replace(/[^\x20-\xFF]/g, '')
    .trim()
}

// O pdf-lib mede strings aplicando os pares de kerning da fonte, mas o
// drawText escreve o texto sem kerning — o que faz o texto renderizado ficar
// mais largo do que a medicao e transbordar as caixas. Medir caractere a
// caractere devolve a largura real do que vai ser desenhado.
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
      // Palavra unica maior que a coluna (ex.: identificadores ou texto
      // colado sem espacos) tem de ser partida a letra, senao transborda.
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

export function nomeArquivoFicha(consulta) {
  const sanitizar = s => winAnsi(s).replace(/[\\/:*?"<>|]/g, '').trim()
  const paciente = consulta.patients || {}
  const tutor = paciente.tutors || {}
  const nomePaciente = sanitizar(paciente.nome) || 'Paciente'
  const primeiroTutor = sanitizar((tutor.nome || '').trim().split(/\s+/)[0]) || 'Tutor'
  const data = sanitizar(consulta.data)
  return [nomePaciente, primeiroTutor, data].filter(Boolean).join('_')
}

// Reune os campos de texto livre da ficha, com as mesmas chaves que o V()
// usa ao desenhar — assim a traducao pode ser feita numa unica chamada.
export function camposTextoLivre(consulta) {
  const exame = consulta.exame_oftalmologico || {}
  const sinais = consulta.sinais || {}
  const flags = consulta.flags || {}
  const campos = {
    queixa_principal: consulta.queixa_principal,
    trat_ocular_previo: consulta.trat_ocular_previo,
    diag_ocular_previo: consulta.diag_ocular_previo,
    aspecto_geral: consulta.aspecto_geral,
    doencas_pre: consulta.doencas_pre,
    trat_sistemico: consulta.trat_sistemico,
    cirurgias: consulta.cirurgias,
    observacoes_historico: consulta.observacoes_historico,
    petisco_obs: flags.petisco,
    esterelizacao_obs: flags.esterelizacao_obs,
    vacinas_obs: flags.vacinas_obs,
    ectoparasitas_obs: flags.ectoparasitas_obs,
    exame_comentarios: exame.comentarios,
    diagnostico: consulta.diagnostico,
    tratamento: consulta.tratamento,
    observacoes: consulta.observacoes,
  }
  SINAIS.forEach(s => { campos[`sinal_obs_${s}`] = sinais[s]?.obs })
  REFLEXOS.forEach(r => { campos[`reflexo_obs_${r}`] = exame.reflexos?.[r]?.obs })
  TESTES.forEach(t => {
    campos[`testes_obs_${t}`] = exame.testes?.[t]?.obs
    campos[`testes_${t}_OD`] = exame.testes?.[t]?.OD
    campos[`testes_${t}_OE`] = exame.testes?.[t]?.OE
  })
  SEGMENTAR.forEach(s => {
    campos[`segmentar_obs_${s}`] = exame.segmentar?.[s]?.obs
    campos[`segmentar_${s}_OD`] = exame.segmentar?.[s]?.OD
    campos[`segmentar_${s}_OE`] = exame.segmentar?.[s]?.OE
  })
  return campos
}

export async function traduzirCampos(consulta) {
  const campos = camposTextoLivre(consulta)
  const chaves = Object.keys(campos).filter(k => campos[k] && String(campos[k]).trim())
  if (chaves.length === 0) return {}
  const traduzidos = await translateTexts(chaves.map(k => String(campos[k])), 'EN-US')
  return Object.fromEntries(chaves.map((k, i) => [k, traduzidos[i]]))
}

export async function generateFichaPdfBytes(consulta, imagens = [], lang = 'pt', traduzidos = {}) {
  const paciente = consulta.patients || {}
  const tutor = paciente.tutors || {}
  const exame = consulta.exame_oftalmologico || {}
  const sinais = consulta.sinais || {}
  const flags = consulta.flags || {}
  const alimentacao = Array.isArray(flags.alimentacao) ? flags.alimentacao : []

  const L = (t) => winAnsi(translateLabel(lang, t))
  // valor traduzido quando existir, senão o original
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

  // Um campo (label em cima, valor em caixa) desenhado numa posicao/largura
  // arbitraria — permite reproduzir o layout de duas colunas da ficha.
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
  // com full: true ocupam a largura toda (equivalente a gridColumn 1 / -1).
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

  function marcaVisto(x, centroY, marcado) {
    const lado = 9
    page.drawRectangle({
      x: x - lado / 2, y: centroY - lado / 2, width: lado, height: lado,
      color: marcado ? SAGE : rgb(1, 1, 1), borderColor: marcado ? SAGE : LINE, borderWidth: 0.8,
    })
    if (marcado) {
      page.drawText('X', {
        x: x - 3, y: centroY - 3.2, size: 7.5, font: fontBold, color: rgb(1, 1, 1),
      })
    }
  }

  // Tabela OD/OE com observacao. `linhas` sao os rotulos; `dados` o objecto da
  // seccao; `tipo` define se OD/OE sao checkbox (booleano) ou texto.
  function tabelaODOE(titulo, linhas, dadosSeccao, keyPrefix, tipo = 'check') {
    tituloSeccao(titulo)
    // As tabelas de texto (testes, segmentar) guardam frases em OD/OE, nao
    // apenas um visto — precisam de colunas bem mais largas.
    const colParam = tipo === 'check' ? 150 : 120
    const colOlho = tipo === 'check' ? 42 : 100
    const colObs = CONTENT_WIDTH - colParam - colOlho * 2

    function desenharCabecalho() {
      garantirEspaco(20)
      const h = 16
      page.drawRectangle({ x: MARGIN, y: y - h, width: CONTENT_WIDTH, height: h, color: SAGE_LIGHT })
      const cabs = [
        { t: tipo === 'check' ? 'Parâmetro' : 'Teste', x: MARGIN + 6, centro: false },
        { t: 'OD', x: MARGIN + colParam + colOlho / 2, centro: true },
        { t: 'OE', x: MARGIN + colParam + colOlho + colOlho / 2, centro: true },
        { t: 'Observação', x: MARGIN + colParam + colOlho * 2 + 6, centro: false },
      ]
      for (const c of cabs) {
        const texto = L(c.t)
        const largura = larguraTexto(fontBold, texto, 7.5)
        page.drawText(texto, {
          x: c.centro ? c.x - largura / 2 : c.x, y: y - 11,
          size: 7.5, font: fontBold, color: SAGE,
        })
      }
      y -= h
    }

    desenharCabecalho()

    linhas.forEach((rotulo, idx) => {
      const celula = dadosSeccao?.[rotulo] || {}
      const obs = V(`${keyPrefix}_obs_${rotulo}`, celula.obs) || ''
      const linhasObs = wrapText(obs, font, 8, colObs - 10)
      const linhasRotulo = wrapText(L(rotulo), font, 8, colParam - 10)

      let linhasOd = []
      let linhasOe = []
      if (tipo !== 'check') {
        linhasOd = wrapText(V(`${keyPrefix}_${rotulo}_OD`, celula.OD) || '—', font, 8, colOlho - 8)
        linhasOe = wrapText(V(`${keyPrefix}_${rotulo}_OE`, celula.OE) || '—', font, 8, colOlho - 8)
      }

      const maxLinhas = Math.max(
        linhasObs.length, linhasRotulo.length, linhasOd.length, linhasOe.length, 1
      )
      const alturaLinha = Math.max(15, maxLinhas * 10 + 6)

      if (y - alturaLinha < MARGIN) {
        novaPagina()
        desenharCabecalho()
      }

      if (idx % 2 === 0) {
        page.drawRectangle({ x: MARGIN, y: y - alturaLinha, width: CONTENT_WIDTH, height: alturaLinha, color: BG })
      }

      const centroY = y - alturaLinha / 2

      linhasRotulo.forEach((linha, i) => {
        page.drawText(linha, { x: MARGIN + 6, y: y - 11 - i * 10, size: 8, font, color: INK })
      })

      if (tipo === 'check') {
        marcaVisto(MARGIN + colParam + colOlho / 2, centroY, !!celula.OD)
        marcaVisto(MARGIN + colParam + colOlho + colOlho / 2, centroY, !!celula.OE)
      } else {
        const colunas = [
          { linhas: linhasOd, base: MARGIN + colParam },
          { linhas: linhasOe, base: MARGIN + colParam + colOlho },
        ]
        for (const col of colunas) {
          col.linhas.forEach((linha, i) => {
            const largura = larguraTexto(font, linha, 8)
            page.drawText(linha, {
              x: col.base + colOlho / 2 - largura / 2,
              y: y - 11 - i * 10, size: 8, font, color: INK,
            })
          })
        }
      }

      linhasObs.forEach((linha, i) => {
        page.drawText(linha, {
          x: MARGIN + colParam + colOlho * 2 + 6,
          y: y - 11 - i * 10, size: 8, font, color: INK_MUTED,
        })
      })

      page.drawLine({
        start: { x: MARGIN, y: y - alturaLinha }, end: { x: MARGIN + CONTENT_WIDTH, y: y - alturaLinha },
        thickness: 0.4, color: LINE,
      })
      y -= alturaLinha
    })

    y -= 12
  }

  // ---------- conteudo ----------

  cabecalho()

  tituloSeccao('Consulta')
  grelhaCampos([
    { label: L('Data'), valor: winAnsi(formatarData(consulta.data)) },
    { label: L('Local / Clínica'), valor: winAnsi(consulta.local) },
    { label: L('Tipo de atendimento'), valor: L(consulta.tipo_atendimento), full: true },
  ])

  tituloSeccao('Cliente (Tutor)')
  grelhaCampos([
    { label: L('Nome'), valor: winAnsi(tutor.nome) },
    { label: L('Telefone'), valor: winAnsi(tutor.telefone) },
    { label: L('NIF / CPF'), valor: winAnsi(tutor.nif) },
    { label: L('Email'), valor: winAnsi(tutor.email) },
    { label: L('Morada'), valor: winAnsi(tutor.morada), full: true },
  ])

  tituloSeccao('Paciente')
  grelhaCampos([
    { label: L('Nome do animal'), valor: winAnsi(paciente.nome) },
    { label: L('Espécie'), valor: L(paciente.especie) },
    { label: L('Raça'), valor: winAnsi(paciente.raca) },
    { label: L('Género'), valor: L(paciente.genero) },
    { label: L('Data de nascimento'), valor: winAnsi(formatarData(paciente.data_nascimento)), full: true },
  ])

  tituloSeccao('Queixa ocular principal')
  grelhaCampos([
    { label: L('Queixa'), valor: V('queixa_principal', consulta.queixa_principal), full: true },
  ])

  tabelaODOE('Sinais clínicos', SINAIS, sinais, 'sinal', 'check')

  tituloSeccao('Histórico ocular')
  grelhaCampos([
    { label: L('Tratamento ocular prévio'), valor: V('trat_ocular_previo', consulta.trat_ocular_previo) },
    { label: L('Diagnóstico ocular prévio'), valor: V('diag_ocular_previo', consulta.diag_ocular_previo) },
  ])

  tituloSeccao('Saúde geral')
  grelhaCampos([
    { label: L('Aspecto geral'), valor: V('aspecto_geral', consulta.aspecto_geral) },
    { label: L('Doenças pré-existentes'), valor: V('doencas_pre', consulta.doencas_pre) },
    { label: L('Tratamento sistémico'), valor: V('trat_sistemico', consulta.trat_sistemico) },
    { label: L('Cirurgias gerais'), valor: V('cirurgias', consulta.cirurgias) },
    { label: L('Observações'), valor: V('observacoes_historico', consulta.observacoes_historico), full: true },
  ])

  tituloSeccao('Alimentação')
  grelhaCampos([
    {
      label: L('Alimentação'),
      valor: alimentacao.length > 0 ? alimentacao.map(a => L(a)).join(', ') : '',
      full: true,
    },
    { label: L('Observações'), valor: V('petisco_obs', flags.petisco), full: true },
  ])

  tituloSeccao('Outros')
  for (const { campo, label } of [
    { campo: 'esterelizacao', label: 'Esterelização' },
    { campo: 'vacinas', label: 'Vacinas em dia' },
    { campo: 'ectoparasitas', label: 'Presença de Ectoparasitas' },
  ]) {
    const obs = V(`${campo}_obs`, flags[`${campo}_obs`])
    const alturaObs = alturaCampo(obs, CONTENT_WIDTH - 20, '')
    garantirEspaco(16 + alturaObs)
    marcaVisto(MARGIN + 5, y - 6, !!flags[campo])
    page.drawText(L(label), { x: MARGIN + 16, y: y - 9, size: 9, font: fontBold, color: INK })
    y -= 16
    desenharCampo('', obs, MARGIN + 20, CONTENT_WIDTH - 20, y)
    y -= alturaObs
  }
  y -= 6

  tabelaODOE('Reflexos e avaliação neuro-visual', REFLEXOS, exame.reflexos, 'reflexo', 'check')
  tabelaODOE('Testes Oftálmicos', TESTES, exame.testes, 'testes', 'texto')
  tabelaODOE('Avaliação Segmentar', SEGMENTAR, exame.segmentar, 'segmentar', 'texto')

  grelhaCampos([
    { label: L('Comentários'), valor: V('exame_comentarios', exame.comentarios), full: true },
  ])

  tituloSeccao('Diagnóstico e Tratamento')
  grelhaCampos([
    { label: L('Diagnóstico'), valor: V('diagnostico', consulta.diagnostico), full: true },
    { label: L('Tratamento / Receituário'), valor: V('tratamento', consulta.tratamento), full: true },
    { label: L('Observações e procedimentos realizados'), valor: V('observacoes', consulta.observacoes), full: true },
  ])

  // ---------- imagens ----------
  const porOlho = {
    OD: imagens.filter(i => i.olho === 'OD'),
    OE: imagens.filter(i => i.olho === 'OE'),
  }

  // Embute primeiro: se nenhuma imagem for utilizavel, nao se desenha
  // sequer o titulo da seccao (evita uma seccao vazia no fim do documento).
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
    // Limita a altura para caberem duas filas por pagina: sem isto uma foto
    // em retrato ocupa a folha toda e deixa a anterior praticamente vazia.
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

    // Só abre a seccao se couber o titulo, os rotulos e a primeira fila.
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
