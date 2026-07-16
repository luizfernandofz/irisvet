import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase } from '../lib/supabase'
import { formatarData } from '../lib/utils'
import Header from '../components/Header'

function normalizar(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export default function ConsultarReceituarios({ profile }) {
  const navigate = useNavigate()
  const isGodMode = profile?.role === 'godmode'
  const [receituarios, setReceituarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroResponsavel, setFiltroResponsavel] = useState('')
  const [filtroPaciente, setFiltroPaciente] = useState('')
  const [filtroRaca, setFiltroRaca] = useState('')
  const [filtroDataDe, setFiltroDataDe] = useState('')
  const [filtroDataAte, setFiltroDataAte] = useState('')
  const [filtroVet, setFiltroVet] = useState('')
  const [resultados, setResultados] = useState([])

  async function fetchDados() {
    setLoading(true)
    const { data } = await supabase
      .from('receituarios')
      .select(`
        id, data, idade_no_receituario, status,
        profiles ( display_name ),
        patients ( id, nome, raca, tutors ( nome, nif ) )
      `)
      .order('data', { ascending: false })

    const formatados = (data || []).map(r => ({
      id: r.id, data: r.data, status: r.status, idade: r.idade_no_receituario || '',
      paciente_nome: r.patients?.nome || '', paciente_raca: r.patients?.raca || '',
      tutor_nome: r.patients?.tutors?.nome || '', tutor_nif: r.patients?.tutors?.nif || '',
      vet_nome: r.profiles?.display_name || '',
      _nome_norm: normalizar(r.patients?.nome), _tutor_norm: normalizar(r.patients?.tutors?.nome),
      _raca_norm: normalizar(r.patients?.raca),
    }))
    setReceituarios(formatados)
    setResultados(formatados)
    setLoading(false)
  }

  useEffect(() => { fetchDados() }, [])

  useEffect(() => {
    let lista = [...receituarios]
    if (filtroDataDe) lista = lista.filter(r => r.data >= filtroDataDe)
    if (filtroDataAte) lista = lista.filter(r => r.data <= filtroDataAte)
    if (isGodMode && filtroVet) lista = lista.filter(r => r.vet_nome === filtroVet)
    if (filtroRaca.trim()) {
      const termo = normalizar(filtroRaca)
      lista = lista.filter(r => r._raca_norm.includes(termo))
    }
    if (filtroResponsavel.trim()) {
      const termo = normalizar(filtroResponsavel)
      const fuse = new Fuse(lista, { keys: ['_tutor_norm'], threshold: 0.4 })
      const r = fuse.search(termo)
      lista = r.length > 0 ? r.map(x => x.item) : lista.filter(x => x._tutor_norm.includes(termo))
    }
    if (filtroPaciente.trim()) {
      const termo = normalizar(filtroPaciente)
      const fuse = new Fuse(lista, { keys: ['_nome_norm'], threshold: 0.4 })
      const r = fuse.search(termo)
      lista = r.length > 0 ? r.map(x => x.item) : lista.filter(x => x._nome_norm.includes(termo))
    }
    setResultados(lista)
  }, [filtroResponsavel, filtroPaciente, filtroRaca, filtroDataDe, filtroDataAte, filtroVet, isGodMode, receituarios])

  const vetsDisponiveis = isGodMode ? [...new Set(receituarios.map(r => r.vet_nome).filter(Boolean))].sort() : []

  function limparFiltros() {
    setFiltroResponsavel(''); setFiltroPaciente(''); setFiltroRaca('')
    setFiltroDataDe(''); setFiltroDataAte(''); setFiltroVet('')
  }

  async function excluirReceituario(id) {
    const confirmado = window.confirm('Você realmente quer eliminar permanentemente este receituário?')
    if (!confirmado) return
    await supabase.from('receituarios').delete().eq('id', id)
    fetchDados()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Consultar receituários"
          botoes={<>
            <button onClick={() => navigate('/receituarios')} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />

        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Filtros de pesquisa
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Responsável</label>
              <input type="text" value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)} placeholder="Ex: Angela..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Paciente</label>
              <input type="text" value={filtroPaciente} onChange={e => setFiltroPaciente(e.target.value)} placeholder="Ex: Honey..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Raça</label>
              <input type="text" value={filtroRaca} onChange={e => setFiltroRaca(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Data de</label>
                <input type="date" value={filtroDataDe} onChange={e => setFiltroDataDe(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Data até</label>
                <input type="date" value={filtroDataAte} onChange={e => setFiltroDataAte(e.target.value)} style={inputStyle} />
              </div>
            </div>
            {isGodMode && (
              <div>
                <label style={labelStyle}>Veterinário</label>
                <select value={filtroVet} onChange={e => setFiltroVet(e.target.value)} style={inputStyle}>
                  <option value="">Todos os veterinários</option>
                  {vetsDisponiveis.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}
          </div>
          <button onClick={limparFiltros} style={{ marginTop: 12, padding: '7px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#888', fontSize: 12, cursor: 'pointer' }}>
            Limpar filtros
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#888' }}>
            {loading ? 'A carregar...' : `${resultados.length} receituário${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}`}
          </div>
          {!loading && resultados.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 14 }}>Nenhum receituário encontrado</div>
          )}
          {resultados.map((r, i) => (
            <div key={r.id} style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < resultados.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#222', marginBottom: 3 }}>
                  {r.paciente_nome || 'Sem nome'}
                  {r.idade && <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}> · {r.idade}</span>}
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>
                  {r.tutor_nome}{r.tutor_nif ? ` · NIF ${r.tutor_nif}` : ''} · {formatarData(r.data)}
                  {isGodMode && r.vet_nome && <span style={{ color: '#534AB7', fontWeight: 600 }}> · {r.vet_nome}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => navigate(`/receituarios/${r.id}`)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #AFA9EC', background: '#EEEDFE', color: '#534AB7', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>👁 Ver</button>
                <button onClick={() => navigate(`/receituarios/editar/${r.id}`)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 12, cursor: 'pointer' }}>✏️ Editar</button>
                <button onClick={() => excluirReceituario(r.id)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #F0997B', background: '#FAECE7', color: '#993C1D', fontSize: 12, cursor: 'pointer' }}>🗑 Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit', color: '#222' }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }
