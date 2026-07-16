import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }

export default function Receituarios() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Header
          subtitulo="Receituários"
          botoes={<button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button
            onClick={() => navigate('/receituarios/novo')}
            style={{ padding: '32px 20px', borderRadius: 16, border: 'none', background: 'white', boxShadow: '0 2px 16px rgba(83,74,183,0.08)', cursor: 'pointer', textAlign: 'center' }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>💊</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>Novo Receituário</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Gerar um novo receituário</div>
          </button>

          <button
            onClick={() => navigate('/receituarios/lista')}
            style={{ padding: '32px 20px', borderRadius: 16, border: 'none', background: 'white', boxShadow: '0 2px 16px rgba(83,74,183,0.08)', cursor: 'pointer', textAlign: 'center' }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>Consultar / Editar</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Ver, editar ou excluir receituários já criados</div>
          </button>
        </div>
      </div>
    </div>
  )
}
