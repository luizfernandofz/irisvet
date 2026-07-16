import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import NovaConsulta from './pages/NovaConsulta'
import Consultar from './pages/Consultar'
import VerFicha from './pages/VerFicha'
import EditarFicha from './pages/EditarFicha'
import VerReavaliacao from './pages/VerReavaliacao'
import logo from './assets/logo.png'
import EditarReavaliacao from './pages/EditarReavaliacao'
import Consentimentos from './pages/Consentimentos'
import NovoConsentimento from './pages/NovoConsentimento'
import ConsultarConsentimentos from './pages/ConsultarConsentimentos'
import VerConsentimento from './pages/VerConsentimento'
import EditarConsentimento from './pages/EditarConsentimento'

function Home({ session }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f4fe', padding: 16
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '48px 40px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 4px 24px rgba(83,74,183,0.10)', textAlign: 'center'
      }}>
        <img src={logo} alt="írisvet" style={{ width: 200, marginBottom: 8 }} />
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 40 }}>
          Portugal: OMV 10.122 | Brasil: CRMV MG:22.291 e SP:36.217
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => navigate('/nova-consulta')}
            style={{
              padding: '20px 12px', borderRadius: 12,
              border: '2px solid #e0e0e0', background: '#e0e0e0',
              color: '#333', cursor: 'pointer', textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Novo Paciente</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Criar nova ficha</div>
          </button>

          <button
            onClick={() => navigate('/consultar')}
            style={{
              padding: '20px 12px', borderRadius: 12,
              border: '2px solid #e0e0e0', background: '#e0e0e0',
              color: '#333', cursor: 'pointer', textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Localizar Paciente</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Pesquisar fichas</div>
          </button>
        </div>

        <button
          onClick={() => navigate('/consentimentos')}
          style={{
            width: '100%', padding: '14px 12px', borderRadius: 12, marginBottom: 32,
            border: '2px solid #e0e0e0', background: '#e0e0e0',
            color: '#333', cursor: 'pointer', textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>📄 Termos de Consentimento</div>
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid #eee',
            background: 'white', color: '#999', fontSize: 12, cursor: 'pointer'
          }}
        >
          Sair
        </button>
      </div>
    </div>
  )
}

function AppInner() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) { setProfile(null); return }
    supabase.from('profiles').select('role, display_name').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data ?? null))
  }, [session])

  if (session === undefined) return null

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      {!session ? (
        <Route path="/*" element={<Login />} />
      ) : profile === undefined ? (
        <Route path="/*" element={null} />
      ) : (
        <>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/nova-consulta" element={<NovaConsulta />} />
          <Route path="/nova-consulta/:patientId" element={<NovaConsulta />} />
          <Route path="/consultar" element={<Consultar profile={profile} />} />
          <Route path="/consulta/:id" element={<VerFicha />} />
          <Route path="/editar/:id" element={<EditarFicha />} />
          <Route path="/ver-reav/:id" element={<VerReavaliacao />} />
          <Route path="/editar-reav/:id" element={<EditarReavaliacao />} />
          <Route path="/consentimentos" element={<Consentimentos />} />
          <Route path="/consentimentos/novo" element={<NovoConsentimento />} />
          <Route path="/consentimentos/novo/:patientId" element={<NovoConsentimento />} />
          <Route path="/consentimentos/lista" element={<ConsultarConsentimentos profile={profile} />} />
          <Route path="/consentimentos/:id" element={<VerConsentimento />} />
          <Route path="/consentimentos/editar/:id" element={<EditarConsentimento />} />
        </>
      )}
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
