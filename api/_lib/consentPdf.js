import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { translateLabel } from '../../src/lib/pdfTranslations.js'
import { translateTexts } from './deepl.js'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 56
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const PURPLE = rgb(83 / 255, 74 / 255, 183 / 255)
const GRAY = rgb(0.4, 0.4, 0.4)
const BLACK = rgb(0.1, 0.1, 0.1)

const LEGAL_TEXT_PT = [
  'Autorizo a realização do(s) procedimento(s) acima descrito.',
  'Autorizo o profissional a examinar e/ou tratar e/ou proceder aos testes diagnósticos complementares que julgar necessários com base no exame clínico do animal e testes relacionados.',
  'Autorizo a aplicação de sedativos e/ou anestésicos necessários para proceder aos testes ou tratamentos, inclusive cirúrgicos, declarando que fui informado/a que estes testes e/ou tratamentos podem apresentar complicações, mesmo quando aplicados com perícia e prudência.',
  'Declaro que mantive o animal em jejum conforme orientado.',
  'Confirmo que após a saída do animal da clínica/consultório/hospital, na qualidade de proprietário/responsável, tomarei todos os cuidados necessários, observando o paciente e imediatamente comunicando ao médico veterinário quaisquer complicações ou acidentes que venham a ocorrer.',
  'Estou ciente que o pós-operatório é importante e na decorrência de falta de cuidados, erro na administração da medicação prescrita, não comparecimento aos retornos solicitados ou falta do uso do colar protetor em tempo integral também poderá haver complicações.',
  'Responsabilizo-me pelo pagamento dos serviços veterinários, medicamentos ou outros custos que possam ocorrer. Estes custos foram acima estimados, se não ocorrerem eventos imprevisíveis e/ou internação prolongada, onde pode ocorrer mudanças.',
  'Declaro que de maneira informada concordo com os procedimentos cirúrgicos a que o paciente será submetido, e que me foram claramente explicados pelo médico veterinário, inclusive fui esclarecido acerca dos possíveis riscos inerentes, durante ou após a realização do(s) citado(s) procedimentos(s), estando o referido profissional isento de quaisquer responsabilidades decorrentes de tais riscos.',
  'CONFIRMO QUE ESTOU CIENTE DE TODA A ETAPA PRÉ OPERATÓRIA, TRANS-OPERATÓRIA E PÓS OPERATÓRIA CONVERSADO COM O CIRURGIÃO E ANESTESISTA. E NÃO ME RESTA NENHUMA DÚVIDA SOBRE TODO O PROCEDIMENTO, CUSTOS E RISCOS.',
  'Confirmo que recebi explicações, li, compreendo e concordo com tudo que me foi esclarecido e que me foi concedida a oportunidade de anular ou questionar qualquer parágrafo ou palavras com as quais não concordasse. Assim tendo conhecimento, autorizo a realização do procedimento proposto.',
]

const LEGAL_TEXT_EN = [
  'I authorize the performance of the procedure(s) described above.',
  "I authorize the practitioner to examine and/or treat and/or carry out any complementary diagnostic tests deemed necessary based on the animal's clinical examination and related tests.",
  'I authorize the administration of sedatives and/or anesthetics necessary to carry out the tests or treatments, including surgical procedures, and declare that I have been informed that these tests and/or treatments may present complications, even when performed with skill and care.',
  'I declare that I kept the animal fasting as instructed.',
  'I confirm that after the animal leaves the clinic/office/hospital, as the owner/responsible party, I will take all necessary care, monitor the patient, and immediately inform the veterinarian of any complications or accidents that may occur.',
  'I am aware that post-operative care is important, and that lack of care, errors in administering prescribed medication, failure to attend requested follow-up visits, or failure to keep the protective collar on at all times may also result in complications.',
  'I am responsible for payment of the veterinary services, medications, or other costs that may arise. These costs have been estimated above and may change if unforeseeable events occur and/or prolonged hospitalization is required.',
  'I declare that I have been informed of and agree to the surgical procedures to which the patient will be submitted, that they have been clearly explained to me by the veterinarian, and that I have been advised of the possible inherent risks during or after the performance of the aforementioned procedure(s), releasing the veterinarian from any liability arising from such risks.',
  'I CONFIRM THAT I AM AWARE OF THE ENTIRE PRE-OPERATIVE, INTRA-OPERATIVE AND POST-OPERATIVE PROCESS, HAVING DISCUSSED IT WITH THE SURGEON AND ANESTHESIOLOGIST, AND THAT I HAVE NO REMAINING DOUBTS ABOUT THE PROCEDURE, COSTS, OR RISKS.',
  'I confirm that I have received explanations, have read, understood, and agree with everything that has been clarified to me, and that I was given the opportunity to challenge or question any paragraph or wording with which I did not agree. Having this knowledge, I authorize the performance of the proposed procedure.',
]

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

