import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/ProgressBar'
import Sessao1e2 from '../components/Sessao1e2'
import Sessao3 from '../components/Sessao3'
import Sessao4 from '../components/Sessao4'
import Sessao5 from '../components/Sessao5'
import Sessao6 from '../components/Sessao6'
import Sessao7 from '../components/Sessao7'
import Revisao from '../components/Revisao'

export default function EditarFicha() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sessao, setSessao] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [revisao, setRevisao] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [erro, setErro] = useState(null)
  const [dados, setDados] = useState(null)

  useEffect(() => {
    async function fetchDados() {
      const { data: cons, error } = await supabase
        .from('consultations')
        .select(`*, patients (*, tutors (*))`)
        .eq('id', id)
        .single()

      if (error) { console.error(error); setLoading(false); return }

      const { data: imgs } = await supabase
        .from('images')
        .select('*')
        .eq('consultation_id', id)
        .order('ordem')

      const imagensComUrl = await Promise.all((imgs || []).map(async img => {
        const { data, error } = await supabase.storage
          .from('images')
          .createSignedUrl(img.storage_path, 60 * 60 * 24)
        return { ...img, preview: error ? '' : data.signedUrl, original: error ? '' : data.signedUrl }
      }))

      const paciente = cons.patients || {}
      const tutor = paciente.tutors || {}
      const flags = cons.flags || {}

      setDados({
        data: cons.data || '',
        local: cons.local || '',
        tipo_atendimento: cons.tipo_atendimento || '',
        tutor_nome: tutor.nome || '',
        tutor_telefone: tutor.telefone || '',
        tutor_nif: tutor.nif || '',
        tutor_email: tutor.email || '',
        tutor_morada: tutor.morada || '',
        tutor_id: tutor.id || null,
        paciente_nome: paciente.nome || '',
        paciente_especie: paciente.especie || '',
        paciente_raca: paciente.raca || '',
        paciente_nascimento: paciente.data_nascimento || '',
        paciente_genero: paciente.genero || '',
        paciente_id: paciente.id || null,
        queixa_principal: cons.queixa_principal || '',
        sinais: cons.sinais || {},
        trat_ocular_previo: cons.trat_ocular_previo || '',
        diag_ocular_previo: cons.diag_ocular_previo || '',
        aspecto_geral: cons.aspecto_geral || '',
        doencas_pre: cons.doencas_pre || '',
        trat_sistemico: cons.trat_sistemico || '',
        cirurgias: cons.cirurgias || '',
        observacoes_historico: cons.observacoes_historico || '',
        alimentacao: Array.isArray(flags.alimentacao) ? flags.alimentacao : [],
        petisco: flags.petisco || '',
        flags: {
          esterelizacao: flags.esterelizacao || false,
          esterelizacao_obs: flags.esterelizacao_obs || '',
          vacinas: flags.vacinas || false,
          vacinas_obs: flags.vacinas_obs || '',
          ectoparasitas: flags.ectoparasitas || false,
          ectoparasitas_obs: flags.ectoparasitas_obs || '',
        },
        exame_oftalmologico: cons.exame_oftalmologico || {},
        diagnostico: cons.diagnostico || '',
        tratamento: cons.tratamento || '',
        observacoes: cons.observacoes || '',
        imagens_OD: imagensComUrl.filter(i => i.olho === 'OD'),
        imagens_OE: imagensComUrl.filter(i => i.olho === 'OE'),
      })
      setLoading(false)
    }
    fetchDados()
  }, [id])

  async function guardar(dadosActuais) {
    setSaving(true)
    setErro(null)
    try {
      if (dadosActuais.tutor_id) {
        await supabase.from('tutors').update({
          nome: dadosActuais.tutor_nome,
          telefone: dadosActuais.tutor_telefone,
          email: dadosActuais.tutor_email,
          nif: dadosActuais.tutor_nif,
          morada: dadosActuais.tutor_morada,
        }).eq('id', dadosActuais.tutor_id)
      }

      if (dadosActuais.paciente_id) {
        await supabase.from('patients').update({
          nome: dadosActuais.paciente_nome,
          especie: dadosActuais.paciente_especie || null,
          raca: dadosActuais.paciente_raca,
          data_nascimento: dadosActuais.paciente_nascimento || null,
          genero: dadosActuais.paciente_genero || null,
        }).eq('id', dadosActuais.paciente_id)
      }

      await supabase.from('consultations').update({
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
        status: 'finalizada',
      }).eq('id', id)

    } catch (e) {
      setErro('Erro ao guardar. Verifica a ligação.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const sessaoTitulos = [
    'Data e identificação',
    'Anamnese e sinais clínicos',
    'Histórico geral de saúde',
    'Exame oftalmológico',
    'Diagnóstico e tratamento',
    'Imagens',
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar ficha...</div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Ficha não encontrada.</div>
    </div>
  )

  if (revisao) return (
    <Revisao
      dados={dados}
      onEditar={() => setRevisao(false)}
      onFinalizar={async () => {
        setFinalizing(true)
        await guardar(dados)
        setFinalizing(false)
        navigate(`/consulta/${id}`)
      }}
      finalizing={finalizing}
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7', cursor: 'pointer' }}
              onClick={() => navigate('/')}>írisvet</div>
            <div style={{ fontSize: 13, color: '#888' }}>Editar ficha</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate(`/consulta/${id}`)} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </div>
        </div>

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

          {sessao === 1 && <Sessao1e2 dados={dados} onChange={setDados} locked={false} />}
          {sessao === 2 && <Sessao3 dados={dados} onChange={setDados} />}
          {sessao === 3 && <Sessao4 dados={dados} onChange={setDados} />}
          {sessao === 4 && <Sessao5 dados={dados} onChange={setDados} />}
          {sessao === 5 && <Sessao6 dados={dados} onChange={setDados} />}
          {sessao === 6 && <Sessao7 dados={dados} onChange={setDados} consultationId={id} />}

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
            <span style={{ fontSize: 12, color: '#aaa' }}>{saving ? '💾 A guardar...' : ''}</span>
            <button
              onClick={sessao === 6 ? () => setRevisao(true) : () => setSessao(s => s + 1)}
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

const btnNav = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
  background: 'white', color: '#555', fontSize: 13, cursor: 'pointer'
}
