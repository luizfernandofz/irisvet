import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'

function Home({ session }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f4fe'
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '48px 40px',
        width: 400, boxShadow: '0 4px 24px rgba(83,74,183,0.10)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#534AB7', marginBottom: 8 }}>
          írisvet
        </div>
        <div style={{ fontSize: 14, color: '#555', marginBottom: 32 }}>
          Bem-vinda, {session.user.email}
        </div>
        <div style={{
          background: '#E1F5EE', borderRadius: 10, padding: '16px',
          fontSize: 13, color: '#0F6E56', marginBottom: 32
        }}>
          ✓ Ligação ao Supabase estabelecida com sucesso
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 24px', borderRadius: 8, border: '1px solid #ddd',
            background: 'white', color: '#555', fontSize: 13, cursor: 'pointer'
          }}
        >
          Sair
        </button>
      </div>
    </div>
  )
}

export default function App() {
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
  return <Home session={session} />
}