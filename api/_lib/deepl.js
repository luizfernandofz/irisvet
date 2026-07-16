// Chamada directa à API do DeepL — usada tanto por api/translate.js (frontend)
// como pela geração de PDF de termos de consentimento.
export async function translateTexts(texts, targetLang = 'EN-US') {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) throw new Error('DEEPL_API_KEY não configurada no servidor')

  const host = apiKey.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com'
  const params = new URLSearchParams()
  texts.forEach(t => params.append('text', t))
  params.append('target_lang', targetLang)

  const res = await fetch(`https://${host}/v2/translate`, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.translations.map(t => t.text)
}
