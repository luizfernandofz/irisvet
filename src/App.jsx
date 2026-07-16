import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import NovaConsulta from './pages/NovaConsulta'
import Consultar from './pages/Consultar'
import VerFicha from './pages/VerFicha'
import EditarFicha from './pages/EditarFicha'
import VerReavaliacao from './pages/VerReavaliacao'
import logo from './assets/logo.png'
import EditarReavaliacao from './pages/EditarReavaliacao'

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
              border: '2px solid #534AB7', background: '#534AB7',
              color: 'white', cursor: 'pointer', textAlign: 'center'
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
              border: '2px solid #eee', background: 'white',
              color: '#333', cursor: 'pointer', textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Localizar Paciente</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Pesquisar fichas</div>
          </button>
        </div>

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <Login />

  return (
    <Routes>
      <Route path="/" element={<Home session={session} />} />
      <Route path="/nova-consulta" element={<NovaConsulta />} />
      <Route path="/nova-consulta/:patientId" element={<NovaConsulta />} />
      <Route path="/consultar" element={<Consultar />} />
      <Route path="/consulta/:id" element={<VerFicha />} />
      <Route path="/editar/:id" element={<EditarFicha />} />
      <Route path="/ver-reav/:id" element={<VerReavaliacao />} />
      <Route path="/editar-reav/:id" element={<EditarReavaliacao />} />
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
