export const MOEDAS = [
  { value: 'EUR', label: 'EUR (€)', simbolo: '€' },
  { value: 'BRL', label: 'BRL (R$)', simbolo: 'R$' },
]

export function simboloMoeda(moeda) {
  return MOEDAS.find(m => m.value === moeda)?.simbolo || ''
}

// Converte o valor de um <input type="number"> (string, possivelmente vazia)
// para número ou null, pronto a gravar numa coluna numeric.
export function paraNumero(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export function formatarValor(valor, moeda) {
  if (valor === null || valor === undefined || valor === '') return null
  const num = Number(valor)
  if (Number.isNaN(num)) return null
  const formatado = num.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const simbolo = simboloMoeda(moeda)
  return simbolo ? `${simbolo} ${formatado}` : formatado
}
