import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import AutoTextarea from '../components/AutoTextarea'
import Sessao7 from '../components/Sessao7'
import RevisaoReavaliacao from '../components/RevisaoReavaliacao'

const TIPOS_ATENDIMENTO = ['Consulta', 'Retorno/Reavaliação', 'Exame Complementar', 'Intervenção']

export default function EditarReavaliacao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState(null)
  const [sessao, setSessao] = useState(1)
  const [patientInfo, setPatientInfo] = useState(null)
  const [revisao, setRevisao] = useState(false)

  const [dados, setDados] = useState({
    data: '', local: '', tipo_atendimento: '',
    motivo: '', avaliacao: '', diagnostico: '', tratamento: '',
    imagens_OD: [], imagens_OE: [],
  })

  useEffect(() => {
    async function fetchDados() {
      const { data: fu, error } = await supabase
        .from('follow_ups')
        .select(`*, patients (nome, especie, raca, tutors (nome))`)
        .eq('id', id).single()
      if (error) { setLoading(false); return }

      const { data: imgs } = await supabase.from('images').select('*').eq('follow_up_id', id).order('ordem')
      const imagensComUrl = await Promise.all((imgs || []).map(async img => {
        const { data, error } = await supabase.storage.from('images').createSignedUrl(img.storage_path, 60 * 60 * 24)
        return { ...img, preview: error ? '' : data.signedUrl, original: error ? '' : data.signedUrl }
      }))

      const paciente = fu.patients || {}
      setPatientInfo({ nome: paciente.nome, raca: paciente.raca, tutor: paciente.tutors?.nome })
      setDados({
        data: fu.data || '',
        local: fu.local || '',
        tipo_atendimento: fu.tipo_atendimento || '',
        motivo: fu.motivo || '',
        avaliacao: fu.avaliacao || '',
        diagnostico: fu.diagnostico || '',
        tratamento: fu.tratamento || '',
        imagens_OD: imagensComUrl.filter(i => i.olho === 'OD'),
        imagens_OE: imagensComUrl.filter(i => i.olho === 'OE'),
      })
      setLoading(false)
    }
    fetchDados()
  }, [id])

  async function guardar() {
    setSaving(true)
    setErro(null)
    try {
      await supabase.from('follow_ups').update({
        data: dados.data, local: dados.local, tipo_atendimento: dados.tipo_atendimento,
        motivo: dados.motivo, avaliacao: dados.avaliacao,
        diagnostico: dados.diagnostico, tratamento: dados.tratamento,
      }).eq('id', id)
      alert('Ficha actualizada com sucesso!')
      navigate(`/ver-reav/${id}`)
    } catch (e) {
      setErro('Erro ao guardar.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar...</div>
    </div>
  )

  if (revisao) return (
    <RevisaoReavaliacao
      dados={dados}
      patientInfo={patientInfo}
      onEditar={() => setRevisao(false)}
      onFinalizar={guardar}
      finalizing={saving}
      erro={erro}
      labelFinalizar="✓ Guardar alterações"
    />
  )

  const sessaoTitulos = ['Dados', 'Clínico', 'Imagens']

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Header
          subtitulo="Editar retorno / reavaliação"
          botoes={<>
            <button onClick={() => navigate(`/ver-reav/${id}`)} style={btnNav}>← Voltar</button>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
          </>}
        />

        {patientInfo && (
          <div style={{ background: '#EEEDFE', borderRadius: 12, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: '#534AB7' }}>
            <strong>{patientInfo.nome}</strong>
            {patientInfo.raca ? ` · ${patientInfo.raca}` : ''}
            {patientInfo.tutor ? ` · Tutor: ${patientInfo.tutor}` : ''}
          </div>
        )}

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {sessaoTitulos.map((label, i) => {
            const num = i + 1
            const done = num < sessao
            const active = num === sessao
            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#1D9E75' : active ? '#534AB7' : '#eee', color: done || active ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                    {done ? '✓' : num}
                  </div>
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
                  <input type="date" value={dados.data} onChange={e => setDados(d => ({ ...d, data: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Local / Clínica</label>
                  <input type="text" value={dados.local} onChange={e => setDados(d => ({ ...d, local: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tipo de atendimento</label>
                  <select value={dados.tipo_atendimento} onChange={e => setDados(d => ({ ...d, tipo_atendimento: e.target.value }))} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_ATENDIMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Motivo</label>
                <AutoTextarea value={dados.motivo} onChange={e => setDados(d => ({ ...d, motivo: e.target.value }))} placeholder="Motivo do retorno..." />
              </div>
            </div>
          )}

          {sessao === 2 && (
            <div>
              <div style={sectionTitle}>Avaliação clínica</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Avaliação</label>
                  <AutoTextarea value={dados.avaliacao} onChange={e => setDados(d => ({ ...d, avaliacao: e.target.value }))} placeholder="Avaliação clínica..." />
                </div>
                <div>
                  <label style={labelStyle}>Diagnóstico</label>
                  <AutoTextarea value={dados.diagnostico} onChange={e => setDados(d => ({ ...d, diagnostico: e.target.value }))} placeholder="Diagnóstico actualizado..." />
                </div>
                <div>
                  <label style={labelStyle}>Tratamento</label>
                  <AutoTextarea value={dados.tratamento} onChange={e => setDados(d => ({ ...d, tratamento: e.target.value }))} placeholder="Plano terapêutico..." />
                </div>
              </div>
            </div>
          )}

          {sessao === 3 && (
            <div>
              <div style={sectionTitle}>Imagens</div>
              <Sessao7 dados={dados} onChange={setDados} consultationId={id} fkColumn="follow_up_id" />
            </div>
          )}

          {erro && (
            <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 16 }}>{erro}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
            <button onClick={() => setSessao(s => s - 1)} disabled={sessao === 1}
              style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: sessao === 1 ? '#ccc' : '#555', fontSize: 14, cursor: sessao === 1 ? 'not-allowed' : 'pointer' }}>
              ← Anterior
            </button>
            <span style={{ fontSize: 12, color: '#aaa' }}>{saving ? '💾 A guardar...' : ''}</span>
            {sessao < 3 ? (
              <button onClick={() => setSessao(s => s + 1)}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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

const sectionTitle = { fontSize: 11, fontWeight: 600, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit', color: '#222' }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }
