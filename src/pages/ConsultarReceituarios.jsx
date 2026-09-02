import { useState, useEffect, useMemo } from 'react'
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
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function fetchDados() {
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
      setLoading(false)
    }
    fetchDados()
  }, [refreshKey])

  const resultados = useMemo(() => {
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
    return lista
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
    setLoading(true)
    setRefreshKey(k => k + 1)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Consultar receituários"
          botoes={<>
            <button onClick={() => navigate('/receituarios')} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />

        <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 24, boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
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
          <button onClick={limparFiltros} style={{ marginTop: 12, padding: '7px 16px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 12, cursor: 'pointer' }}>
            Limpar filtros
          </button>
        </div>

        <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, boxShadow: '0 2px 16px rgba(91,110,88,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--iv-line)', fontSize: 13, color: 'var(--iv-ink-muted)' }}>
            {loading ? 'A carregar...' : `${resultados.length} receituário${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}`}
          </div>
          {!loading && resultados.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--iv-ink-muted)', fontSize: 14 }}>Nenhum receituário encontrado</div>
          )}
          {resultados.map((r, i) => (
            <div key={r.id} style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < resultados.length - 1 ? '1px solid var(--iv-line)' : 'none' }}>
              <div>
                <div style={{ fontFamily: 'var(--iv-font-display)', fontSize: 17, fontWeight: 500, color: 'var(--iv-ink)', marginBottom: 3 }}>
                  {r.paciente_nome || 'Sem nome'}
                  {r.idade && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--iv-ink-muted)' }}> · {r.idade}</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--iv-ink-muted)' }}>
                  {r.tutor_nome}{r.tutor_nif ? ` · NIF ${r.tutor_nif}` : ''} · {formatarData(r.data)}
                  {isGodMode && r.vet_nome && <span style={{ color: 'var(--iv-sage)', fontWeight: 600 }}> · {r.vet_nome}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => navigate(`/receituarios/${r.id}`)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--iv-sage)', background: 'var(--iv-sage-light)', color: 'var(--iv-sage)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>👁 Ver</button>
                <button onClick={() => navigate(`/receituarios/editar/${r.id}`)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--iv-plum)', background: 'transparent', color: 'var(--iv-plum-dark)', fontSize: 12, cursor: 'pointer' }}>✏️ Editar</button>
                <button onClick={() => excluirReceituario(r.id)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--iv-plum)', background: 'var(--iv-plum-light)', color: 'var(--iv-plum-dark)', fontSize: 12, cursor: 'pointer' }}>🗑 Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--iv-line)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--iv-bg)', fontFamily: 'inherit', color: 'var(--iv-ink)' }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer' }
