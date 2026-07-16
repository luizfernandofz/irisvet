import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase } from '../lib/supabase'
import { calcularIdade } from '../lib/utils'
import Header from '../components/Header'

const ESPECIES = [
  { value: 'canino', label: '🐕 Canino' },
  { value: 'felino', label: '🐈 Felino' },
  { value: 'roedor', label: '🐇 Roedor' },
  { value: 'equino', label: '🐴 Equino' },
  { value: 'ave', label: '🦜 Ave' },
  { value: 'outro', label: 'Outro' },
]

const GENEROS = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
]

function normalizar(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export default function NovoConsentimento() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const [modo, setModo] = useState(patientId ? 'form' : 'escolha')
  const [locked, setLocked] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const [buscaPacientes, setBuscaPacientes] = useState([])
  const [termoBusca, setTermoBusca] = useState('')

  const [dados, setDados] = useState({
    tutor_id: null, paciente_id: null,
    tutor_nome: '', tutor_telefone: '', tutor_email: '', tutor_nif: '', tutor_morada: '',
    paciente_nome: '', paciente_especie: '', paciente_raca: '', paciente_genero: '', paciente_nascimento: '',
    data: new Date().toISOString().split('T')[0],
    procedimento: '', valor: '', observacoes: '',
  })

  function set(campo, valor) {
    setDados(d => ({ ...d, [campo]: valor }))
  }

  useEffect(() => {
    if (!patientId) return
    async function fetchPaciente() {
      const { data: p } = await supabase.from('patients').select('*, tutors (*)').eq('id', patientId).single()
      if (p) {
        setDados(d => ({
          ...d,
          paciente_id: p.id, tutor_id: p.tutors?.id || null,
          paciente_nome: p.nome || '', paciente_especie: p.especie || '', paciente_raca: p.raca || '',
          paciente_genero: p.genero || '', paciente_nascimento: p.data_nascimento || '',
          tutor_nome: p.tutors?.nome || '', tutor_telefone: p.tutors?.telefone || '',
          tutor_email: p.tutors?.email || '', tutor_nif: p.tutors?.nif || '', tutor_morada: p.tutors?.morada || '',
        }))
        setLocked(true)
      }
    }
    fetchPaciente()
  }, [patientId])

  async function buscarPacientesExistentes() {
    const { data } = await supabase.from('patients').select('id, nome, especie, raca, tutors (id, nome, telefone)').order('nome')
    setBuscaPacientes((data || []).map(p => ({
      ...p, tutor_nome: p.tutors?.nome || '', _norm: normalizar(`${p.nome} ${p.tutors?.nome || ''}`),
    })))
    setModo('busca')
  }

  const resultadosBusca = termoBusca.trim()
    ? (() => {
        const termo = normalizar(termoBusca)
        const fuse = new Fuse(buscaPacientes, { keys: ['_norm'], threshold: 0.4 })
        const r = fuse.search(termo)
        return r.length > 0 ? r.map(x => x.item) : buscaPacientes.filter(p => p._norm.includes(termo))
      })()
    : buscaPacientes

  function selecionarPaciente(p) {
    setDados(d => ({
      ...d, paciente_id: p.id, tutor_id: p.tutors?.id || null,
      paciente_nome: p.nome || '', paciente_especie: p.especie || '', paciente_raca: p.raca || '',
      tutor_nome: p.tutors?.nome || '', tutor_telefone: p.tutors?.telefone || '',
    }))
    // dados adicionais (email, nif, morada, nascimento, genero) — buscar ficha completa
    supabase.from('patients').select('*, tutors (*)').eq('id', p.id).single().then(({ data: full }) => {
      if (full) {
        setDados(d => ({
          ...d,
          paciente_genero: full.genero || '', paciente_nascimento: full.data_nascimento || '',
          tutor_email: full.tutors?.email || '', tutor_nif: full.tutors?.nif || '', tutor_morada: full.tutors?.morada || '',
        }))
      }
    })
    setLocked(true)
    setModo('form')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      let tutor_id = dados.tutor_id
      let paciente_id = dados.paciente_id

      if (!locked) {
        const { data: tutor, error: tutorErr } = await supabase.from('tutors').insert({
          nome: dados.tutor_nome, telefone: dados.tutor_telefone,
          email: dados.tutor_email, nif: dados.tutor_nif, morada: dados.tutor_morada,
        }).select().single()
        if (tutorErr) throw tutorErr
        tutor_id = tutor.id

        const { data: paciente, error: pacienteErr } = await supabase.from('patients').insert({
          tutor_id, nome: dados.paciente_nome, especie: dados.paciente_especie || null,
          raca: dados.paciente_raca, genero: dados.paciente_genero || null,
          data_nascimento: dados.paciente_nascimento || null,
        }).select().single()
        if (pacienteErr) throw pacienteErr
        paciente_id = paciente.id
      }

      const { data: termo, error: termoErr } = await supabase.from('consent_forms').insert({
        patient_id: paciente_id,
        data: dados.data,
        procedimento: dados.procedimento,
        valor: dados.valor,
        idade_no_termo: calcularIdade(dados.paciente_nascimento),
        observacoes: dados.observacoes,
        status: 'finalizado',
      }).select().single()
      if (termoErr) throw termoErr

      navigate(`/consentimentos/${termo.id}`)
    } catch (err) {
      console.error(err)
      setErro('Erro ao guardar. Verifica a ligação e tenta novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const lockedStyle = { ...inputStyle, background: '#f0f0f0', color: '#888', cursor: 'not-allowed' }

  if (modo === 'escolha') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Header
            subtitulo="Novo termo de consentimento"
            botoes={<button onClick={() => navigate('/consentimentos')} style={btnNav}>← Voltar</button>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button onClick={() => { setLocked(false); setModo('form') }} style={cardBtnStyle}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🐾</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>Novo Paciente</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Preencher tudo do zero</div>
            </button>
            <button onClick={buscarPacientesExistentes} style={cardBtnStyle}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>Paciente já Cadastrado</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Pré-preencher com dados existentes</div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (modo === 'busca') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Header
            subtitulo="Seleccionar paciente"
            botoes={<button onClick={() => setModo('escolha')} style={btnNav}>← Voltar</button>}
          />
          <input
            type="text" value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
            placeholder="Pesquisar por nome do pet ou do tutor..."
            style={{ ...inputStyle, marginBottom: 16 }}
          />
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', overflow: 'hidden' }}>
            {resultadosBusca.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 14 }}>Nenhum paciente encontrado</div>
            )}
            {resultadosBusca.map((p, i) => (
              <div key={p.id} onClick={() => selecionarPaciente(p)} style={{
                padding: '14px 20px', cursor: 'pointer',
                borderBottom: i < resultadosBusca.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{p.tutor_nome}{p.raca ? ` · ${p.raca}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Novo termo de consentimento"
          botoes={<>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            <button onClick={() => navigate('/consentimentos')} style={btnNav}>← Voltar</button>
          </>}
        />

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>
              Cliente (Tutor)
              {locked && <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>— campos bloqueados</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input type="text" value={dados.tutor_nome} onChange={e => set('tutor_nome', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} readOnly={locked} required />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input type="text" value={dados.tutor_telefone} onChange={e => set('tutor_telefone', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} readOnly={locked} />
              </div>
              <div>
                <label style={labelStyle}>CPF / NIF</label>
                <input type="text" value={dados.tutor_nif} onChange={e => set('tutor_nif', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} readOnly={locked} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={dados.tutor_email} onChange={e => set('tutor_email', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} readOnly={locked} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Endereço</label>
                <input type="text" value={dados.tutor_morada} onChange={e => set('tutor_morada', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} readOnly={locked} />
              </div>
            </div>

            <div style={sectionTitle}>
              Paciente
              {locked && <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>— campos bloqueados</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome do animal</label>
                <input type="text" value={dados.paciente_nome} onChange={e => set('paciente_nome', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} readOnly={locked} required />
              </div>
              <div>
                <label style={labelStyle}>Espécie</label>
                <select value={dados.paciente_especie} onChange={e => set('paciente_especie', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} disabled={locked}>
                  <option value="">Seleccionar...</option>
                  {ESPECIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Raça</label>
                <input type="text" value={dados.paciente_raca} onChange={e => set('paciente_raca', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} readOnly={locked} />
              </div>
              <div>
                <label style={labelStyle}>Género</label>
                <select value={dados.paciente_genero} onChange={e => set('paciente_genero', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} disabled={locked}>
                  <option value="">Seleccionar...</option>
                  {GENEROS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Data de nascimento</label>
                <input type="date" value={dados.paciente_nascimento} onChange={e => set('paciente_nascimento', e.target.value)}
                  style={locked ? lockedStyle : inputStyle} readOnly={locked} />
              </div>
              <div>
                <label style={labelStyle}>Idade (calculada)</label>
                <div style={{ ...inputStyle, background: '#f0f0f0', color: dados.paciente_nascimento ? '#1D9E75' : '#aaa' }}>
                  {calcularIdade(dados.paciente_nascimento) || 'Preenche a data de nascimento'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Dados da Cirurgia</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Data</label>
                <input type="date" value={dados.data} onChange={e => set('data', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valor</label>
                <input type="text" value={dados.valor} onChange={e => set('valor', e.target.value)} placeholder="Ex: R$ 1.500,00" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Procedimento</label>
              <textarea value={dados.procedimento} onChange={e => set('procedimento', e.target.value)}
                placeholder="Descreve o procedimento cirúrgico proposto..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={labelStyle}>Observações</label>
              <textarea value={dados.observacoes} onChange={e => set('observacoes', e.target.value)}
                placeholder="Ex: Exames sem alterações, paciente liberado para procedimento cirúrgico e anestésico."
                rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
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
            {salvando ? 'A guardar...' : '✓ Gerar Termo de Consentimento'}
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
const cardBtnStyle = {
  padding: '32px 20px', borderRadius: 16, border: 'none', background: 'white',
  boxShadow: '0 2px 16px rgba(83,74,183,0.08)', cursor: 'pointer', textAlign: 'center',
}
