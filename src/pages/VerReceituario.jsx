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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar receituário...</div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Receituário não encontrado.</div>
    </div>
  )

  const paciente = dados.patients || {}
  const tutor = paciente.tutors || {}
  const medicamentos = Array.isArray(dados.medicamentos) ? dados.medicamentos : []
  const recomendacoes = Array.isArray(dados.recomendacoes) ? dados.recomendacoes : []

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Receituário"
          botoes={<>
            <button onClick={() => navigate(`/receituarios/editar/${id}`)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #534AB7', background: '#EEEDFE', color: '#534AB7', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>✏️ Editar</button>
            <button onClick={() => baixarPdf('pt')} disabled={baixando !== null} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: baixando === 'pt' ? '#a9a4e8' : '#1D9E75', color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
              {baixando === 'pt' ? 'A gerar...' : '⬇️ PDF (PT)'}
            </button>
            <button onClick={() => baixarPdf('en')} disabled={baixando !== null} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: baixando === 'en' ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 13, fontWeight: 600, cursor: baixando ? 'not-allowed' : 'pointer' }}>
              {baixando === 'en' ? 'A gerar...' : '🇬🇧 PDF (EN)'}
            </button>
            <button onClick={() => navigate('/receituarios/lista')} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />
        {erro && <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{erro}</div>}

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
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

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
          <div style={sectionTitle}>Medicações</div>
          {medicamentos.length === 0 ? (
            <div style={{ fontSize: 13, color: '#ccc' }}>Sem medicações.</div>
          ) : medicamentos.map((med, i) => (
            <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < medicamentos.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#534AB7' }}>
                {i + 1}) {med.medicacao || '(sem nome)'} {med.distribuicao || med.apresentacao ? `— ${[med.distribuicao, med.apresentacao].filter(Boolean).join(' — ')}` : ''}
              </div>
              {med.uso && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{med.uso}</div>}
              <div style={{ fontSize: 13, color: '#333', marginTop: 4 }}>{composerFraseMedicamento(med) || '(posologia incompleta)'}</div>
              {med.comentario && <div style={{ fontSize: 12, color: '#888', marginTop: 2, fontStyle: 'italic' }}>{med.comentario}</div>}
            </div>
          ))}
        </div>

        {(recomendacoes.length > 0 || dados.comentarios_adicionais) && (
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 40 }}>
            {recomendacoes.length > 0 && (
              <>
                <div style={sectionTitle}>Recomendações</div>
                <ul style={{ fontSize: 13, color: '#333', paddingLeft: 20, marginBottom: dados.comentarios_adicionais ? 16 : 0 }}>
                  {recomendacoes.map(r => <li key={r}>{r}</li>)}
                </ul>
              </>
            )}
            {dados.comentarios_adicionais && (
              <>
                <div style={sectionTitle}>Comentários Adicionais</div>
                <div style={{ fontSize: 13, color: '#333' }}>{dados.comentarios_adicionais}</div>
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
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#555', marginBottom: 4 }}>{label}</label>
      <div style={{
        width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd',
        fontSize: 13, boxSizing: 'border-box', background: '#fafafa', color: valor ? '#222' : '#ccc',
        whiteSpace: 'pre-wrap', lineHeight: 1.4, wordBreak: 'break-word', minHeight: 34,
      }}>
        {valor || '—'}
      </div>
    </div>
  )
}

const sectionTitle = { fontSize: 11, fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, background: '#f0f0f0', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }
const dividerStyle = { height: 1, background: '#f0f0f0', margin: '20px 0' }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }
