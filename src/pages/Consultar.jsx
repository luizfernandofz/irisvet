import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase } from '../lib/supabase'

const ESPECIE_EMOJI = {
  canino: '🐕', felino: '🐈', roedor: '🐇', equino: '🐴', ave: '🦜', outro: '',
}

const ESPECIES = [
  { value: '', label: 'Todas as espécies' },
  { value: 'canino', label: '🐕 Canino' },
  { value: 'felino', label: '🐈 Felino' },
  { value: 'roedor', label: '🐇 Roedor' },
  { value: 'equino', label: '🐴 Equino' },
  { value: 'ave', label: '🦜 Ave' },
  { value: 'outro', label: 'Outro' },
]

function normalizar(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function Consultar() {
  const navigate = useNavigate()
  const [fichas, setFichas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTutor, setFiltroTutor] = useState('')
  const [filtroTelefone, setFiltroTelefone] = useState('')
  const [filtroPet, setFiltroPet] = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState('')
  const [filtroDataDe, setFiltroDataDe] = useState('')
  const [filtroDataAte, setFiltroDataAte] = useState('')
  const [resultados, setResultados] = useState([])

  useEffect(() => {
    async function fetchFichas() {
      setLoading(true)
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id, data, local, tipo_atendimento, status,
          patients (
            id, nome, especie, raca,
            tutors ( id, nome, telefone )
          )
        `)
        .order('data', { ascending: false })

      if (error) { console.error(error); setLoading(false); return }

      const formatadas = (data || []).map(c => ({
        id: c.id,
        data: c.data,
        local: c.local,
        tipo_atendimento: c.tipo_atendimento,
        status: c.status,
        patient_id: c.patients?.id,
        pet_nome: c.patients?.nome || '',
        pet_especie: c.patients?.especie || '',
        pet_raca: c.patients?.raca || '',
        tutor_nome: c.patients?.tutors?.nome || '',
        tutor_telefone: c.patients?.tutors?.telefone || '',
        tutor_id: c.patients?.tutors?.id,
        // campos normalizados para pesquisa
        _tutor_norm: normalizar(c.patients?.tutors?.nome),
        _pet_norm: normalizar(c.patients?.nome),
        _telefone_norm: normalizar(c.patients?.tutors?.telefone),
      }))

      setFichas(formatadas)
      setResultados(formatadas)
      setLoading(false)
    }
    fetchFichas()
  }, [])

  useEffect(() => {
    let lista = [...fichas]

    // Filtro de espécie (exacto)
    if (filtroEspecie) {
      lista = lista.filter(f => f.pet_especie === filtroEspecie)
    }

    // Filtro de data
    if (filtroDataDe) lista = lista.filter(f => f.data >= filtroDataDe)
    if (filtroDataAte) lista = lista.filter(f => f.data <= filtroDataAte)

    // Fuzzy search por tutor (com normalização)
    if (filtroTutor.trim()) {
      const termo = normalizar(filtroTutor)
      const fuse = new Fuse(lista, {
        keys: ['_tutor_norm'],
        threshold: 0.4,
        includeScore: true,
        useExtendedSearch: false,
      })
      // Fuse já usa os campos normalizados
      const r = fuse.search(termo)
      // fallback: se fuse não encontrar, tenta includes simples
      if (r.length > 0) {
        lista = r.map(x => x.item)
      } else {
        lista = lista.filter(f => f._tutor_norm.includes(termo))
      }
    }

    // Fuzzy search por telefone
    if (filtroTelefone.trim()) {
      const termo = normalizar(filtroTelefone)
      lista = lista.filter(f => f._telefone_norm.includes(termo))
    }

    // Fuzzy search por pet (com normalização)
    if (filtroPet.trim()) {
      const termo = normalizar(filtroPet)
      const fuse = new Fuse(lista, {
        keys: ['_pet_norm'],
        threshold: 0.4,
      })
      const r = fuse.search(termo)
      if (r.length > 0) {
        lista = r.map(x => x.item)
      } else {
        lista = lista.filter(f => f._pet_norm.includes(termo))
      }
    }

    setResultados(lista)
  }, [filtroTutor, filtroTelefone, filtroPet, filtroEspecie, filtroDataDe, filtroDataAte, fichas])

  function limparFiltros() {
    setFiltroTutor('')
    setFiltroTelefone('')
    setFiltroPet('')
    setFiltroEspecie('')
    setFiltroDataDe('')
    setFiltroDataAte('')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* CABEÇALHO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7' }}>írisvet</div>
            <div style={{ fontSize: 13, color: '#888' }}>Consultar pacientes</div>
          </div>
          <button onClick={() => navigate('/')} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
            background: 'white', color: '#555', fontSize: 13, cursor: 'pointer'
          }}>← Voltar</button>
        </div>

        {/* FILTROS */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Filtros de pesquisa
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome do tutor</label>
              <input
                type="text" value={filtroTutor}
                onChange={e => setFiltroTutor(e.target.value)}
                placeholder="Ex: Angela..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input
                type="text" value={filtroTelefone}
                onChange={e => setFiltroTelefone(e.target.value)}
                placeholder="Ex: 911..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nome do pet</label>
              <input
                type="text" value={filtroPet}
                onChange={e => setFiltroPet(e.target.value)}
                placeholder="Ex: Honey..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Espécie</label>
              <select
                value={filtroEspecie}
                onChange={e => setFiltroEspecie(e.target.value)}
                style={inputStyle}
              >
                {ESPECIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
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
          </div>
          <button onClick={limparFiltros} style={{
            marginTop: 12, padding: '7px 16px', borderRadius: 8,
            border: '1px solid #ddd', background: 'white', color: '#888',
            fontSize: 12, cursor: 'pointer'
          }}>
            Limpar filtros
          </button>
        </div>

        {/* RESULTADOS */}
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 2px 16px rgba(83,74,183,0.08)', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#888' }}>
            {loading ? 'A carregar...' : `${resultados.length} ficha${resultados.length !== 1 ? 's' : ''} encontrada${resultados.length !== 1 ? 's' : ''}`}
          </div>

          {!loading && resultados.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 14 }}>
              Nenhuma ficha encontrada
            </div>
          )}

          {resultados.map((ficha, i) => (
            <FichaRow
              key={ficha.id}
              ficha={ficha}
              ultimo={i === resultados.length - 1}
              navigate={navigate}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

function FichaRow({ ficha, ultimo, navigate }) {
  const [aberto, setAberto] = useState(false)
  const emoji = ESPECIE_EMOJI[ficha.pet_especie] || ''

  return (
    <div style={{ borderBottom: ultimo ? 'none' : '1px solid #f0f0f0' }}>
      <div
        onClick={() => setAberto(a => !a)}
        style={{
          padding: '16px 24px', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          background: aberto ? '#f9f8ff' : 'white', transition: 'background 0.15s'
        }}
        onMouseEnter={e => { if (!aberto) e.currentTarget.style.background = '#fafafa' }}
        onMouseLeave={e => { if (!aberto) e.currentTarget.style.background = 'white' }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#222', marginBottom: 3 }}>
            {emoji} {ficha.pet_nome || 'Sem nome'}{' '}
            {ficha.pet_raca
              ? <span style={{ fontSize: 13, fontWeight: 400, color: '#888' }}>· {ficha.pet_raca}</span>
              : null}
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            {ficha.tutor_nome}{ficha.tutor_telefone ? ` · ${ficha.tutor_telefone}` : ''} · {ficha.data}
            {ficha.status === 'rascunho' && (
              <span style={{
                marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#FAEEDA', color: '#854F0B', fontWeight: 500
              }}>rascunho</span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#aaa' }}>{aberto ? '▲' : '▼'}</div>
      </div>

      {aberto && (
        <div style={{
          padding: '12px 24px 20px', background: '#f9f8ff',
          display: 'flex', gap: 10, flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate(`/consulta/${ficha.id}`)}
            style={btnStyle('#534AB7', '#EEEDFE')}
          >
            👁 Ver ficha
          </button>
          <button
            onClick={() => navigate(`/editar/${ficha.id}`)}
            style={btnStyle('#555', 'white')}
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => navigate(`/reavaliacao/${ficha.id}`)}
            style={btnStyle('#0F6E56', '#E1F5EE')}
          >
            ➕ Adicionar reavaliação
          </button>
        </div>
      )}
    </div>
  )
}

function btnStyle(color, bg) {
  return {
    padding: '9px 18px', borderRadius: 8, border: `1px solid ${color}`,
    background: bg, color: color, fontSize: 13, fontWeight: 500,
    cursor: 'pointer'
  }
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #ddd', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit', color: '#222'
}