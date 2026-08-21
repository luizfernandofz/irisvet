import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarData } from '../lib/utils'
import { composerFraseMedicamento } from '../lib/receituarioOptions'
import Header from '../components/Header'

export default function VerReceituario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [baixando, setBaixando] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    async function fetchDados() {
      const { data, error } = await supabase
        .from('receituarios')
        .select(`*, patients ( nome, especie, raca, genero, tutors ( nome, telefone, email, nif ) )`)
        .eq('id', id)
        .single()
      if (error) { console.error(error); setLoading(false); return }
      setDados(data)
      setLoading(false)
    }
    fetchDados()
  }, [id])

  async function baixarPdf(lang) {
    setBaixando(lang)
    setErro(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/receituario-pdf?id=${id}&lang=${lang}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Falha ao gerar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receituario-${dados?.patients?.nome || id}-${lang}.pdf`
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--iv-bg)' }}>
      <div style={{ fontSize: 14, color: 'var(--iv-ink-muted)' }}>A carregar receituário...</div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--iv-bg)' }}>
      <div style={{ fontSize: 14, color: 'var(--iv-ink-muted)' }}>Receituário não encontrado.</div>
    </div>
  )

  const paciente = dados.patients || {}
  const tutor = paciente.tutors || {}
  const medicamentos = Array.isArray(dados.medicamentos) ? dados.medicamentos : []
  const recomendacoes = Array.isArray(dados.recomendacoes) ? dados.recomendacoes : []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Receituário"
          botoes={<>
            <button onClick={() => navigate(`/receituarios/editar/${id}`)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-plum)', background: 'transparent', color: 'var(--iv-plum-dark)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>✏️ Editar</button>
            <button onClick={() => baixarPdf('pt')} disabled={baixando !== null} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: baixando === 'pt' ? 0.55 : 1, color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
              {baixando === 'pt' ? 'A gerar...' : '⬇️ PDF (PT)'}
            </button>
            <button onClick={() => baixarPdf('en')} disabled={baixando !== null} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: baixando === 'en' ? 0.55 : 1, color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
              {baixando === 'en' ? 'A gerar...' : '🇬🇧 PDF (EN)'}
            </button>
            <button onClick={() => navigate('/receituarios/lista')} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />
        {erro && <div style={{ background: 'var(--iv-plum-light)', color: 'var(--iv-plum-dark)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{erro}</div>}

        <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 32, boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16 }}>
          <div style={sectionTitle}>Dados do Paciente</div>
          <Grid5>
            <Campo label="Nome do paciente" valor={paciente.nome} />
            <Campo label="Idade" valor={dados.idade_no_receituario} />
            <Campo label="Raça" valor={paciente.raca} />
            <Campo label="Espécie" valor={paciente.especie} />
            <Campo label="Género" valor={paciente.genero} />
          </Grid5>
          <div style={dividerStyle} />
          <div style={sectionTitle}>Dados do Responsável</div>
          <Grid4>
            <Campo label="Nome" valor={tutor.nome} />
            <Campo label="NIF/CPF" valor={tutor.nif} />
            <Campo label="Telefone" valor={tutor.telefone} />
            <Campo label="Email" valor={tutor.email} />
          </Grid4>
        </div>

        <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 32, boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16 }}>
          <div style={sectionTitle}>Medicações</div>
          {medicamentos.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--iv-line)' }}>Sem medicações.</div>
          ) : medicamentos.map((med, i) => (
            <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < medicamentos.length - 1 ? '1px solid var(--iv-line)' : 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--iv-sage)' }}>
                {i + 1}) {med.medicacao || '(sem nome)'} {med.distribuicao || med.apresentacao ? `— ${[med.distribuicao, med.apresentacao].filter(Boolean).join(' — ')}` : ''}
              </div>
              {med.uso && <div style={{ fontSize: 11, color: 'var(--iv-ink-muted)', marginTop: 2 }}>{med.uso}</div>}
              <div style={{ fontSize: 13, color: 'var(--iv-ink)', marginTop: 4 }}>{composerFraseMedicamento(med) || '(posologia incompleta)'}</div>
              {med.comentario && <div style={{ fontSize: 12, color: 'var(--iv-ink-muted)', marginTop: 2, fontStyle: 'italic' }}>{med.comentario}</div>}
            </div>
          ))}
        </div>

        {(recomendacoes.length > 0 || dados.comentarios_adicionais) && (
          <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 32, boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 40 }}>
            {recomendacoes.length > 0 && (
              <>
                <div style={sectionTitle}>Recomendações</div>
                <ul style={{ fontSize: 13, color: 'var(--iv-ink)', paddingLeft: 20, marginBottom: dados.comentarios_adicionais ? 16 : 0 }}>
                  {recomendacoes.map(r => <li key={r}>{r}</li>)}
                </ul>
              </>
            )}
            {dados.comentarios_adicionais && (
              <>
                <div style={sectionTitle}>Comentários Adicionais</div>
                <div style={{ fontSize: 13, color: 'var(--iv-ink)' }}>{dados.comentarios_adicionais}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Grid5({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>{children}</div> }
function Grid4({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>{children}</div> }

function Campo({ label, valor }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }}>{label}</label>
      <div style={{
        width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--iv-line)',
        fontSize: 13, boxSizing: 'border-box', background: 'var(--iv-bg)', color: valor ? 'var(--iv-ink)' : 'var(--iv-line)',
        whiteSpace: 'pre-wrap', lineHeight: 1.4, wordBreak: 'break-word', minHeight: 34,
      }}>
        {valor || '—'}
      </div>
    </div>
  )
}

const sectionTitle = { fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)', textTransform: 'uppercase', letterSpacing: 1, background: 'var(--iv-line)', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }
const dividerStyle = { height: 1, background: 'var(--iv-line)', margin: '20px 0' }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer' }
