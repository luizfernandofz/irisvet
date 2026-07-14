import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase } from '../lib/supabase'
import { formatarData } from '../lib/utils'

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

const TIPO_BADGE = {
  'Consulta': { bg: '#EEEDFE', color: '#534AB7', border: '#AFA9EC' },
  'Retorno/Reavaliação': { bg: '#E1F5EE', color: '#0F6E56', border: '#5DCAA5' },
  'Exame Complementar': { bg: '#E6F1FB', color: '#185FA5', border: '#85B7EB' },
  'Intervenção': { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
}

function normalizar(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function badgeStyle(tipo) {
  const s = TIPO_BADGE[tipo] || { bg: '#f0f0f0', color: '#555', border: '#ccc' }
  return {
    fontSize: 10, padding: '2px 8px', borderRadius: 20,
    background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    fontWeight: 600, whiteSpace: 'nowrap'
  }
}

export default function Consultar() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTutor, setFiltroTutor] = useState('')
  const [filtroTelefone, setFiltroTelefone] = useState('')
  const [filtroPet, setFiltroPet] = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState('')
  const [filtroDataDe, setFiltroDataDe] = useState('')
  const [filtroDataAte, setFiltroDataAte] = useState('')
  const [resultados, setResultados] = useState([])

  useEffect(() => {
    async function fetchDados() {
      setLoading(true)

      // Buscar pacientes com todas as suas consultas e reavaliações
      const { data: patients } = await supabase
        .from('patients')
        .select(`
          id, nome, especie, raca,
          tutors ( id, nome, telefone ),
          consultations ( id, data, tipo_atendimento, status ),
          follow_ups ( id, data, tipo_atendimento )
        `)
        .order('nome')

      const formatados = (patients || []).map(p => {
        const consultas = (p.consultations || []).map(c => ({
          id: c.id,
          tipo: c.tipo_atendimento || 'Consulta',
          data: c.data,
          status: c.status,
          tabela: 'consultations',
        }))
        const reavs = (p.follow_ups || []).map(f => ({
          id: f.id,
          tipo: f.tipo_atendimento || 'Retorno/Reavaliação',
          data: f.data,
          status: 'finalizada',
          tabela: 'follow_ups',
        }))
        const todasFichas = [...consultas, ...reavs].sort((a, b) => b.data.localeCompare(a.data))
        const ultimaData = todasFichas[0]?.data || ''

        return {
          id: p.id,
          nome: p.nome || '',
          especie: p.especie || '',
          raca: p.raca || '',
          tutor_nome: p.tutors?.nome || '',
          tutor_telefone: p.tutors?.telefone || '',
          fichas: todasFichas,
          ultimaData,
          _nome_norm: normalizar(p.nome),
          _tutor_norm: normalizar(p.tutors?.nome),
          _telefone_norm: normalizar(p.tutors?.telefone),
        }
      })

      // Ordenar por data mais recente
      formatados.sort((a, b) => b.ultimaData.localeCompare(a.ultimaData))

      setPacientes(formatados)
      setResultados(formatados)
      setLoading(false)
    }
    fetchDados()
  }, [])

  useEffect(() => {
    let lista = [...pacientes]

    if (filtroEspecie) lista = lista.filter(p => p.especie === filtroEspecie)

    if (filtroDataDe) lista = lista.filter(p => p.ultimaData >= filtroDataDe)
    if (filtroDataAte) lista = lista.filter(p => p.ultimaData <= filtroDataAte)

    if (filtroTutor.trim()) {
      const termo = normalizar(filtroTutor)
      const fuse = new Fuse(lista, { keys: ['_tutor_norm'], threshold: 0.4 })
      const r = fuse.search(termo)
      lista = r.length > 0 ? r.map(x => x.item) : lista.filter(p => p._tutor_norm.includes(termo))
    }

    if (filtroTelefone.trim()) {
      const termo = normalizar(filtroTelefone)
      lista = lista.filter(p => p._telefone_norm.includes(termo))
    }

    if (filtroPet.trim()) {
      const termo = normalizar(filtroPet)
      const fuse = new Fuse(lista, { keys: ['_nome_norm'], threshold: 0.4 })
      const r = fuse.search(termo)
      lista = r.length > 0 ? r.map(x => x.item) : lista.filter(p => p._nome_norm.includes(termo))
    }

    setResultados(lista)
  }, [filtroTutor, filtroTelefone, filtroPet, filtroEspecie, filtroDataDe, filtroDataAte, pacientes])

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
            <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7', cursor: 'pointer' }}
              onClick={() => navigate('/')}>írisvet</div>
            <div style={{ fontSize: 13, color: '#888' }}>Localizar paciente</div>
          </div>
          <button onClick={() => navigate('/')} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
            background: 'white', color: '#555', fontSize: 13, cursor: 'pointer'
          }}>🏠 Home</button>
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
              <input type="text" value={filtroTutor} onChange={e => setFiltroTutor(e.target.value)}
                placeholder="Ex: Angela..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input type="text" value={filtroTelefone} onChange={e => setFiltroTelefone(e.target.value)}
                placeholder="Ex: 911..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nome do pet</label>
              <input type="text" value={filtroPet} onChange={e => setFiltroPet(e.target.value)}
                placeholder="Ex: Honey..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Espécie</label>
              <select value={filtroEspecie} onChange={e => setFiltroEspecie(e.target.value)} style={inputStyle}>
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
          }}>Limpar filtros</button>
        </div>

        {/* RESULTADOS */}
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 2px 16px rgba(83,74,183,0.08)', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#888' }}>
            {loading ? 'A carregar...' : `${resultados.length} paciente${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}`}
          </div>

          {!loading && resultados.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 14 }}>
              Nenhum paciente encontrado
            </div>
          )}

          {resultados.map((paciente, i) => (
            <PacienteRow
              key={paciente.id}
              paciente={paciente}
              ultimo={i === resultados.length - 1}
              navigate={navigate}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

function PacienteRow({ paciente, ultimo, navigate }) {
  const [aberto, setAberto] = useState(false)
  const emoji = ESPECIE_EMOJI[paciente.especie] || ''

  return (
    <div style={{ borderBottom: ultimo ? 'none' : '1px solid #f0f0f0' }}>
      {/* LINHA DO ANIMAL */}
      <div style={{
        padding: '16px 24px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        background: aberto ? '#f9f8ff' : 'white'
      }}>
        <div
          onClick={() => setAberto(a => !a)}
          style={{ flex: 1, cursor: 'pointer' }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#222', marginBottom: 3 }}>
            {emoji} {paciente.nome || 'Sem nome'}
            {paciente.raca ? <span style={{ fontSize: 13, fontWeight: 400, color: '#888' }}> · {paciente.raca}</span> : null}
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            {paciente.tutor_nome}
            {paciente.fichas.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#aaa' }}>
                · {paciente.fichas.length} ficha{paciente.fichas.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate(`/nova-consulta/${paciente.id}`)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid #534AB7',
              background: '#EEEDFE', color: '#534AB7', fontSize: 12,
              fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >+ Nova Consulta</button>
          <div
            onClick={() => setAberto(a => !a)}
            style={{ fontSize: 18, color: '#aaa', cursor: 'pointer', padding: '0 4px' }}
          >{aberto ? '▲' : '▼'}</div>
        </div>
      </div>

      {/* FICHAS DO ANIMAL */}
      {aberto && (
        <div style={{ background: '#f9f8ff', borderTop: '1px solid #eee' }}>
          {paciente.fichas.length === 0 ? (
            <div style={{ padding: '16px 24px', fontSize: 13, color: '#bbb' }}>
              Sem fichas registadas
            </div>
          ) : (
            paciente.fichas.map((ficha, i) => (
              <div key={ficha.id} style={{
                padding: '12px 24px 12px 40px',
                borderBottom: i < paciente.fichas.length - 1 ? '1px solid #eee' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={badgeStyle(ficha.tipo)}>{ficha.tipo}</span>
                  <span style={{ fontSize: 13, color: '#555' }}>{formatarData(ficha.data)}</span>
                  {ficha.status === 'rascunho' && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#FAEEDA', color: '#854F0B', fontWeight: 500 }}>
                      rascunho
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => ficha.tabela === 'consultations'
                      ? navigate(`/consulta/${ficha.id}`)
                      : navigate(`/consulta/${ficha.id}?tipo=reav`)
                    }
                    style={{
                      padding: '6px 12px', borderRadius: 7, border: '1px solid #AFA9EC',
                      background: '#EEEDFE', color: '#534AB7', fontSize: 12, fontWeight: 500, cursor: 'pointer'
                    }}
                  >👁 Ver</button>
                  {ficha.tabela === 'consultations' && (
                    <button
                      onClick={() => navigate(`/editar/${ficha.id}`)}
                      style={{
                        padding: '6px 12px', borderRadius: 7, border: '1px solid #ddd',
                        background: 'white', color: '#555', fontSize: 12, cursor: 'pointer'
                      }}
                    >✏️ Editar</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #ddd', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit', color: '#222'
}
