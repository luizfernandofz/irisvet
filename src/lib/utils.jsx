export function formatarData(dataStr) {
  if (!dataStr) return '—'
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${meses[parseInt(mes) - 1]}/${ano}`
}

export function waitForImagesToLoad(root = document, timeoutMs = 4000) {
  const pendentes = Array.from(root.querySelectorAll('img'))
    .filter(img => !img.complete)
    .map(img => new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
    }))
  if (pendentes.length === 0) return Promise.resolve()
  return Promise.race([
    Promise.all(pendentes),
    new Promise(resolve => setTimeout(resolve, timeoutMs)),
  ])
}

export function calcularIdade(dataNasc) {
  if (!dataNasc) return ''
  const nasc = new Date(dataNasc)
  const hoje = new Date()
  let anos = hoje.getFullYear() - nasc.getFullYear()
  let meses = hoje.getMonth() - nasc.getMonth()
  if (meses < 0) { anos--; meses += 12 }
  if (hoje.getDate() < nasc.getDate()) meses--
  if (meses < 0) { anos--; meses += 12 }
  if (anos === 0 && meses === 0) return 'Menos de 1 mês'
  if (anos === 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  if (meses === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`
}