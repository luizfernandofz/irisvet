import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarData } from '../lib/utils'
import Header from '../components/Header'
import { translateLabel } from '../lib/pdfTranslations'
import { configSimplificado } from '../lib/tiposAtendimento'

function Card({ children }) {
  return (
    <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: '32px', boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function SeccaoTitulo({ children }) {
  return (
    <div style={{ fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)', textTransform: 'uppercase', letterSpacing: 1, background: 'var(--iv-line)', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }}>{label}</label>
      <div style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--iv-line)', fontSize: 14, boxSizing: 'border-box', background: 'var(--iv-bg)', color: valor ? 'var(--iv-ink)' : 'var(--iv-line)', whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word', minHeight: 40 }}>
        {valor || '—'}
      </div>
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
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
  const [translateError, setTranslateError] = useState(null)
  const [baixando, setBaixando] = useState(null)

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

  // A pagina mostra sempre PT; a versao EN existe apenas no PDF, traduzida
  // no servidor (ver VerFicha.jsx para o mesmo padrão).
  const L = (texto) => translateLabel('pt', texto)
  const V = (chave, original) => original

  async function baixarPdf(idioma) {
    setBaixando(idioma)
    setTranslateError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/reavaliacao-pdf?id=${id}&lang=${idioma}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Falha ao gerar PDF')

      const disposicao = res.headers.get('Content-Disposition') || ''
      const encontrado = disposicao.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
      const nome = encontrado ? decodeURIComponent(encontrado[1]) : `reavaliacao-${id}.pdf`

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nome
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setTranslateError('Erro ao gerar o PDF. Verifica a ligação e tenta novamente.')
    } finally {
      setBaixando(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* CABEÇALHO */}
        <div>
          <Header
            subtitulo={`Ficha de ${dados.tipo_atendimento || 'retorno / reavaliação'}`}
            botoes={<>
              <button onClick={() => baixarPdf('pt')} disabled={!!baixando} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: baixando ? 0.55 : 1, color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
                {baixando === 'pt' ? 'A gerar...' : '🖨️ Exportar PDF'}
              </button>
              <button onClick={() => baixarPdf('en')} disabled={!!baixando} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: baixando ? 0.55 : 1, color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
                {baixando === 'en' ? 'A traduzir...' : '🇬🇧 Exportar PDF (EN)'}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 40 }}>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar à pesquisa</button>
          </div>

      </div>
    </div>
  )
}