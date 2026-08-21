import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarData, waitForImagesToLoad } from '../lib/utils'
import Header from '../components/Header'
import { translateLabel, translateFreeTextFields } from '../lib/pdfTranslations'
import { configSimplificado } from '../lib/tiposAtendimento'

function nomeArquivoReavaliacao(dados) {
  const sanitizar = s => (s || '').replace(/[\\/:*?"<>|]/g, '').trim()
  const paciente = dados.patients || {}
  const tutor = paciente.tutors || {}
  const nomePaciente = sanitizar(paciente.nome) || 'Paciente'
  const primeiroNomeTutor = sanitizar((tutor.nome || '').trim().split(/\s+/)[0]) || 'Tutor'
  const data = sanitizar(dados.data)
  return [nomePaciente, primeiroNomeTutor, data].filter(Boolean).join('_')
}

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { background: white !important; margin: 0; padding: 0; }
  .ver-root { background: white !important; padding: 8px !important; }
  .ver-inner { max-width: 100% !important; }
  .ver-card { box-shadow: none !important; border-radius: 4px !important; margin-bottom: 8px !important; padding: 16px !important; border: 0.5px solid var(--iv-line) !important; }
  /* Os cards podem partir entre paginas; proteger so as unidades pequenas,
     senao um card grande e empurrado inteiro e deixa a pagina anterior vazia. */
  tr, .print-keep { page-break-inside: avoid; break-inside: avoid; }
  thead { display: table-header-group; }
  h1, h2, h3, .print-titulo { page-break-after: avoid; break-after: avoid; }
  img { page-break-inside: avoid; max-width: 100%; }
  .print-stack { display: block !important; }
  .print-stack > * { margin-bottom: 10px; }
  .print-cols-2 { display: block !important; }
  .print-cols-2::after { content: ''; display: table; clear: both; }
  .print-cols-2 > * { float: left !important; width: 48% !important; box-sizing: border-box; }
  .print-cols-2 > *:first-child { margin-right: 4%; }
}
`

function Card({ children }) {
  return (
    <div className="ver-card" style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: '32px', boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function SeccaoTitulo({ children }) {
  return (
    <div className="print-titulo" style={{ fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)', textTransform: 'uppercase', letterSpacing: 1, background: 'var(--iv-line)', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div className="print-keep" style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }}>{label}</label>
      <div style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--iv-line)', fontSize: 14, boxSizing: 'border-box', background: 'var(--iv-bg)', color: valor ? 'var(--iv-ink)' : 'var(--iv-line)', whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word', minHeight: 40 }}>
        {valor || '—'}
      </div>
    </div>
  )
}

function Grid2({ children }) {
  return <div className="print-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

const btnNav = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)',
  background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer'
}

export default function VerReavaliacao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [imagens, setImagens] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('pt')
  const [translated, setTranslated] = useState({})
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState(null)
  const [printRequested, setPrintRequested] = useState(false)

  useEffect(() => {
    function handleAfterPrint() { setLang('pt') }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
      document.title = 'irisvet'
    }
  }, [])

  useEffect(() => {
    if (!printRequested) return
    let cancelado = false
    waitForImagesToLoad()
      .then(() => new Promise(resolve => setTimeout(resolve, 60)))
      .then(() => {
        if (cancelado) return
        window.print()
        setPrintRequested(false)
      })
    return () => { cancelado = true }
  }, [printRequested])

  useEffect(() => {
    if (dados) document.title = nomeArquivoReavaliacao(dados)
  }, [dados])

  useEffect(() => {
    async function fetchDados() {
      const { data: fu, error } = await supabase
        .from('follow_ups')
        .select(`*, patients (nome, especie, raca, tutors (nome))`)
        .eq('id', id)
        .single()

      if (error) { console.error(error); setLoading(false); return }

      const { data: imgs } = await supabase
        .from('images').select('*').eq('follow_up_id', id).order('ordem')

      const imagensComUrl = await Promise.all((imgs || []).map(async img => {
        const { data, error } = await supabase.storage
          .from('images').createSignedUrl(img.storage_path, 60 * 60 * 24)
        return { ...img, preview: error ? '' : data.signedUrl }
      }))

      setDados(fu)
      setImagens(imagensComUrl)
      setLoading(false)
    }
    fetchDados()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--iv-bg)' }}>
      <div style={{ fontSize: 14, color: 'var(--iv-ink-muted)' }}>A carregar...</div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--iv-bg)' }}>
      <div style={{ fontSize: 14, color: 'var(--iv-ink-muted)' }}>Ficha não encontrada.</div>
    </div>
  )

  const paciente = dados.patients || {}
  const tutor = paciente.tutors || {}
  const config = configSimplificado(dados.tipo_atendimento)
  const imagensOD = imagens.filter(i => i.olho === 'OD')
  const imagensOE = imagens.filter(i => i.olho === 'OE')

  const L = (texto) => translateLabel(lang, texto)
  const V = (chave, original) => (lang === 'en' ? (translated[chave] ?? original) : original)

  async function exportarPT() {
    setLang('pt')
    setPrintRequested(true)
  }

  async function exportarEN() {
    setTranslateError(null)
    if (Object.keys(translated).length === 0) {
      setTranslating(true)
      try {
        const result = await translateFreeTextFields({
          motivo: dados.motivo,
          avaliacao: dados.avaliacao,
          diagnostico: dados.diagnostico,
          tratamento: dados.tratamento,
          observacoes: dados.observacoes,
        })
        setTranslated(result)
      } catch (e) {
        setTranslateError('Erro ao traduzir. Verifica a ligação e tenta novamente.')
        setTranslating(false)
        return
      }
      setTranslating(false)
    }
    setLang('en')
    setPrintRequested(true)
  }

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="ver-root" style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
        <div className="ver-inner" style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* CABEÇALHO */}
        <div className="no-print">
          <Header
            subtitulo={`Ficha de ${dados.tipo_atendimento || 'retorno / reavaliação'}`}
            botoes={<>
              <button onClick={exportarPT} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🖨️ Exportar PDF</button>
              <button onClick={exportarEN} disabled={translating} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: translating ? 0.55 : 1, color: 'white', fontSize: 13, fontWeight: 600, cursor: translating ? 'not-allowed' : 'pointer' }}>
                {translating ? 'A traduzir...' : '🇬🇧 Exportar PDF (EN)'}
              </button>
              <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar</button>
              <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            </>}
          />
          {translateError && (
            <div style={{ background: 'var(--iv-plum-light)', color: 'var(--iv-plum-dark)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 12 }}>
              {translateError}
            </div>
          )}
        </div>

          {/* INFO DO PACIENTE */}
          <Card>
            <SeccaoTitulo>{L('Consulta')}</SeccaoTitulo>
            <Grid2>
              <Campo label={L('Data')} valor={formatarData(dados.data)} />
              <Campo label={L('Local / Clínica')} valor={dados.local} />
              <Campo label={L('Tipo de atendimento')} valor={L(dados.tipo_atendimento)} />
            </Grid2>
            <div style={{ height: 1, background: 'var(--iv-line)', margin: '16px 0' }} />
            <SeccaoTitulo>{L('Paciente')}</SeccaoTitulo>
            <Grid2>
              <Campo label={L('Nome do animal')} valor={paciente.nome} />
              <Campo label={L('Raça')} valor={paciente.raca} />
              <Campo label={L('Tutor')} valor={tutor.nome} />
            </Grid2>
          </Card>

          {/* CLÍNICO */}
          <Card>
            <SeccaoTitulo>{L('Avaliação clínica')}</SeccaoTitulo>
            <Campo label={L(config.labelMotivo)} valor={V('motivo', dados.motivo)} />
            {config.campos.map(({ campo, label }) => (
              <Campo key={campo} label={L(label)} valor={V(campo, dados[campo])} />
            ))}
          </Card>

          {/* IMAGENS */}
          <Card>
            <SeccaoTitulo>{L('Imagens')}</SeccaoTitulo>
            <div className="print-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[{ imagens: imagensOD, label: 'Olho Direito (OD)' }, { imagens: imagensOE, label: 'Olho Esquerdo (OE)' }].map(({ imagens, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--iv-ink-muted)', marginBottom: 10, textAlign: 'center' }}>{L(label)}</div>
                  {imagens.length > 0 ? imagens.map((img, i) => (
                    <img key={i} src={img.preview} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 10, objectFit: 'cover', border: '1px solid var(--iv-line)' }} />
                  )) : (
                    <div style={{ border: '2px dashed var(--iv-line)', borderRadius: 10, padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--iv-line)' }}>{L('Sem imagens')}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* BOTÕES */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 40 }}>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar à pesquisa</button>
          </div>

        </div>
      </div>
    </>
  )
}