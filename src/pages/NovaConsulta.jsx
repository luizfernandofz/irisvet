import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/ProgressBar'
import Sessao1e2 from '../components/Sessao1e2'
import Sessao3 from '../components/Sessao3'
import Sessao4 from '../components/Sessao4'
import Sessao5 from '../components/Sessao5'
import Sessao6 from '../components/Sessao6'
import Sessao7 from '../components/Sessao7'
import Revisao from '../components/Revisao'
import RevisaoReavaliacao from '../components/RevisaoReavaliacao'
import Header from '../components/Header'

// Formulário simplificado para Retorno/Reavaliação, Exame Complementar e Intervenção
import AutoTextarea from '../components/AutoTextarea'
import CamposFinanceiros from '../components/CamposFinanceiros'
import { TIPOS_ATENDIMENTO, TIPOS_SIMPLIFICADOS, configSimplificado } from '../lib/tiposAtendimento'
import { paraNumero } from '../lib/financeiro'

function FormularioReavaliacao({ dados, setDados, patientInfo, onGuardar, saving, erro, navigate }) {
  const [sessao, setSessao] = useState(1)
  const [followUpId, setFollowUpId] = useState(null)
  const [revisao, setRevisao] = useState(false)
  const config = configSimplificado(dados.tipo_atendimento)

  async function guardar() {
    const id = await onGuardar(followUpId)
    if (id) setFollowUpId(id)
    return id
  }

  async function avancar() {
    const id = await guardar()
    if (id) setSessao(s => s + 1)
  }

  async function finalizar() {
    const id = await guardar()
    if (id) {
      alert('Ficha guardada com sucesso!')
      navigate('/consultar')
    }
  }

  if (revisao) return (
    <RevisaoReavaliacao
      dados={dados}
      onChange={setDados}
      patientInfo={patientInfo}
      onEditar={() => setRevisao(false)}
      onFinalizar={finalizar}
      finalizing={saving}
      erro={erro}
      consultationId={followUpId}
      fkColumn="follow_up_id"
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
    <Header
      subtitulo={dados.tipo_atendimento || 'Retorno / Reavaliação'}
      botoes={<>
        <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
        <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar</button>
      </>}
    />

        {patientInfo && (
          <div style={{ background: 'var(--iv-sage-light)', borderRadius: 12, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: 'var(--iv-sage)' }}>
            <strong>{patientInfo.nome}</strong>
            {patientInfo.raca ? ` · ${patientInfo.raca}` : ''}
            {patientInfo.tutor ? ` · Tutor: ${patientInfo.tutor}` : ''}
          </div>
        )}

        {/* Progress simplificado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {['Dados', 'Clínico', 'Imagens'].map((label, i) => {
            const num = i + 1
            const done = num < sessao
            const active = num === sessao
            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done ? 'var(--iv-sage)' : active ? 'var(--iv-sage)' : 'var(--iv-line)',
                    color: done || active ? 'white' : 'var(--iv-ink-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600
                  }}>{done ? '✓' : num}</div>
                  <div style={{ fontSize: 10, color: active ? 'var(--iv-sage)' : done ? 'var(--iv-sage)' : 'var(--iv-ink-muted)' }}>{label}</div>
                </div>
                {i < 2 && <div style={{ width: 32, height: 2, background: done ? 'var(--iv-sage)' : 'var(--iv-line)', marginBottom: 16 }} />}
              </div>
            )
          })}
        </div>

        <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 32, boxShadow: '0 2px 16px rgba(91,110,88,0.08)' }}>

          {sessao === 1 && (
            <div>
              <div style={sectionTitle}>Dados da consulta</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Data</label>
                  <input type="date" value={dados.data}
                    onChange={e => setDados(d => ({ ...d, data: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Local / Clínica</label>
                  <input type="text" value={dados.local}
                    onChange={e => setDados(d => ({ ...d, local: e.target.value }))}
                    placeholder="Ex: ANIAID" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Tipo de atendimento</label>
                  <select value={dados.tipo_atendimento}
                    onChange={e => setDados(d => ({ ...d, tipo_atendimento: e.target.value }))}
                    style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_ATENDIMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <CamposFinanceiros
                  moeda={dados.moeda}
                  valor={dados.valor}
                  deslocamento={dados.deslocamento}
                  onChange={(campo, valor) => setDados(d => ({ ...d, [campo]: valor }))}
                />
              </div>
              <div>
                <label style={labelStyle}>{config.labelMotivo}</label>
                <AutoTextarea value={dados.motivo}
                  onChange={e => setDados(d => ({ ...d, motivo: e.target.value }))}
                  placeholder={config.placeholderMotivo} />
              </div>
            </div>
          )}

          {sessao === 2 && (
            <div>
              <div style={sectionTitle}>Avaliação clínica</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {config.campos.map(({ campo, label, placeholder }) => (
                  <div key={campo}>
                    <label style={labelStyle}>{label}</label>
                    <AutoTextarea value={dados[campo]}
                      onChange={e => setDados(d => ({ ...d, [campo]: e.target.value }))}
                      placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {sessao === 3 && (
            <div>
              <div style={sectionTitle}>Imagens</div>
              <Sessao7 dados={dados} onChange={setDados} consultationId={followUpId} fkColumn="follow_up_id" />
            </div>
          )}

          {erro && (
            <div style={{ background: 'var(--iv-plum-light)', color: 'var(--iv-plum-dark)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 16 }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--iv-line)' }}>
            <button
            onClick={() => sessao === 1 ? navigate(-1) : setSessao(s => s - 1)}
            style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 14, cursor: 'pointer' }}
          >
            ← Anterior
          </button>
            <span style={{ fontSize: 12, color: 'var(--iv-ink-muted)' }}>{saving ? '💾 A guardar...' : ''}</span>
            {sessao < 3 ? (
              <button onClick={avancar} disabled={saving}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: saving ? 0.55 : 1, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Próxima →
              </button>
            ) : (
              <button onClick={() => setRevisao(true)} disabled={saving}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: saving ? 0.55 : 1, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                👁 Rever ficha →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NovaConsulta() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const [sessao, setSessao] = useState(1)
  const [saving, setSaving] = useState(false)
  const [consultationId, setConsultationId] = useState(null)
  const [erro, setErro] = useState(null)
  const [revisao, setRevisao] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [patientInfo, setPatientInfo] = useState(null)
  const [patientLocked, setPatientLocked] = useState(false)

  const [dados, setDados] = useState({
    data: new Date().toISOString().split('T')[0],
    local: '',
    tipo_atendimento: '',
    moeda: '',
    valor: '',
    deslocamento: '',
    tutor_nome: '',
    tutor_telefone: '',
    tutor_nif: '',
    tutor_email: '',
    tutor_morada: '',
    paciente_nome: '',
    paciente_especie: '',
    paciente_raca: '',
    paciente_nascimento: '',
    paciente_genero: '',
    queixa_principal: '',
    sinais: {},
    trat_ocular_previo: '',
    diag_ocular_previo: '',
    aspecto_geral: '',
    doencas_pre: '',
    trat_sistemico: '',
    cirurgias: '',
    alimentacao: [],
    petisco: '',
    flags: {},
    exame_oftalmologico: {},
    diagnostico: '',
    tratamento: '',
    observacoes: '',
    imagens_OD: [],
    imagens_OE: [],
    // campos de reavaliação
    motivo: '',
    avaliacao: '',
  })

  // Se vier com patientId, pré-carregar dados do paciente
  useEffect(() => {
    if (!patientId) return
    async function fetchPatient() {
      const { data: p } = await supabase
        .from('patients')
        .select(`*, tutors (*)`)
        .eq('id', patientId)
        .single()
      if (p) {
        setPatientInfo({
          id: p.id,
          nome: p.nome,
          raca: p.raca,
          especie: p.especie,
          tutor: p.tutors?.nome,
        })
        setDados(d => ({
          ...d,
          paciente_nome: p.nome || '',
          paciente_especie: p.especie || '',
          paciente_raca: p.raca || '',
          paciente_nascimento: p.data_nascimento || '',
          paciente_genero: p.genero || '',
          paciente_id: p.id,
          tutor_nome: p.tutors?.nome || '',
          tutor_telefone: p.tutors?.telefone || '',
          tutor_nif: p.tutors?.nif || '',
          tutor_email: p.tutors?.email || '',
          tutor_morada: p.tutors?.morada || '',
          tutor_id: p.tutors?.id || null,
        }))
        setPatientLocked(true)
      }
    }
    fetchPatient()
  }, [patientId])

  const isSimplificado = TIPOS_SIMPLIFICADOS.includes(dados.tipo_atendimento)

  // Guardar retorno/reavaliação, exame complementar ou intervenção (follow_up)
  async function guardarReavaliacao(followUpId) {
    setSaving(true)
    setErro(null)
    try {
      const payload = {
        patient_id: patientId || dados.paciente_id || null,
        consultation_id: null,
        data: dados.data,
        local: dados.local,
        tipo_atendimento: dados.tipo_atendimento,
        moeda: dados.moeda || null,
        valor: paraNumero(dados.valor),
        deslocamento: paraNumero(dados.deslocamento),
        motivo: dados.motivo,
        avaliacao: dados.avaliacao,
        diagnostico: dados.diagnostico,
        tratamento: dados.tratamento,
        observacoes: dados.observacoes,
      }
      if (!followUpId) {
        const { data: fu, error } = await supabase.from('follow_ups').insert(payload).select().single()
        if (error) throw error
        return fu.id
      } else {
        const { error } = await supabase.from('follow_ups').update(payload).eq('id', followUpId)
        if (error) throw error
        return followUpId
      }
    } catch (e) {
      setErro('Erro ao guardar. Verifica a ligação.')
      console.error('[guardarReavaliacao] falha ao guardar follow_up', {
        message: e?.message,
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
        status: e?.status,
        online: typeof navigator !== 'undefined' ? navigator.onLine : null,
        followUpId,
        tipo_atendimento: dados.tipo_atendimento,
        timestamp: new Date().toISOString(),
      }, e)
      return null
    } finally {
      setSaving(false)
    }
  }

  async function guardarRascunho(dadosActuais, idActual) {
    setSaving(true)
    setErro(null)
    try {
      let tutor_id = dadosActuais.tutor_id || null
      let patient_id = dadosActuais.paciente_id || null

      // Só criar tutor/paciente se não estiver bloqueado (paciente novo)
      if (!patientLocked) {
        if (dadosActuais.tutor_nome && !tutor_id) {
          const { data: tutor, error: tutorErr } = await supabase
            .from('tutors')
            .insert({
              nome: dadosActuais.tutor_nome,
              telefone: dadosActuais.tutor_telefone,
              email: dadosActuais.tutor_email,
              nif: dadosActuais.tutor_nif,
              morada: dadosActuais.tutor_morada,
            })
            .select().single()
          if (tutorErr) throw tutorErr
          tutor_id = tutor.id
          setDados(d => ({ ...d, tutor_id }))
        }

        if (dadosActuais.paciente_nome && tutor_id && !patient_id) {
          const { data: paciente, error: pacienteErr } = await supabase
            .from('patients')
            .insert({
              tutor_id,
              nome: dadosActuais.paciente_nome,
              especie: dadosActuais.paciente_especie || null,
              raca: dadosActuais.paciente_raca,
              data_nascimento: dadosActuais.paciente_nascimento || null,
              genero: dadosActuais.paciente_genero || null,
            })
            .select().single()
          if (pacienteErr) throw pacienteErr
          patient_id = paciente.id
          setDados(d => ({ ...d, paciente_id: patient_id }))
        }
      }

      // Retorno/Reavaliação, Exame Complementar e Intervenção não usam a
      // tabela consultations — guardam-se em follow_ups (ver
      // FormularioReavaliacao). Criar/actualizar tutor e paciente é
      // suficiente aqui.
      if (TIPOS_SIMPLIFICADOS.includes(dadosActuais.tipo_atendimento)) {
        return patient_id
      }

      const consultationPayload = {
        patient_id,
        data: dadosActuais.data,
        local: dadosActuais.local,
        tipo_atendimento: dadosActuais.tipo_atendimento,
        moeda: dadosActuais.moeda || null,
        valor: paraNumero(dadosActuais.valor),
        deslocamento: paraNumero(dadosActuais.deslocamento),
        queixa_principal: dadosActuais.queixa_principal,
        sinais: dadosActuais.sinais,
        trat_ocular_previo: dadosActuais.trat_ocular_previo,
        diag_ocular_previo: dadosActuais.diag_ocular_previo,
        aspecto_geral: dadosActuais.aspecto_geral,
        doencas_pre: dadosActuais.doencas_pre,
        trat_sistemico: dadosActuais.trat_sistemico,
        cirurgias: dadosActuais.cirurgias,
        flags: {
          ...dadosActuais.flags,
          alimentacao: dadosActuais.alimentacao,
          petisco: dadosActuais.petisco,
        },
        exame_oftalmologico: dadosActuais.exame_oftalmologico,
        diagnostico: dadosActuais.diagnostico,
        tratamento: dadosActuais.tratamento,
        observacoes: dadosActuais.observacoes,
        status: dadosActuais.status || 'rascunho',
      }

      let newId = idActual
      if (!idActual) {
        const { data: cons, error: consErr } = await supabase
          .from('consultations').insert(consultationPayload).select().single()
        if (consErr) throw consErr
        newId = cons.id
        setConsultationId(newId)
      } else {
        const { error: consErr } = await supabase
          .from('consultations').update(consultationPayload).eq('id', idActual)
        if (consErr) throw consErr
      }
      return newId
    } catch (e) {
      setErro('Erro ao guardar. Verifica a ligação.')
      console.error('[guardarRascunho] falha ao guardar ficha', {
        message: e?.message,
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
        status: e?.status,
        online: typeof navigator !== 'undefined' ? navigator.onLine : null,
        idActual,
        tutor_id: dadosActuais.tutor_id,
        paciente_id: dadosActuais.paciente_id,
        tipo_atendimento: dadosActuais.tipo_atendimento,
        timestamp: new Date().toISOString(),
      }, e)
      return null
    } finally {
      setSaving(false)
    }
  }

  async function avancar() {
    const id = await guardarRascunho(dados, consultationId)
    if (id && sessao < 6) setSessao(s => s + 1)
  }

  const sessaoTitulos = [
    'Data e identificação',
    'Anamnese e sinais clínicos',
    'Histórico geral de saúde',
    'Exame oftalmológico',
    'Diagnóstico e tratamento',
    'Imagens',
  ]

  // Se for retorno/reavaliação, exame complementar ou intervenção, mostrar
  // formulário simplificado (só após escolher o tipo na sessão 1)
  if (isSimplificado && sessao > 1) {
    return (
      <FormularioReavaliacao
        dados={dados}
        setDados={setDados}
        patientInfo={patientInfo}
        onGuardar={guardarReavaliacao}
        saving={saving}
        erro={erro}
        navigate={navigate}
      />
    )
  }

  if (revisao) return (
    <Revisao
      dados={dados}
      onEditar={() => setRevisao(false)}
      onFinalizar={async () => {
        setFinalizing(true)
        const id = await guardarRascunho({ ...dados, status: 'finalizada' }, consultationId)
        setFinalizing(false)
        if (id) {
          alert('Ficha guardada com sucesso!')
          navigate('/consultar')
        }
      }}
      finalizing={finalizing}
      erro={erro}
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <Header
      subtitulo={patientId ? 'Nova consulta' : 'Novo paciente'}
      botoes={<>
        <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
        <button onClick={() => navigate(patientId ? '/consultar' : '/')} style={btnNav}>← Voltar</button>
      </>}
/>

        {patientInfo && (
          <div style={{ background: 'var(--iv-sage-light)', borderRadius: 12, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: 'var(--iv-sage)' }}>
            <strong>{patientInfo.nome}</strong>
            {patientInfo.raca ? ` · ${patientInfo.raca}` : ''}
            {patientInfo.tutor ? ` · Tutor: ${patientInfo.tutor}` : ''}
          </div>
        )}

        <ProgressBar sessaoActual={sessao} total={6} />

        <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: '32px', boxShadow: '0 2px 16px rgba(91,110,88,0.08)' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--iv-ink-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Sessão {sessao} de 6
            </div>
            <div style={{ fontFamily: 'var(--iv-font-display)', fontSize: 22, fontWeight: 500, color: 'var(--iv-ink)', marginTop: 4 }}>
              {sessaoTitulos[sessao - 1]}
            </div>
          </div>

          {sessao === 1 && <Sessao1e2 dados={dados} onChange={setDados} locked={patientLocked} />}
          {sessao === 2 && <Sessao3 dados={dados} onChange={setDados} />}
          {sessao === 3 && <Sessao4 dados={dados} onChange={setDados} />}
          {sessao === 4 && <Sessao5 dados={dados} onChange={setDados} />}
          {sessao === 5 && <Sessao6 dados={dados} onChange={setDados} />}
          {sessao === 6 && <Sessao7 dados={dados} onChange={setDados} consultationId={consultationId} />}

          {erro && (
            <div style={{ background: 'var(--iv-plum-light)', color: 'var(--iv-plum-dark)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 16 }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--iv-line)' }}>
            <button onClick={() => setSessao(s => s - 1)} disabled={sessao === 1}
              style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: sessao === 1 ? 'var(--iv-line)' : 'var(--iv-ink-muted)', fontSize: 14, cursor: sessao === 1 ? 'not-allowed' : 'pointer' }}>
              ← Anterior
            </button>
            <span style={{ fontSize: 12, color: 'var(--iv-ink-muted)' }}>
              {saving ? '💾 A guardar...' : consultationId ? '✓ Rascunho guardado' : ''}
            </span>
            <button
              onClick={sessao === 6 ? () => setRevisao(true) : avancar}
              disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', opacity: saving ? 0.55 : 1, color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {sessao === 6 ? '👁 Rever ficha →' : 'Próxima →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionTitle = {
  fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 6
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--iv-line)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: 'var(--iv-bg)', fontFamily: 'inherit', color: 'var(--iv-ink)'
}

const btnNav = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)',
  background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer'
}
