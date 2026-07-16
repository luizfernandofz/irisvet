// Vercel serverless function — proxy para a API do DeepL.
// A chave fica só aqui no servidor (env var DEEPL_API_KEY), nunca é
// exposta ao browser.
import { translateTexts } from './_lib/deepl.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { texts, targetLang } = req.body || {}
  if (!Array.isArray(texts) || texts.length === 0) {
    res.status(400).json({ error: 'texts deve ser um array não vazio' })
    return
  }

  try {
    const translations = await translateTexts(texts, targetLang || 'EN-US')
    res.status(200).json({ translations })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
