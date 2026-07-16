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

export default function ConsultarConsentimentos({ profile }) {
  const navigate = useNavigate()
  const isGodMode = profile?.role === 'godmode'
  const [termos, setTermos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTutor, setFiltroTutor] = useState('')
  const [filtroPet, setFiltroPet] = useState('')
  const [filtroDataDe, setFiltroDataDe] = useState('')
  const [filtroDataAte, setFiltroDataAte] = useState('')
  const [filtroVet, setFiltroVet] = useState('')
  const [resultados, setResultados] = useState([])

  async function fetchDados() {
    setLoading(true)
    const { data } = await supabase
      .from('consent_forms')
      .select(`
        id, data, procedimento, valor, status,
        profiles ( display_name ),
        patients ( id, nome, especie, raca, tutors ( nome, telefone ) )
      `)
      .order('data', { ascending: false })

    const formatados = (data || []).map(t => ({
      id: t.id, data: t.data, procedimento: t.procedimento || '', status: t.status,
      paciente_nome: t.patients?.nome || '', tutor_nome: t.patients?.tutors?.nome || '',
      vet_nome: t.profiles?.display_name || '',
      _nome_norm: normalizar(t.patients?.nome), _tutor_norm: normalizar(t.patients?.tutors?.nome),
    }))
    setTermos(formatados)
    setResultados(formatados)
    setLoading(false)
  }

  useEffect(() => { fetchDados() }, [])

  useEffect(() => {
    let lista = [...termos]
    if (filtroDataDe) lista = lista.filter(t => t.data >= filtroDataDe)
    if (filtroDataAte) lista = lista.filter(t => t.data <= filtroDataAte)
    if (isGodMode && filtroVet) lista = lista.filter(t => t.vet_nome === filtroVet)
    if (filtroTutor.trim()) {
      const termo = normalizar(filtroTutor)
      const fuse = new Fuse(lista, { keys: ['_tutor_norm'], threshold: 0.4 })
      const r = fuse.search(termo)
      lista = r.length > 0 ? r.map(x => x.item) : lista.filter(t => t._tutor_norm.includes(termo))
    }
    if (filtroPet.trim()) {
      const termo = normalizar(filtroPet)
      const fuse = new Fuse(lista, { keys: ['_nome_norm'], threshold: 0.4 })
      const r = fuse.search(termo)
      lista = r.length > 0 ? r.map(x => x.item) : lista.filter(t => t._nome_norm.includes(termo))
    }
    setResultados(lista)
  }, [filtroTutor, filtroPet, filtroDataDe, filtroDataAte, filtroVet, isGodMode, termos])

  const vetsDisponiveis = isGodMode
    ? [...new Set(termos.map(t => t.vet_nome).filter(Boolean))].sort()
    : []

  function limparFiltros() {
    setFiltroTutor(''); setFiltroPet(''); setFiltroDataDe(''); setFiltroDataAte(''); setFiltroVet('')
  }

  async function excluirTermo(id) {
    const confirmado = window.confirm('Você realmente quer eliminar permanentemente este termo de consentimento?')
    if (!confirmado) return
    await supabase.from('consent_forms').delete().eq('id', id)
    fetchDados()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Consultar termos de consentimento"
          botoes={<>
            <button onClick={() => navigate('/consentimentos')} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />

        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Filtros de pesquisa
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome do tutor</label>
              <input type="text" value={filtroTutor} onChange={e => setFiltroTutor(e.target.value)} placeholder="Ex: Angela..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nome do pet</label>
              <input type="text" value={filtroPet} onChange={e => setFiltroPet(e.target.value)} placeholder="Ex: Honey..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data de</label>
              <input type="date" value={filtroDataDe} onChange={e => setFiltroDataDe(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data até</label>
              <input type="date" value={filtroDataAte} onChange={e => setFiltroDataAte(e.target.value)} style={inputStyle} />
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
            {loading ? 'A carregar...' : `${resultados.length} termo${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}`}
          </div>
          {!loading && resultados.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 14 }}>Nenhum termo encontrado</div>
          )}
          {resultados.map((t, i) => (
            <div key={t.id} style={{
              padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: i < resultados.length - 1 ? '1px solid #f0f0f0' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#222', marginBottom: 3 }}>
                  {t.paciente_nome || 'Sem nome'}
                  {t.status === 'rascunho' && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#FAEEDA', color: '#854F0B', fontWeight: 500, marginLeft: 8 }}>
                      rascunho
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>
                  {t.tutor_nome} · {formatarData(t.data)}
                  {t.procedimento && <span> · {t.procedimento.slice(0, 40)}{t.procedimento.length > 40 ? '…' : ''}</span>}
                  {isGodMode && t.vet_nome && <span style={{ color: '#534AB7', fontWeight: 600 }}> · {t.vet_nome}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => navigate(`/consentimentos/${t.id}`)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #AFA9EC', background: '#EEEDFE', color: '#534AB7', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>👁 Ver</button>
                <button onClick={() => navigate(`/consentimentos/editar/${t.id}`)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 12, cursor: 'pointer' }}>✏️ Editar</button>
                <button onClick={() => excluirTermo(t.id)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #F0997B', background: '#FAECE7', color: '#993C1D', fontSize: 12, cursor: 'pointer' }}>🗑 Excluir</button>
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
