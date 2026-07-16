import { useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

function cardStyle(wide) {
  return {
    background: 'white', borderRadius: 16, padding: '48px 40px',
    width: wide ? 480 : 360, boxShadow: '0 4px 24px rgba(83,74,183,0.10)'
  }
}
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const errorStyle = { background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }
const infoStyle = { background: '#E1F5EE', color: '#0F6E56', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }
const linkStyle = { background: 'none', border: 'none', color: '#534AB7', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' }

function submitStyle(loading) {
  return {
    width: '100%', padding: '11px', borderRadius: 8,
    background: loading ? '#a9a4e8' : '#534AB7',
    color: 'white', fontWeight: 600, fontSize: 14,
    border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
  }
}

function friendlyError(message) {
  if (!message) return 'Ocorreu um erro. Tenta novamente.'
  if (message.includes('Invalid login credentials')) return 'Email ou password incorrectos. Tenta novamente.'
  if (message.includes('User already registered')) return 'Já existe uma conta com este email.'
  if (message.includes('Password should be at least')) return 'A password deve ter pelo menos 6 caracteres.'
  if (message.includes('email rate limit exceeded')) return 'Foram enviados demasiados emails em pouco tempo. Tenta novamente daqui a uma hora.'
  return message
}

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [titulo, setTitulo] = useState('')
  const [registoProfissional, setRegistoProfissional] = useState('')
  const [clinica, setClinica] = useState('')
  const [telefone, setTelefone] = useState('')
  const [emailContato, setEmailContato] = useState('')
  const [site, setSite] = useState('')
  const [redesSociais, setRedesSociais] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  function switchMode(next) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(friendlyError(error.message))
    setLoading(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)
    if (!displayName.trim()) { setError('Indica o teu nome.'); return }
    if (password !== confirmPassword) { setError('As passwords não coincidem.'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          display_name: displayName.trim(),
          titulo: titulo.trim(),
          registo_profissional: registoProfissional.trim(),
          clinica: clinica.trim(),
          telefone: telefone.trim(),
          email_contato: emailContato.trim(),
          site: site.trim(),
          redes_sociais: redesSociais.trim(),
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    setLoading(false)
    if (error) {
      setError(friendlyError(error.message))
    } else if (!data.session) {
      setInfo('Conta criada! Verifica o teu email para confirmar antes de entrar.')
      setMode('login')
    }
    // se data.session existir (confirmação de email desligada), a sessão
    // já fica activa e o App.jsx trata da navegação sozinho
  }

  async function handleForgot(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setInfo('Se existir uma conta com este email, foi enviado um link para repor a password.')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f4fe'
    }}>
      <div style={cardStyle(mode === 'signup')}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logo} alt="írisvet" style={{ width: 180, marginBottom: 8 }} />
          <div style={{ fontSize: 12, color: '#888' }}>Portugal: OMV 10.122 | Brasil: CRMV MG:22.291 e SP:36.217</div>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <button type="button" onClick={() => switchMode('forgot')} style={linkStyle}>Esqueci a password</button>
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            {info && <div style={infoStyle}>{info}</div>}
            <button type="submit" disabled={loading} style={submitStyle(loading)}>
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#888' }}>
              Ainda não tens conta?{' '}
              <button type="button" onClick={() => switchMode('signup')} style={linkStyle}>Registrar-se</button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nome</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Confirmar password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 12px' }}>
              Dados profissionais (aparecem nos documentos gerados — podes preencher ou editar depois em "Meu Perfil")
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Título</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Ma. M.V" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Registo profissional</label>
                <input type="text" value={registoProfissional} onChange={e => setRegistoProfissional(e.target.value)} placeholder="Ex: CRMV-SP: 36217" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Clínica</label>
                <input type="text" value={clinica} onChange={e => setClinica(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email de contacto</label>
                <input type="email" value={emailContato} onChange={e => setEmailContato(e.target.value)} placeholder="Se diferente do email de login" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Site</label>
                <input type="text" value={site} onChange={e => setSite(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Redes sociais</label>
                <input type="text" value={redesSociais} onChange={e => setRedesSociais(e.target.value)} placeholder="Ex: @anna.oftalmovet" style={inputStyle} />
              </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            <button type="submit" disabled={loading} style={submitStyle(loading)}>
              {loading ? 'A criar conta...' : 'Criar conta'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#888' }}>
              Já tens conta?{' '}
              <button type="button" onClick={() => switchMode('login')} style={linkStyle}>Entrar</button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            {info && <div style={infoStyle}>{info}</div>}
            <button type="submit" disabled={loading} style={submitStyle(loading)}>
              {loading ? 'A enviar...' : 'Enviar link de recuperação'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#888' }}>
              <button type="button" onClick={() => switchMode('login')} style={linkStyle}>Voltar ao login</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
