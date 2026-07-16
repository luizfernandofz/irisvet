import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'

export default function EditarConsentimento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [paciente, setPaciente] = useState(null)
  const [tutor, setTutor] = useState(null)
  const [dados, setDados] = useState({ data: '', procedimento: '', valor: '', observacoes: '' })

  useEffect(() => {
    async function fetchDados() {
      const { data, error } = await supabase
        .from('consent_forms')
        .select(`*, patients ( nome, especie, raca, genero, tutors ( nome, telefone, email, nif, morada ) )`)
        .eq('id', id)
        .single()
      if (error || !data) { console.error(error); setLoading(false); return }
      setPaciente(data.patients || {})
      setTutor(data.patients?.tutors || {})
      setDados({
        data: data.data || '', procedimento: data.procedimento || '',
        valor: data.valor || '', observacoes: data.observacoes || '',
      })
      setLoading(false)
    }
    fetchDados()
  }, [id])

  function set(campo, valor) {
    setDados(d => ({ ...d, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const { error } = await supabase.from('consent_forms').update({
      data: dados.data, procedimento: dados.procedimento,
      valor: dados.valor, observacoes: dados.observacoes,
    }).eq('id', id)
    setSalvando(false)
    if (error) { setErro('Erro ao guardar. Tenta novamente.'); return }
    navigate(`/consentimentos/${id}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar...</div>
    </div>
  )

  if (!paciente) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Termo não encontrado.</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Editar termo de consentimento"
          botoes={<>
            <button onClick={() => navigate(`/consentimentos/${id}`)} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
          <div style={sectionTitle}>
            Tutor e Paciente
            <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>
              — só de leitura; para corrigir estes dados, edita a ficha do paciente
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8 }}>
            <strong>{paciente.nome}</strong> ({paciente.especie}{paciente.raca ? `, ${paciente.raca}` : ''}) · Tutor: {tutor.nome}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Dados da Cirurgia</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Data</label>
                <input type="date" value={dados.data} onChange={e => set('data', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valor</label>
                <input type="text" value={dados.valor} onChange={e => set('valor', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Procedimento</label>
              <textarea value={dados.procedimento} onChange={e => set('procedimento', e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={labelStyle}>Observações</label>
              <textarea value={dados.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          </div>

          {erro && (
            <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={salvando} style={{
            width: '100%', padding: '14px', borderRadius: 10, border: 'none',
            background: salvando ? '#a9a4e8' : '#534AB7', color: 'white',
            fontSize: 15, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer', marginBottom: 40,
          }}>
            {salvando ? 'A guardar...' : '✓ Guardar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafafa',
  fontFamily: 'inherit', color: '#222',
}
const sectionTitle = { fontSize: 11, fontWeight: 600, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }
