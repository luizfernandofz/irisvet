import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase } from '../lib/supabase'
import { calcularIdade } from '../lib/utils'
import Header from '../components/Header'
import SignaturePad from '../components/SignaturePad'
import MedicamentoBloco from '../components/MedicamentoBloco'
import {
  RECOMENDACOES_OPCOES, novoMedicamento, composerFraseMedicamento,
} from '../lib/receituarioOptions'

const ESPECIES = [
  { value: 'canino', label: '🐕 Canino' }, { value: 'felino', label: '🐈 Felino' },
  { value: 'roedor', label: '🐇 Roedor' }, { value: 'equino', label: '🐴 Equino' },
  { value: 'ave', label: '🦜 Ave' }, { value: 'outro', label: 'Outro' },
]
const GENEROS = [{ value: 'macho', label: 'Macho' }, { value: 'femea', label: 'Fêmea' }]

function normalizar(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export default function NovoReceituario() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const [modo, setModo] = useState(patientId ? 'form' : 'escolha')
  const [locked, setLocked] = useState(false)
  const [revisao, setRevisao] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [mostrarAssinatura, setMostrarAssinatura] = useState(false)

  const [buscaPacientes, setBuscaPacientes] = useState([])
  const [termoBusca, setTermoBusca] = useState('')

  const [dados, setDados] = useState({
    tutor_id: null, paciente_id: null,
    tutor_nome: '', tutor_telefone: '', tutor_email: '', tutor_nif: '',
    paciente_nome: '', paciente_especie: '', paciente_raca: '', paciente_genero: '', paciente_nascimento: '',
    data: new Date().toISOString().split('T')[0],
  })
  const [medicamentos, setMedicamentos] = useState([novoMedicamento()])
  const [recomendacoes, setRecomendacoes] = useState([])
  const [comentariosAdicionais, setComentariosAdicionais] = useState('')

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
          tutor_email: p.tutors?.email || '', tutor_nif: p.tutors?.nif || '',
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
    supabase.from('patients').select('*, tutors (*)').eq('id', p.id).single().then(({ data: full }) => {
      if (full) {
        setDados(d => ({
          ...d,
          paciente_genero: full.genero || '', paciente_nascimento: full.data_nascimento || '',
          tutor_email: full.tutors?.email || '', tutor_nif: full.tutors?.nif || '',
        }))
      }
    })
    setLocked(true)
    setModo('form')
  }

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

  async function usarAssinaturaPredefinida() {
    setErro(null)
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.storage.from('signatures').download(`${session.user.id}/assinatura.png`)
    if (error || !data) {
      setErro('Ainda não definiste uma assinatura pré-definida. Podes criar uma em "Meu Perfil".')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => handleGravar(reader.result)
    reader.readAsDataURL(data)
  }

  async function handleGravar(assinaturaBase64) {
    setSalvando(true)
    setErro(null)
    try {
      let tutor_id = dados.tutor_id
      let paciente_id = dados.paciente_id

      if (!locked) {
        const { data: tutor, error: tutorErr } = await supabase.from('tutors').insert({
          nome: dados.tutor_nome, telefone: dados.tutor_telefone,
          email: dados.tutor_email, nif: dados.tutor_nif,
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

      const { data: rec, error: recErr } = await supabase.from('receituarios').insert({
        patient_id: paciente_id,
        data: dados.data,
        idade_no_receituario: calcularIdade(dados.paciente_nascimento),
        medicamentos,
        recomendacoes,
        comentarios_adicionais: comentariosAdicionais,
        assinatura_base64: assinaturaBase64,
        status: 'finalizado',
      }).select().single()
      if (recErr) throw recErr

      navigate(`/receituarios/${rec.id}`)
    } catch (err) {
      console.error(err)
      setErro('Erro ao guardar. Verifica a ligação e tenta novamente.')
      setRevisao(false)
    } finally {
      setSalvando(false)
    }
  }

  const lockedStyle = { ...inputStyle, background: '#f0f0f0', color: '#888', cursor: 'not-allowed' }

  if (modo === 'escolha') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Header subtitulo="Novo receituário" botoes={<button onClick={() => navigate('/receituarios')} style={btnNav}>← Voltar</button>} />
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
          <Header subtitulo="Seleccionar paciente" botoes={<button onClick={() => setModo('escolha')} style={btnNav}>← Voltar</button>} />
          <input type="text" value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
            placeholder="Pesquisar por nome do pet ou do tutor..." style={{ ...inputStyle, marginBottom: 16 }} />
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', overflow: 'hidden' }}>
            {resultadosBusca.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 14 }}>Nenhum paciente encontrado</div>
            )}
            {resultadosBusca.map((p, i) => (
              <div key={p.id} onClick={() => selecionarPaciente(p)} style={{ padding: '14px 20px', cursor: 'pointer', borderBottom: i < resultadosBusca.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{p.tutor_nome}{p.raca ? ` · ${p.raca}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (revisao) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Header subtitulo="Rever receituário" botoes={<button onClick={() => setRevisao(false)} style={btnNav}>← Voltar a editar</button>} />
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Paciente e Responsável</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8 }}>
              <strong>{dados.paciente_nome}</strong> ({dados.paciente_especie}{dados.paciente_raca ? `, ${dados.paciente_raca}` : ''}) ·
              {' '}{calcularIdade(dados.paciente_nascimento) || 'idade não indicada'} · Tutor: {dados.tutor_nome}
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Medicações</div>
            {medicamentos.map((med, i) => (
              <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < medicamentos.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#534AB7' }}>{i + 1}) {med.medicacao || '(sem nome)'} {med.uso ? `— ${med.uso}` : ''}</div>
                <div style={{ fontSize: 13, color: '#333', marginTop: 4 }}>{composerFraseMedicamento(med) || '(posologia incompleta)'}</div>
                {med.comentario && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{med.comentario}</div>}
              </div>
            ))}
          </div>
          {(recomendacoes.length > 0 || comentariosAdicionais) && (
            <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
              {recomendacoes.length > 0 && (
                <>
                  <div style={sectionTitle}>Recomendações</div>
                  <ul style={{ fontSize: 13, color: '#333', paddingLeft: 20, marginBottom: 16 }}>
                    {recomendacoes.map(r => <li key={r}>{r}</li>)}
                  </ul>
                </>
              )}
              {comentariosAdicionais && (
                <>
                  <div style={sectionTitle}>Comentários Adicionais</div>
                  <div style={{ fontSize: 13, color: '#333' }}>{comentariosAdicionais}</div>
                </>
              )}
            </div>
          )}
          {erro && <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{erro}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
            <button onClick={() => setMostrarAssinatura(true)} disabled={salvando} style={{
              padding: '14px', borderRadius: 10, border: 'none',
              background: salvando ? '#a9a4e8' : '#1D9E75', color: 'white',
              fontSize: 15, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer',
            }}>
              ✍️ Assinar Manualmente
            </button>
            <button onClick={usarAssinaturaPredefinida} disabled={salvando} style={{
              padding: '14px', borderRadius: 10, border: 'none',
              background: salvando ? '#a9a4e8' : '#534AB7', color: 'white',
              fontSize: 15, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer',
            }}>
              {salvando ? 'A guardar...' : '🖼️ Usar Assinatura Pré-definida'}
            </button>
          </div>
          {mostrarAssinatura && (
            <SignaturePad
              onCancel={() => setMostrarAssinatura(false)}
              onConfirm={(dataUrl) => { setMostrarAssinatura(false); handleGravar(dataUrl) }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Novo receituário"
          botoes={<>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            <button onClick={() => navigate('/receituarios')} style={btnNav}>← Voltar</button>
          </>}
        />

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
          <div style={sectionTitle}>
            Responsável {locked && <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>— campos bloqueados</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input type="text" value={dados.tutor_nome} onChange={e => set('tutor_nome', e.target.value)} style={locked ? lockedStyle : inputStyle} readOnly={locked} required />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input type="text" value={dados.tutor_telefone} onChange={e => set('tutor_telefone', e.target.value)} style={locked ? lockedStyle : inputStyle} readOnly={locked} />
            </div>
            <div>
              <label style={labelStyle}>NIF / CPF</label>
              <input type="text" value={dados.tutor_nif} onChange={e => set('tutor_nif', e.target.value)} style={locked ? lockedStyle : inputStyle} readOnly={locked} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={dados.tutor_email} onChange={e => set('tutor_email', e.target.value)} style={locked ? lockedStyle : inputStyle} readOnly={locked} />
            </div>
          </div>

          <div style={sectionTitle}>
            Paciente {locked && <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>— campos bloqueados</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nome do paciente</label>
              <input type="text" value={dados.paciente_nome} onChange={e => set('paciente_nome', e.target.value)} style={locked ? lockedStyle : inputStyle} readOnly={locked} required />
            </div>
            <div>
              <label style={labelStyle}>Espécie</label>
              <select value={dados.paciente_especie} onChange={e => set('paciente_especie', e.target.value)} style={locked ? lockedStyle : inputStyle} disabled={locked}>
                <option value="">Seleccionar...</option>
                {ESPECIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Raça</label>
              <input type="text" value={dados.paciente_raca} onChange={e => set('paciente_raca', e.target.value)} style={locked ? lockedStyle : inputStyle} readOnly={locked} />
            </div>
            <div>
              <label style={labelStyle}>Género</label>
              <select value={dados.paciente_genero} onChange={e => set('paciente_genero', e.target.value)} style={locked ? lockedStyle : inputStyle} disabled={locked}>
                <option value="">Seleccionar...</option>
                {GENEROS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Data de nascimento</label>
              <input type="date" value={dados.paciente_nascimento} onChange={e => set('paciente_nascimento', e.target.value)} style={locked ? lockedStyle : inputStyle} readOnly={locked} />
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

        <button
          onClick={() => {
            if (!dados.tutor_nome || !dados.paciente_nome) { setErro('Preenche pelo menos o nome do responsável e do paciente.'); return }
            setErro(null)
            setRevisao(true)
          }}
          style={{
            width: '100%', padding: '14px', borderRadius: 10, border: 'none',
            background: '#534AB7', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 40,
          }}
        >
          👁 Visualizar Receituário
        </button>
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
const cardBtnStyle = { padding: '32px 20px', borderRadius: 16, border: 'none', background: 'white', boxShadow: '0 2px 16px rgba(83,74,183,0.08)', cursor: 'pointer', textAlign: 'center' }
