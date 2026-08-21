import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

const btnNav = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer' }

export default function Receituarios() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Header
          subtitulo="Receituários"
          botoes={<button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button
            onClick={() => navigate('/receituarios/novo')}
            style={{ padding: '32px 20px', borderRadius: 12, border: '0.5px solid var(--iv-line)', background: 'var(--iv-surface)', boxShadow: '0 2px 16px rgba(91,110,88,0.08)', cursor: 'pointer', textAlign: 'center' }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>💊</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--iv-ink)' }}>Novo Receituário</div>
            <div style={{ fontSize: 12, color: 'var(--iv-ink-muted)', marginTop: 4 }}>Gerar um novo receituário</div>
          </button>

          <button
            onClick={() => navigate('/receituarios/lista')}
            style={{ padding: '32px 20px', borderRadius: 12, border: '0.5px solid var(--iv-line)', background: 'var(--iv-surface)', boxShadow: '0 2px 16px rgba(91,110,88,0.08)', cursor: 'pointer', textAlign: 'center' }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--iv-ink)' }}>Consultar / Editar</div>
            <div style={{ fontSize: 12, color: 'var(--iv-ink-muted)', marginTop: 4 }}>Ver, editar ou excluir receituários já criados</div>
          </button>
        </div>
      </div>
    </div>
  )
}