function formatarDataExtenso(dataStr) {
  if (!dataStr) return '—'
  const [ano, mes, dia] = dataStr.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${dia}/${meses[parseInt(mes, 10) - 1]}/${ano}`
}

export async function generateConsentPdfBytes(termo, lang = 'pt') {
  const paciente = termo.patients || {}
  const tutor = paciente.tutors || {}

  let procedimento = termo.procedimento || ''
  let observacoes = termo.observacoes || ''

  if (lang === 'en') {
    const toTranslate = [procedimento, observacoes].filter(t => t && t.trim())
    if (toTranslate.length > 0) {
      const translated = await translateTexts(toTranslate, 'EN-US')
      let i = 0
      if (procedimento && procedimento.trim()) procedimento = translated[i++]
      if (observacoes && observacoes.trim()) observacoes = translated[i++]
    }
  }

  const L = (t) => translateLabel(lang, t)

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function newPageIfNeeded(minSpace) {
    if (y < MARGIN + minSpace) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  function drawText(text, { size = 10, bold = false, color = BLACK, gap = 4, x = MARGIN } = {}) {
    newPageIfNeeded(size + gap)
    page.drawText(text, { x, y: y - size, size, font: bold ? fontBold : font, color })
    y -= size + gap
  }

  function drawParagraph(text, { size = 9.5, color = BLACK, gap = 10 } = {}) {
    const lines = wrapText(text, font, size, CONTENT_WIDTH)
    for (const line of lines) {
      newPageIfNeeded(size + 2)
      page.drawText(line, { x: MARGIN, y: y - size, size, font, color })
      y -= size + 2
    }
    y -= gap
  }

  function drawField(label, value) {
    newPageIfNeeded(14)
    const labelText = `${label}: `
    page.drawText(labelText, { x: MARGIN, y: y - 10, size: 10, font: fontBold, color: PURPLE })
    const labelWidth = fontBold.widthOfTextAtSize(labelText, 10)
    page.drawText(value || '—', { x: MARGIN + labelWidth, y: y - 10, size: 10, font, color: BLACK })
    y -= 16
  }

  function drawSectionTitle(text) {
    newPageIfNeeded(28)
    y -= 6
    page.drawText(text.toUpperCase(), { x: MARGIN, y: y - 12, size: 11, font: fontBold, color: PURPLE })
    y -= 20
  }

  // Cabeçalho
  page.drawText('írisvet', { x: MARGIN, y: y - 22, size: 22, font: fontBold, color: PURPLE })
  y -= 30
  drawText('Dra. Anna Clara B. Hussein Zanuto · OMV 10.122 · annaoftalmovet.com.pt', { size: 9, color: GRAY, gap: 16 })

  drawText(L('TERMO DE CONSENTIMENTO CIRÚRGICO'), { size: 16, bold: true, gap: 4 })
  drawText('IrisVet - Oftalmologia Veterinária', { size: 10, color: GRAY, gap: 20 })

  drawSectionTitle(L('Dados da Clínica e Cirurgião'))
  drawField(L('Veterinário'), 'Anna Clara Barros Hussein')
  drawField(L('Clínica'), 'IrisVet - Oftalmologia Veterinária')
  drawField('CRMV', '36217')
  drawField(L('Endereço'), 'Zona Sul, São Paulo-SP')
  y -= 8

  drawSectionTitle(L('Dados do Cliente'))
  drawField(L('Nome'), tutor.nome)
  drawField(L('Endereço'), tutor.morada)
  drawField(L('Telefone'), tutor.telefone)
  drawField(L('Email'), tutor.email)
  drawField('CPF', tutor.nif)
  y -= 8

  drawSectionTitle(L('Dados do Paciente'))
  drawField(L('Paciente'), paciente.nome)
  drawField(L('Espécie'), L(paciente.especie))
  drawField(L('Raça'), paciente.raca)
  drawField(L('Género'), L(paciente.genero))
  drawField(L('Idade'), termo.idade_no_termo)
  y -= 8

  drawSectionTitle(L('Dados da Cirurgia'))
  drawField(L('Data'), formatarDataExtenso(termo.data))
  drawField(L('Procedimento'), procedimento)
  drawField(L('Valor'), termo.valor)
  y -= 16

  drawText(L('Termo de Autorização para Procedimento Cirúrgico, Anestésico e Exames'), { size: 13, bold: true, gap: 16 })

  const legalText = lang === 'en' ? LEGAL_TEXT_EN : LEGAL_TEXT_PT
  for (const paragraph of legalText) {
    drawParagraph(paragraph)
  }

  if (observacoes && observacoes.trim()) {
    drawText(`${L('Observações')}:`, { size: 10, bold: true, gap: 4 })
    drawParagraph(observacoes, { gap: 16 })
  }

  newPageIfNeeded(80)
  y -= 30
  page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 240, y }, thickness: 0.5, color: GRAY })
  y -= 12
  drawText(L('Assinatura do Responsável'), { size: 9, color: GRAY, gap: 0 })

  return pdfDoc.save()
}
