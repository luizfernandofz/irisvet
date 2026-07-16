import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

const cardStyle = {
  background: 'white', borderRadius: 16, padding: '48px 40px',
  width: 360, boxShadow: '0 4px 24px rgba(83,74,183,0.10)'
}
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const errorStyle = { background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }

function submitStyle(loading) {
  return {
    width: '100%', padding: '11px', borderRadius: 8,
    background: loading ? '#a9a4e8' : '#534AB7',
    color: 'white', fontWeight: 600, fontSize: 14,
    border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
  }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [valid, setValid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValid(!!session)
      setReady(true)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) { setError('As passwords não coincidem.'); return }
    if (password.length < 6) { setError('A password deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('Não foi possível alterar a password. Pede um novo link.'); return }
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f4fe'
    }}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logo} alt="írisvet" style={{ width: 180, marginBottom: 8 }} />
        </div>

        {!ready ? null : !valid ? (
          <div style={{ textAlign: 'center' }}>
            <div style={errorStyle}>Link inválido ou expirado. Pede um novo em "Esqueci a password".</div>
            <button onClick={() => navigate('/')} style={submitStyle(false)}>Voltar ao login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nova password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirmar nova password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <button type="submit" disabled={loading} style={submitStyle(loading)}>
              {loading ? 'A guardar...' : 'Guardar nova password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
