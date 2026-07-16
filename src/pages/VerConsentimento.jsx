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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar termo...</div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Termo não encontrado.</div>
    </div>
  )

  const paciente = dados.patients || {}
  const tutor = paciente.tutors || {}

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Termo de consentimento"
          botoes={<>
            <button onClick={() => navigate(`/consentimentos/editar/${id}`)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #534AB7', background: '#EEEDFE', color: '#534AB7', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>✏️ Editar</button>
            <button onClick={() => baixarPdf('pt')} disabled={baixando !== null} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: baixando === 'pt' ? '#a9a4e8' : '#1D9E75', color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
              {baixando === 'pt' ? 'A gerar...' : '⬇️ PDF (PT)'}
            </button>
            <button onClick={() => baixarPdf('en')} disabled={baixando !== null} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: baixando === 'en' ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
              {baixando === 'en' ? 'A gerar...' : '🇬🇧 PDF (EN)'}
            </button>
            <button onClick={() => { setMostrarEnvio(v => !v); setEnvioMsg(null) }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: mostrarEnvio ? '#f0f0f0' : 'white', color: '#555', fontSize: 13, cursor: 'pointer' }}>
              ✉️ Enviar por Email
            </button>
            <button onClick={() => navigate('/consentimentos/lista')} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />
        {erro && (
          <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
            {erro}
          </div>
        )}

        {mostrarEnvio && (
          <form onSubmit={enviarEmail} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Enviar termo por email</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }}>Email do destinatário</label>
                <input type="email" required value={emailDestino} onChange={e => setEmailDestino(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }}>Idioma</label>
                <select value={langEnvio} onChange={e => setLangEnvio(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}>
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                </select>
              </div>
              <button type="submit" disabled={enviando} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: enviando ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: enviando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {enviando ? 'A enviar...' : 'Enviar'}
              </button>
            </div>
            {envioMsg && (
              <div style={{
                marginTop: 12, borderRadius: 8, padding: '10px 12px', fontSize: 13,
                background: envioMsg.tipo === 'sucesso' ? '#E1F5EE' : '#FAECE7',
                color: envioMsg.tipo === 'sucesso' ? '#0F6E56' : '#993C1D',
              }}>
                {envioMsg.texto}
              </div>
            )}
          </form>
        )}

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
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

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 40 }}>
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
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }}>{label}</label>
      <div style={{
        width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd',
        fontSize: 14, boxSizing: 'border-box', background: '#fafafa', color: valor ? '#222' : '#ccc',
        whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', minHeight: 40,
      }}>
        {valor || '—'}
      </div>
    </div>
  )
}

const sectionTitle = { fontSize: 11, fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, background: '#f0f0f0', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }
const dividerStyle = { height: 1, background: '#f0f0f0', margin: '20px 0' }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }
