export const USO_OPCOES = ['Uso Oral', 'Uso Tópico', 'Uso Oftálmico']

export const DISTRIBUICAO_OPCOES = ['Farmácia Humana', 'Farmácia Veterinária', 'Farmácia de Manipulação']

export const APRESENTACAO_OPCOES = ['Frasco', 'Bisnaga', 'Caixa']

export const ACAO_OPCOES = ['Instile', 'Aplique', 'Administre']

export const FORMATO_OPCOES = ['Gota', 'Camada', 'Unidade']

export const LOCAIS_GRUPOS = [
  { grupo: 'OLHOS', opcoes: ['no Olho Direito', 'no Olho Esquerdo', 'em Ambos os Olhos'] },
  {
    grupo: 'PÁLPEBRAS',
    opcoes: [
      'na Pálpebra Superior Direita', 'na Pálpebra Superior Esquerda',
      'na Pálpebra Inferior Direita', 'na Pálpebra Inferior Esquerda',
      'em Ambas as Pálpebras',
    ],
  },
  { grupo: 'OUTROS', opcoes: ['sobre a Ferida Cirúrgica', 'sobre a Lesão', 'por Via Oral'] },
]

export const DURACAO_OPCOES = [
  { value: 'ate_novas_recomendacoes', label: 'até novas recomendações' },
  { value: 'uso_continuo', label: 'em uso contínuo' },
  { value: 'durante', label: 'durante' },
]

export const RECOMENDACOES_OPCOES = [
  'Aguarde 5 minutos de intervalo entre as aplicações',
  'Uso obrigatório do colar protetor durante todo o tratamento',
  'Realize a limpeza do local sempre que necessário',
  'Siga a ordem das medicações da receita',
]

export function novoMedicamento() {
  return {
    uso: '', medicacao: '', distribuicao: '', apresentacao: '',
    acao: '', quantidade: '', formato: '', locais: [],
    frequencia: '', duracao_tipo: '', duracao_texto: '', comentario: '',
  }
}

// Compõe a frase de posologia em linguagem natural, tal como aparece no
// receituário em papel (ex: "Instile um gota no olho direito 4x ao dia,
// até novas recomendações."), a partir dos campos estruturados.
export function composerFraseMedicamento(med) {
  const formato = (med.formato || '').toLowerCase()
  const locais = (med.locais || []).map(l => l.toLowerCase())
  let locaisTexto = ''
  if (locais.length === 1) locaisTexto = locais[0]
  else if (locais.length > 1) locaisTexto = locais.slice(0, -1).join(', ') + ' e ' + locais[locais.length - 1]

  let duracaoTexto = ''
  if (med.duracao_tipo === 'ate_novas_recomendacoes') duracaoTexto = 'até novas recomendações'
  else if (med.duracao_tipo === 'uso_continuo') duracaoTexto = 'em uso contínuo'
  else if (med.duracao_tipo === 'durante') duracaoTexto = `durante ${med.duracao_texto || ''}`.trim()

  const partes = [med.acao, med.quantidade, formato, locaisTexto].filter(Boolean).join(' ')
  const cauda = [med.frequencia, duracaoTexto].filter(Boolean).join(', ')

  const frase = `${partes}${cauda ? ' ' + cauda : ''}`.replace(/\s+/g, ' ').trim()
  return frase ? `${frase}.` : ''
}
