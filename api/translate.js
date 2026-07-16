// Vercel serverless function — proxy para a API do DeepL.
// A chave fica só aqui no servidor (env var DEEPL_API_KEY), nunca é
// exposta ao browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'DEEPL_API_KEY não configurada no servidor' })
    return
  }

  const { texts, targetLang } = req.body || {}
  if (!Array.isArray(texts) || texts.length === 0) {
    res.status(400).json({ error: 'texts deve ser um array não vazio' })
    return
  }

  // chaves do plano gratuito terminam em ":fx" e usam o host api-free
  const host = apiKey.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com'

  try {
    const params = new URLSearchParams()
    texts.forEach(t => params.append('text', t))
    params.append('target_lang', targetLang || 'EN-US')

    const deeplRes = await fetch(`https://${host}/v2/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    if (!deeplRes.ok) {
      const errText = await deeplRes.text()
      res.status(deeplRes.status).json({ error: errText })
      return
    }

    const data = await deeplRes.json()
    res.status(200).json({ translations: data.translations.map(t => t.text) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
