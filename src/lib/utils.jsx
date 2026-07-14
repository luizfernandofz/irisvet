export function formatarData(dataStr) {
  if (!dataStr) return '—'
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${meses[parseInt(mes) - 1]}/${ano}`
}