import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'

export default function MeuPerfil() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)
  const [dados, setDados] = useState({
    display_name: '', titulo: '', registo_profissional: '', clinica: '',
    telefone: '', email_contato: '', site: '', redes_sociais: '',
  })

  useEffect(() => {
    async function fetchPerfil() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!error && data) {
        setDados({
          display_name: data.display_name || '', titulo: data.titulo || '',
          registo_profissional: data.registo_profissional || '', clinica: data.clinica || '',
          telefone: data.telefone || '', email_contato: data.email_contato || '',
          site: data.site || '', redes_sociais: data.redes_sociais || '',
        })
      }
      setLoading(false)
    }
    fetchPerfil()
  }, [])

  function set(campo, valor) {
    setDados(d => ({ ...d, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    setSucesso(false)
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('profiles').update(dados).eq('id', session.user.id)
    setSalvando(false)
    if (error) { setErro('Erro ao guardar. Tenta novamente.'); return }
    setSucesso(true)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Header
          subtitulo="Meu perfil"
          botoes={<button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>}
        />

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
            <div style={sectionTitle}>Identificação</div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nome</label>
              <input type="text" value={dados.display_name} onChange={e => set('display_name', e.target.value)} required style={inputStyle} />
            </div>

            <div style={sectionTitle}>
              Dados profissionais
              <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                — aparecem no rodapé dos documentos gerados (receituários, termos)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Título</label>
                <input type="text" value={dados.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Ma. M.V" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Registo profissional</label>
                <input type="text" value={dados.registo_profissional} onChange={e => set('registo_profissional', e.target.value)} placeholder="Ex: CRMV-SP: 36217" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Clínica</label>
                <input type="text" value={dados.clinica} onChange={e => set('clinica', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input type="text" value={dados.telefone} onChange={e => set('telefone', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email de contacto</label>
                <input type="email" value={dados.email_contato} onChange={e => set('email_contato', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Site</label>
                <input type="text" value={dados.site} onChange={e => set('site', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Redes sociais</label>
                <input type="text" value={dados.redes_sociais} onChange={e => set('redes_sociais', e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {erro && <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{erro}</div>}
          {sucesso && <div style={{ background: '#E1F5EE', color: '#0F6E56', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>Perfil actualizado com sucesso.</div>}

          <button type="submit" disabled={salvando} style={{
            width: '100%', padding: '14px', borderRadius: 10, border: 'none',
            background: salvando ? '#a9a4e8' : '#534AB7', color: 'white',
            fontSize: 15, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer', marginBottom: 40,
          }}>
            {salvando ? 'A guardar...' : '✓ Guardar'}
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
const sectionTitle = { fontSize: 11, fontWeight: 600, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginTop: 8 }
const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }
