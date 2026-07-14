import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/ProgressBar'
import Sessao1e2 from '../components/Sessao1e2'
import Sessao3 from '../components/Sessao3'
import Sessao4 from '../components/Sessao4'
import Sessao5 from '../components/Sessao5'
import Sessao6 from '../components/Sessao6'
import Sessao7 from '../components/Sessao7'
import Revisao from '../components/Revisao'

export default function NovaConsulta() {
  const navigate = useNavigate()
  const [sessao, setSessao] = useState(1)
  const [saving, setSaving] = useState(false)
  const [consultationId, setConsultationId] = useState(null)
  const [erro, setErro] = useState(null)
  const [revisao, setRevisao] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

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
  })

  async function guardarRascunho(dadosActuais, idActual) {
    setSaving(true)
    setErro(null)
    try {
      let tutor_id = null
      if (dadosActuais.tutor_nome) {
        const tutorPayload = {
          nome: dadosActuais.tutor_nome,
          telefone: dadosActuais.tutor_telefone,
          email: dadosActuais.tutor_email,
          nif: dadosActuais.tutor_nif,
          morada: dadosActuais.tutor_morada,
        }
        const { data: tutor, error: tutorErr } = await supabase
          .from('tutors')
          .insert(tutorPayload)
          .select()
          .single()
        if (tutorErr) throw tutorErr
        tutor_id = tutor.id
      }

      let patient_id = null
      if (dadosActuais.paciente_nome && tutor_id) {
        const pacientePayload = {
          tutor_id,
          nome: dadosActuais.paciente_nome,
          especie: dadosActuais.paciente_especie || null,
          raca: dadosActuais.paciente_raca,
          data_nascimento: dadosActuais.paciente_nascimento || null,
          genero: dadosActuais.paciente_genero || null,
        }
        const { data: paciente, error: pacienteErr } = await supabase
          .from('patients')
          .insert(pacientePayload)
          .select()
          .single()
        if (pacienteErr) throw pacienteErr
        patient_id = paciente.id
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
        status: 'rascunho',
      }

      let newId = idActual
      if (!idActual) {
        const { data: cons, error: consErr } = await supabase
          .from('consultations')
          .insert(consultationPayload)
          .select()
          .single()
        if (consErr) throw consErr
        newId = cons.id
        setConsultationId(newId)
      } else {
        const { error: consErr } = await supabase
          .from('consultations')
          .update(consultationPayload)
          .eq('id', idActual)
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

  function recuar() {
    setSessao(s => s - 1)
  }

  const sessaoTitulos = [
    'Data e identificação',
    'Anamnese e sinais clínicos',
    'Histórico geral de saúde',
    'Exame oftalmológico',
    'Diagnóstico e tratamento',
    'Imagens',
  ]

  if (revisao) return (
    <Revisao
      dados={dados}
      onEditar={() => setRevisao(false)}
      onFinalizar={async () => {
        setFinalizing(true)
        await guardarRascunho(dados, consultationId)
        setFinalizing(false)
        alert('Ficha guardada com sucesso!')
      }}
      finalizing={finalizing}
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* CABEÇALHO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7' }}>írisvet</div>
            <div style={{ fontSize: 13, color: '#888' }}>Nova consulta</div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
              background: 'white', color: '#555', fontSize: 13, cursor: 'pointer'
            }}
          >
            ← Voltar
          </button>
        </div>

        {/* PROGRESS BAR */}
        <ProgressBar sessaoActual={sessao} total={6} />

        {/* CARD */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '32px',
          boxShadow: '0 2px 16px rgba(83,74,183,0.08)'
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
              Sessão {sessao} de 6
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#222', marginTop: 4 }}>
              {sessaoTitulos[sessao - 1]}
            </div>
          </div>

          {/* CONTEÚDO DA SESSÃO */}
          {sessao === 1 && <Sessao1e2 dados={dados} onChange={setDados} />}
          {sessao === 2 && <Sessao3 dados={dados} onChange={setDados} />}
          {sessao === 3 && <Sessao4 dados={dados} onChange={setDados} />}
          {sessao === 4 && <Sessao5 dados={dados} onChange={setDados} />}
          {sessao === 5 && <Sessao6 dados={dados} onChange={setDados} />}
          {sessao === 6 && <Sessao7 dados={dados} onChange={setDados} consultationId={consultationId} />}

          {/* ERRO */}
          {erro && (
            <div style={{
              background: '#FAECE7', color: '#993C1D', borderRadius: 8,
              padding: '10px 12px', fontSize: 13, marginTop: 16
            }}>
              {erro}
            </div>
          )}

          {/* NAVEGAÇÃO */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0f0f0'
          }}>
            <button
              onClick={recuar}
              disabled={sessao === 1}
              style={{
                padding: '10px 24px', borderRadius: 8, border: '1px solid #ddd',
                background: 'white', color: sessao === 1 ? '#ccc' : '#555',
                fontSize: 14, cursor: sessao === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Anterior
            </button>

            <span style={{ fontSize: 12, color: '#aaa' }}>
              {saving ? '💾 A guardar...' : consultationId ? '✓ Rascunho guardado' : ''}
            </span>

            <button
              onClick={sessao === 6 ? () => setRevisao(true) : avancar}
              disabled={saving}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: saving ? '#a9a4e8' : '#534AB7',
                color: 'white', fontSize: 14, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {sessao === 6 ? '👁 Rever ficha →' : 'Próxima →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}