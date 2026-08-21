import { useNavigate } from 'react-router-dom'
import logo from '../assets/Logo-sem-fundo.png'

export default function Header({ subtitulo, botoes }) {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <img src={logo} alt="írisvet" style={{ height: 48 }} />
        {subtitulo && <div style={{ fontFamily: 'var(--iv-font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--iv-ink-muted)', marginTop: 2 }}>{subtitulo}</div>}
      </div>
      {botoes && (
        <div style={{ display: 'flex', gap: 10 }}>
          {botoes}
        </div>
      )}
    </div>
  )
}