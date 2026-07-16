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

// Formulário simplificado para Retorno/Reavaliação
import AutoTextarea from '../components/AutoTextarea'

const TIPOS_ATENDIMENTO = ['Consulta', 'Retorno/Reavaliação', 'Exame Complementar', 'Intervenção']

function FormularioReavaliacao({ dados, setDados, patientInfo, onGuardar, saving, erro, navigate }) {
  const [sessao, setSessao] = useState(1)
  const [followUpId, setFollowUpId] = useState(null)
  const [revisao, setRevisao] = useState(false)

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
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
    <Header
      subtitulo="Retorno / Reavaliação"
      botoes={<>
        <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
        <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar</button>
      </>}
    />

        {patientInfo && (
          <div style={{ background: '#EEEDFE', borderRadius: 12, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: '#534AB7' }}>
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
                    background: done ? '#1D9E75' : active ? '#534AB7' : '#eee',
                    color: done || active ? 'white' : '#999',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600
                  }}>{done ? '✓' : num}</div>
                  <div style={{ fontSize: 10, color: active ? '#534AB7' : done ? '#1D9E75' : '#aaa' }}>{label}</div>
                </div>
                {i < 2 && <div style={{ width: 32, height: 2, background: done ? '#1D9E75' : '#eee', marginBottom: 16 }} />}
              </div>
            )
          })}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)' }}>

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
                <div>
                  <label style={labelStyle}>Tipo de atendimento</label>
                  <select value={dados.tipo_atendimento}
                    onChange={e => setDados(d => ({ ...d, tipo_atendimento: e.target.value }))}
                    style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_ATENDIMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Motivo da consulta</label>
                <AutoTextarea value={dados.motivo}
                  onChange={e => setDados(d => ({ ...d, motivo: e.target.value }))}
                  placeholder="Motivo do retorno..." />
              </div>
            </div>
          )}

          {sessao === 2 && (
            <div>
              <div style={sectionTitle}>Avaliação clínica</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Avaliação</label>
                  <AutoTextarea value={dados.avaliacao}
                    onChange={e => setDados(d => ({ ...d, avaliacao: e.target.value }))}
                    placeholder="Avaliação clínica..." />
                </div>
                <div>
                  <label style={labelStyle}>Diagnóstico</label>
                  <AutoTextarea value={dados.diagnostico}
                    onChange={e => setDados(d => ({ ...d, diagnostico: e.target.value }))}
                    placeholder="Diagnóstico actualizado..." />
                </div>
                <div>
                  <label style={labelStyle}>Tratamento</label>
                  <AutoTextarea value={dados.tratamento}
                    onChange={e => setDados(d => ({ ...d, tratamento: e.target.value }))}
                    placeholder="Plano terapêutico..." />
                </div>
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
            <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 16 }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
            <button
            onClick={() => sessao === 1 ? navigate(-1) : setSessao(s => s - 1)}
            style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 14, cursor: 'pointer' }}
          >
            ← Anterior
          </button>
            <span style={{ fontSize: 12, color: '#aaa' }}>{saving ? '💾 A guardar...' : ''}</span>
            {sessao < 3 ? (
              <button onClick={avancar} disabled={saving}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: saving ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Próxima →
              </button>
            ) : (
              <button onClick={() => setRevisao(true)} disabled={saving}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: saving ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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

  const isReavaliacao = dados.tipo_atendimento === 'Retorno/Reavaliação'

  // Guardar reavaliação (follow_up)
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
        motivo: dados.motivo,
        avaliacao: dados.avaliacao,
        diagnostico: dados.diagnostico,
        tratamento: dados.tratamento,
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
      console.error(e)
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

      // Retorno/Reavaliação não usa a tabela consultations — guarda-se em
      // follow_ups (ver FormularioReavaliacao). Criar/actualizar tutor e
      // paciente é suficiente aqui.
      if (dadosActuais.tipo_atendimento === 'Retorno/Reavaliação') {
        return patient_id
      }

      const consultationPayload = {
        patient_id,
        data: dadosActuais.data,
        local: dadosActuais.local,
        tipo_atendimento: dadosActuais.tipo_atendimento,
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
      console.error(e)
      return idActual
    } finally {
      setSaving(false)
    }
  }

  async function avancar() {
    await guardarRascunho(dados, consultationId)
    if (sessao < 6) setSessao(s => s + 1)
  }

  const sessaoTitulos = [
    'Data e identificação',
    'Anamnese e sinais clínicos',
    'Histórico geral de saúde',
    'Exame oftalmológico',
    'Diagnóstico e tratamento',
    'Imagens',
  ]

  // Se for reavaliação, mostrar formulário simplificado
  // (só após escolher o tipo na sessão 1)
  if (isReavaliacao && sessao > 1) {
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
        await guardarRascunho({ ...dados, status: 'finalizada' }, consultationId)
        setFinalizing(false)
        alert('Ficha guardada com sucesso!')
        navigate('/consultar')
      }}
      finalizing={finalizing}
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <Header
      subtitulo={patientId ? 'Nova consulta' : 'Novo paciente'}
      botoes={<>
        <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
        <button onClick={() => navigate(patientId ? '/consultar' : '/')} style={btnNav}>← Voltar</button>
      </>}
/>

        {patientInfo && (
          <div style={{ background: '#EEEDFE', borderRadius: 12, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: '#534AB7' }}>
            <strong>{patientInfo.nome}</strong>
            {patientInfo.raca ? ` · ${patientInfo.raca}` : ''}
            {patientInfo.tutor ? ` · Tutor: ${patientInfo.tutor}` : ''}
          </div>
        )}

        <ProgressBar sessaoActual={sessao} total={6} />

        <div style={{ background: 'white', borderRadius: 16, padding: '32px', boxShadow: '0 2px 16px rgba(83,74,183,0.08)' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
              Sessão {sessao} de 6
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#222', marginTop: 4 }}>
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
            <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 16 }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
            <button onClick={() => setSessao(s => s - 1)} disabled={sessao === 1}
              style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: sessao === 1 ? '#ccc' : '#555', fontSize: 14, cursor: sessao === 1 ? 'not-allowed' : 'pointer' }}>
              ← Anterior
            </button>
            <span style={{ fontSize: 12, color: '#aaa' }}>
              {saving ? '💾 A guardar...' : consultationId ? '✓ Rascunho guardado' : ''}
            </span>
            <button
              onClick={sessao === 6 ? () => setRevisao(true) : avancar}
              disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: saving ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {sessao === 6 ? '👁 Rever ficha →' : 'Próxima →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionTitle = {
  fontSize: 11, fontWeight: 600, color: '#534AB7',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #ddd', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit', color: '#222'
}

const btnNav = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
  background: 'white', color: '#555', fontSize: 13, cursor: 'pointer'
}
