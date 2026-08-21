import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarData, calcularIdade } from '../lib/utils'
import Header from '../components/Header'

export default function VerConsentimento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [baixando, setBaixando] = useState(null)
  const [erro, setErro] = useState(null)
  const [mostrarEnvio, setMostrarEnvio] = useState(false)
  const [emailDestino, setEmailDestino] = useState('')
  const [langEnvio, setLangEnvio] = useState('pt')
  const [enviando, setEnviando] = useState(false)
  const [envioMsg, setEnvioMsg] = useState(null)

  useEffect(() => {
    async function fetchDados() {
      const { data, error } = await supabase
        .from('consent_forms')
        .select(`*, patients ( nome, especie, raca, genero, tutors ( nome, telefone, email, nif, morada ) )`)
        .eq('id', id)
        .single()
      if (error) { console.error(error); setLoading(false); return }
      setDados(data)
      setEmailDestino(data?.patients?.tutors?.email || '')
      setLoading(false)
    }
    fetchDados()
  }, [id])

  async function baixarPdf(lang) {
    setBaixando(lang)
    setErro(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/consent-pdf?id=${id}&lang=${lang}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Falha ao gerar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `termo-consentimento-${dados?.patients?.nome || id}-${lang}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setErro('Erro ao gerar o PDF. Tenta novamente.')
    } finally {
      setBaixando(null)
    }
  }

  async function enviarEmail(e) {
    e.preventDefault()
    setEnviando(true)
    setEnvioMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/send-consent-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, lang: langEnvio, to: emailDestino }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Falha ao enviar')
      setEnvioMsg({ tipo: 'sucesso', texto: `Email enviado para ${emailDestino}.` })
    } catch (e) {
      console.error(e)
      setEnvioMsg({ tipo: 'erro', texto: 'Erro ao enviar o email. Verifica o endereço e tenta novamente.' })
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--iv-bg)' }}>
      <div style={{ fontSize: 14, color: 'var(--iv-ink-muted)' }}>A carregar termo...</div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--iv-bg)' }}>
      <div style={{ fontSize: 14, color: 'var(--iv-ink-muted)' }}>Termo não encontrado.</div>
    </div>
  )

  const paciente = dados.patients || {}
  const tutor = paciente.tutors || {}

  return (
    <div style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Termo de consentimento"
          botoes={<>
            <button onClick={() => navigate(`/consentimentos/editar/${id}`)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-plum)', background: 'transparent', color: 'var(--iv-plum-dark)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>✏️ Editar</button>
            <button onClick={() => baixarPdf('pt')} disabled={baixando !== null} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: baixando === 'pt' ? 0.55 : 1, color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
              {baixando === 'pt' ? 'A gerar...' : '⬇️ PDF (PT)'}
            </button>
            <button onClick={() => baixarPdf('en')} disabled={baixando !== null} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: baixando === 'en' ? 0.55 : 1, color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
              {baixando === 'en' ? 'A gerar...' : '🇬🇧 PDF (EN)'}
            </button>
            <button onClick={() => { setMostrarEnvio(v => !v); setEnvioMsg(null) }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)', background: mostrarEnvio ? 'var(--iv-line)' : 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer' }}>
              ✉️ Enviar por Email
            </button>
            <button onClick={() => navigate('/consentimentos/lista')} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />
        {erro && (
          <div style={{ background: 'var(--iv-plum-light)', color: 'var(--iv-plum-dark)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
            {erro}
          </div>
        )}

        {mostrarEnvio && (
          <form onSubmit={enviarEmail} style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 24, boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Enviar termo por email</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }}>Email do destinatário</label>
                <input type="email" required value={emailDestino} onChange={e => setEmailDestino(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--iv-line)', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }}>Idioma</label>
                <select value={langEnvio} onChange={e => setLangEnvio(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--iv-line)', fontSize: 14, boxSizing: 'border-box' }}>
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                </select>
              </div>
              <button type="submit" disabled={enviando} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: enviando ? 0.55 : 1, color: 'white', fontSize: 14, fontWeight: 600, cursor: enviando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {enviando ? 'A enviar...' : 'Enviar'}
              </button>
            </div>
            {envioMsg && (
              <div style={{
                marginTop: 12, borderRadius: 8, padding: '10px 12px', fontSize: 13,
                background: envioMsg.tipo === 'sucesso' ? 'var(--iv-sage-light)' : 'var(--iv-plum-light)',
                color: envioMsg.tipo === 'sucesso' ? 'var(--iv-sage-dark)' : 'var(--iv-plum-dark)',
              }}>
                {envioMsg.texto}
              </div>
            )}
          </form>
        )}

        <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 32, boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16 }}>
          <div style={sectionTitle}>Cliente (Tutor)</div>
          <Grid2>
            <Campo label="Nome" valor={tutor.nome} />
            <Campo label="Telefone" valor={tutor.telefone} />
            <Campo label="CPF / NIF" valor={tutor.nif} />
            <Campo label="Email" valor={tutor.email} />
            <div style={{ gridColumn: '1 / -1' }}>
              <Campo label="Endereço" valor={tutor.morada} />
            </div>
          </Grid2>
          <div style={dividerStyle} />
          <div style={sectionTitle}>Paciente</div>
          <Grid2>
            <Campo label="Nome do animal" valor={paciente.nome} />
            <Campo label="Espécie" valor={paciente.especie} />
            <Campo label="Raça" valor={paciente.raca} />
            <Campo label="Género" valor={paciente.genero} />
            <Campo label="Idade (no termo)" valor={dados.idade_no_termo} />
          </Grid2>
        </div>

        <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 32, boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 40 }}>
          <div style={sectionTitle}>Dados da Cirurgia</div>
          <Grid2>
            <Campo label="Data" valor={formatarData(dados.data)} />
            <Campo label="Valor" valor={dados.valor} />
          </Grid2>
          <Campo label="Procedimento" valor={dados.procedimento} />
          <Campo label="Observações" valor={dados.observacoes} />
        </div>
      </div>
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

function Campo({ label, valor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }}>{label}</label>
      <div style={{
        width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--iv-line)',
        fontSize: 14, boxSizing: 'border-box', background: 'var(--iv-bg)', color: valor ? 'var(--iv-ink)' : 'var(--iv-line)',
        whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', minHeight: 40,
      }}>
        {valor || '—'}
      </div>
    </div>
  )
}

const sectionTitle = { fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)', textTransform: 'uppercase', letterSpacing: 1, background: 'var(--iv-line)', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }
const dividerStyle = { height: 1, background: 'var(--iv-line)', margin: '20px 0' }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer' }
