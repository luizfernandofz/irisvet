import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import MedicamentoBloco from '../components/MedicamentoBloco'
import { RECOMENDACOES_OPCOES, novoMedicamento } from '../lib/receituarioOptions'

export default function EditarReceituario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [paciente, setPaciente] = useState(null)
  const [tutor, setTutor] = useState(null)
  const [data, setData] = useState('')
  const [medicamentos, setMedicamentos] = useState([])
  const [recomendacoes, setRecomendacoes] = useState([])
  const [comentariosAdicionais, setComentariosAdicionais] = useState('')

  useEffect(() => {
    async function fetchDados() {
      const { data: rec, error } = await supabase
        .from('receituarios')
        .select(`*, patients ( nome, especie, raca, genero, tutors ( nome, telefone, email, nif ) )`)
        .eq('id', id)
        .single()
      if (error || !rec) { console.error(error); setLoading(false); return }
      setPaciente(rec.patients || {})
      setTutor(rec.patients?.tutors || {})
      setData(rec.data || '')
      setMedicamentos(Array.isArray(rec.medicamentos) && rec.medicamentos.length > 0 ? rec.medicamentos : [novoMedicamento()])
      setRecomendacoes(Array.isArray(rec.recomendacoes) ? rec.recomendacoes : [])
      setComentariosAdicionais(rec.comentarios_adicionais || '')
      setLoading(false)
    }
    fetchDados()
  }, [id])

  function addMedicamento() {
    setMedicamentos(m => [...m, novoMedicamento()])
  }
  function updateMedicamento(i, novo) {
    setMedicamentos(m => m.map((med, idx) => idx === i ? novo : med))
  }
  function removerMedicamento(i) {
    setMedicamentos(m => m.length === 1 ? m : m.filter((_, idx) => idx !== i))
  }
  function toggleRecomendacao(opcao) {
    setRecomendacoes(r => r.includes(opcao) ? r.filter(x => x !== opcao) : [...r, opcao])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const { error } = await supabase.from('receituarios').update({
      data, medicamentos, recomendacoes, comentarios_adicionais: comentariosAdicionais,
    }).eq('id', id)
    setSalvando(false)
    if (error) { setErro('Erro ao guardar. Tenta novamente.'); return }
    navigate(`/receituarios/${id}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar...</div>
    </div>
  )

  if (!paciente) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Receituário não encontrado.</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Editar receituário"
          botoes={<>
            <button onClick={() => navigate(`/receituarios/${id}`)} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
          <div style={sectionTitle}>
            Paciente e Responsável
            <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
              — só de leitura; para corrigir estes dados, edita a ficha do paciente
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8 }}>
            <strong>{paciente.nome}</strong> ({paciente.especie}{paciente.raca ? `, ${paciente.raca}` : ''}) · Responsável: {tutor.nome}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Medicações</div>
            {medicamentos.map((med, i) => (
              <MedicamentoBloco key={i} med={med} indice={i}
                onChange={novo => updateMedicamento(i, novo)}
                onRemover={() => removerMedicamento(i)} />
            ))}
            <button type="button" onClick={addMedicamento} style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid #534AB7', background: '#EEEDFE',
              color: '#534AB7', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              + Adicionar Medicação
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Recomendações</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {RECOMENDACOES_OPCOES.map(o => (
                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={recomendacoes.includes(o)} onChange={() => toggleRecomendacao(o)} />
                  {o}
                </label>
              ))}
            </div>
            <div style={sectionTitle}>Comentários Adicionais</div>
            <textarea value={comentariosAdicionais} onChange={e => setComentariosAdicionais(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {erro && <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{erro}</div>}

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
