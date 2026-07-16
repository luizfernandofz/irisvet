import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarData } from '../lib/utils'
import Header from '../components/Header'
import { translateLabel, translateFreeTextFields } from '../lib/pdfTranslations'

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { background: white !important; margin: 0; padding: 0; }
  .ver-root { background: white !important; padding: 8px !important; }
  .ver-inner { max-width: 100% !important; }
  .ver-card { box-shadow: none !important; border-radius: 4px !important; margin-bottom: 8px !important; padding: 16px !important; border: 0.5px solid #eee !important; page-break-inside: avoid; }
}
`

function Card({ children }) {
  return (
    <div className="ver-card" style={{ background: 'white', borderRadius: 16, padding: '32px', boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function SeccaoTitulo({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, background: '#f0f0f0', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }}>{label}</label>
      <div style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', background: '#fafafa', color: valor ? '#222' : '#ccc', whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word', minHeight: 40 }}>
        {valor || '—'}
      </div>
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

const btnNav = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
  background: 'white', color: '#555', fontSize: 13, cursor: 'pointer'
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
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  useEffect(() => {
    if (!printRequested) return
    window.print()
    setPrintRequested(false)
  }, [printRequested])

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar...</div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Ficha não encontrada.</div>
    </div>
  )

  const paciente = dados.patients || {}
  const tutor = paciente.tutors || {}
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
      <div className="ver-root" style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
        <div className="ver-inner" style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* CABEÇALHO */}
        <div className="no-print">
          <Header
            subtitulo="Ficha de retorno / reavaliação"
            botoes={<>
              <button onClick={exportarPT} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1D9E75', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🖨️ Exportar PDF</button>
              <button onClick={exportarEN} disabled={translating} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: translating ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 13, fontWeight: 600, cursor: translating ? 'not-allowed' : 'pointer' }}>
                {translating ? 'A traduzir...' : '🇬🇧 Exportar PDF (EN)'}
              </button>
              <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar</button>
              <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            </>}
          />
          {translateError && (
            <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 12 }}>
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
            <div style={{ height: 1, background: '#f0f0f0', margin: '16px 0' }} />
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
            <Campo label={L('Motivo')} valor={V('motivo', dados.motivo)} />
            <Campo label={L('Avaliação')} valor={V('avaliacao', dados.avaliacao)} />
            <Campo label={L('Diagnóstico')} valor={V('diagnostico', dados.diagnostico)} />
            <Campo label={L('Tratamento')} valor={V('tratamento', dados.tratamento)} />
          </Card>

          {/* IMAGENS */}
          <Card>
            <SeccaoTitulo>{L('Imagens')}</SeccaoTitulo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[{ imagens: imagensOD, label: 'Olho Direito (OD)' }, { imagens: imagensOE, label: 'Olho Esquerdo (OE)' }].map(({ imagens, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textAlign: 'center' }}>{L(label)}</div>
                  {imagens.length > 0 ? imagens.map((img, i) => (
                    <img key={i} src={img.preview} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 10, objectFit: 'cover', border: '1px solid #eee' }} />
                  )) : (
                    <div style={{ border: '2px dashed #eee', borderRadius: 10, padding: 24, textAlign: 'center', fontSize: 13, color: '#ccc' }}>{L('Sem imagens')}</div>
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