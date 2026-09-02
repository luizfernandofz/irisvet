export default function ProgressBar({ sessaoActual }) {
  const sessoes = [
    'Data e ID',
    'Anamnese',
    'Histórico',
    'Exame',
    'Diagnóstico',
    'Imagens'
  ]

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        {sessoes.map((label, i) => {
          const num = i + 1
          const done = num < sessaoActual
          const active = num === sessaoActual

          return (
            <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                  background: done ? 'var(--iv-sage)' : active ? 'var(--iv-sage)' : 'var(--iv-line)',
                  color: done || active ? 'white' : 'var(--iv-ink-muted)',
                  border: active ? '3px solid var(--iv-sage)' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}>
                  {done ? '✓' : num}
                </div>
                <div style={{
                  fontSize: 10, color: active ? 'var(--iv-sage)' : done ? 'var(--iv-sage)' : 'var(--iv-ink-muted)',
                  fontWeight: active ? 600 : 400, whiteSpace: 'nowrap'
                }}>
                  {label}
                </div>
              </div>
              {i < sessoes.length - 1 && (
                <div style={{
                  width: 40, height: 2, margin: '0 4px',
                  marginBottom: 22,
                  background: done ? 'var(--iv-sage)' : 'var(--iv-line)',
                  transition: 'background 0.2s'
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}