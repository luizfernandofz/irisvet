import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AutoTextarea from './AutoTextarea'
import { calcularIdade } from '../lib/utils'

const TIPOS_ATENDIMENTO = [
  'Consulta',
  'Retorno/Reavaliação',
  'Exame Complementar',
  'Intervenção',
]

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

export default function Sessao1e2({ dados, onChange, locked = false }) {
  const [clinicas, setClinicas] = useState([])
  const [showClinicas, setShowClinicas] = useState(false)

  useEffect(() => {
    async function fetchClinicas() {
      const { data } = await supabase
        .from('consultations')
        .select('local')
        .not('local', 'is', null)
      if (data) {
        const unicas = [...new Set(data.map(d => d.local).filter(Boolean))]
        setClinicas(unicas)
      }
    }
    fetchClinicas()
  }, [])

  function set(campo, valor) {
    onChange({ ...dados, [campo]: valor })
  }

  const clinicasFiltradas = clinicas.filter(c =>
    c.toLowerCase().includes((dados.local || '').toLowerCase())
  )

  const idade = calcularIdade(dados.paciente_nascimento)

  const lockedStyle = {
    ...inputStyle,
    background: '#f0f0f0',
    color: '#888',
    cursor: 'not-allowed',
  }

  return (
    <div>
      {/* DATA E LOCAL */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Consulta</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Data</label>
            <input
              type="date"
              value={dados.data || ''}
              onChange={e => set('data', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Local / Clínica</label>
            <input
              type="text"
              value={dados.local || ''}
              onChange={e => { set('local', e.target.value); setShowClinicas(true) }}
              onBlur={() => setTimeout(() => setShowClinicas(false), 150)}
              placeholder="Ex: ANIAID"
              style={inputStyle}
            />
            {showClinicas && clinicasFiltradas.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'white', border: '1px solid #ddd', borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: 2
              }}>
                {clinicasFiltradas.map(c => (
                  <div
                    key={c}
                    onMouseDown={() => { set('local', c); setShowClinicas(false) }}
                    style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid #f0f0f0' }}
                    onMouseEnter={e => e.target.style.background = '#f5f4fe'}
                    onMouseLeave={e => e.target.style.background = 'white'}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Tipo de atendimento</label>
            <select
              value={dados.tipo_atendimento || ''}
              onChange={e => set('tipo_atendimento', e.target.value)}
              style={inputStyle}
            >
              <option value="">Seleccionar...</option>
              {TIPOS_ATENDIMENTO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={dividerStyle} />

      {/* CLIENTE */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>
          Cliente (Tutor)
          {locked && <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>— campos bloqueados</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nome</label>
            <input type="text" value={dados.tutor_nome || ''} onChange={e => set('tutor_nome', e.target.value)}
              placeholder="Nome completo" style={locked ? lockedStyle : inputStyle} readOnly={locked} />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input type="text" value={dados.tutor_telefone || ''} onChange={e => set('tutor_telefone', e.target.value)}
              placeholder="Ex: 911234567" style={locked ? lockedStyle : inputStyle} readOnly={locked} />
          </div>
          <div>
            <label style={labelStyle}>NIF / CPF</label>
            <input type="text" value={dados.tutor_nif || ''} onChange={e => set('tutor_nif', e.target.value)}
              style={locked ? lockedStyle : inputStyle} readOnly={locked} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={dados.tutor_email || ''} onChange={e => set('tutor_email', e.target.value)}
              style={locked ? lockedStyle : inputStyle} readOnly={locked} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Morada</label>
            <input type="text" value={dados.tutor_morada || ''} onChange={e => set('tutor_morada', e.target.value)}
              style={locked ? lockedStyle : inputStyle} readOnly={locked} />
          </div>
        </div>
      </div>

      <div style={dividerStyle} />

      {/* PACIENTE */}
      <div>
        <div style={sectionTitleStyle}>
          Paciente
          {locked && <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>— campos bloqueados</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nome do animal</label>
            <input type="text" value={dados.paciente_nome || ''} onChange={e => set('paciente_nome', e.target.value)}
              placeholder="Ex: Honey" style={locked ? lockedStyle : inputStyle} readOnly={locked} />
          </div>
          <div>
            <label style={labelStyle}>Espécie</label>
            <select value={dados.paciente_especie || ''} onChange={e => set('paciente_especie', e.target.value)}
              style={locked ? lockedStyle : inputStyle} disabled={locked}>
              <option value="">Seleccionar...</option>
              {ESPECIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Raça</label>
            <input type="text" value={dados.paciente_raca || ''} onChange={e => set('paciente_raca', e.target.value)}
              style={locked ? lockedStyle : inputStyle} readOnly={locked} />
          </div>
          <div>
            <label style={labelStyle}>Género</label>
            <select value={dados.paciente_genero || ''} onChange={e => set('paciente_genero', e.target.value)}
              style={locked ? lockedStyle : inputStyle} disabled={locked}>
              <option value="">Seleccionar...</option>
              {GENEROS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Data de nascimento</label>
            <input type="date" value={dados.paciente_nascimento || ''} onChange={e => set('paciente_nascimento', e.target.value)}
              style={locked ? lockedStyle : inputStyle} readOnly={locked} />
          </div>
          <div>
            <label style={labelStyle}>Idade (calculada)</label>
            <div style={{
              ...inputStyle,
              background: '#f0f0f0',
              color: idade ? '#1D9E75' : '#aaa',
              fontWeight: idade ? 500 : 400,
              cursor: 'default'
            }}>
              {idade || 'Preenche a data de nascimento'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #ddd', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit',
  color: '#222'
}

const dividerStyle = {
  height: 1, background: '#f0f0f0', margin: '20px 0'
}

const sectionTitleStyle = {
  fontSize: 11, fontWeight: 600, color: '#534AB7',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12
}
