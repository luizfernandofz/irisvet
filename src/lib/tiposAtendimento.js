// Configuração partilhada dos formulários simplificados (follow_ups):
// Retorno/Reavaliação, Exame Complementar e Intervenção reutilizam a mesma
// estrutura de 3 passos (Dados/Clínico/Imagens) e as mesmas colunas da BD,
// mudando apenas os rótulos apresentados por tipo.

export const TIPOS_ATENDIMENTO = ['Consulta', 'Retorno/Reavaliação', 'Exame Complementar', 'Intervenção']

export const TIPOS_SIMPLIFICADOS = ['Retorno/Reavaliação', 'Exame Complementar', 'Intervenção']

const CONFIG_SIMPLIFICADO = {
  'Retorno/Reavaliação': {
    labelMotivo: 'Motivo da consulta',
    placeholderMotivo: 'Motivo do retorno...',
    campos: [
      { campo: 'avaliacao', label: 'Avaliação', placeholder: 'Avaliação clínica...' },
      { campo: 'diagnostico', label: 'Diagnóstico', placeholder: 'Diagnóstico actualizado...' },
      { campo: 'tratamento', label: 'Tratamento', placeholder: 'Plano terapêutico...' },
    ],
  },
  'Exame Complementar': {
    labelMotivo: 'Exame Complementar',
    placeholderMotivo: 'Descreva o exame complementar...',
    campos: [
      { campo: 'diagnostico', label: 'Diagnóstico', placeholder: 'Diagnóstico...' },
      { campo: 'tratamento', label: 'Tratamento', placeholder: 'Tratamento...' },
      { campo: 'observacoes', label: 'Observações', placeholder: 'Observações...' },
    ],
  },
  'Intervenção': {
    labelMotivo: 'Procedimento',
    placeholderMotivo: 'Descreva o procedimento...',
    campos: [
      { campo: 'diagnostico', label: 'Descrição', placeholder: 'Descrição do procedimento...' },
      { campo: 'tratamento', label: 'Tratamento', placeholder: 'Tratamento...' },
      { campo: 'observacoes', label: 'Observações', placeholder: 'Observações...' },
    ],
  },
}

export function configSimplificado(tipo) {
  return CONFIG_SIMPLIFICADO[tipo] || CONFIG_SIMPLIFICADO['Retorno/Reavaliação']
}
