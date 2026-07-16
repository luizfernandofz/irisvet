import { useEffect, useRef, useState } from 'react'
import SignaturePadLib from 'signature_pad'

export default function SignaturePad({ onConfirm, onCancel }) {
  const canvasRef = useRef(null)
  const padRef = useRef(null)
  const [vazio, setVazio] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    // dimensiona o canvas UMA vez ao montar — não voltamos a mexer nisto
    // depois, para não arriscar apagar uma assinatura já desenhada por
    // causa de um resize da janela (ex: teclado a abrir em mobile).
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    canvas.getContext('2d').scale(ratio, ratio)

    padRef.current = new SignaturePadLib(canvas, { backgroundColor: 'rgb(255,255,255)', penColor: 'rgb(20,20,20)' })
    padRef.current.addEventListener('endStroke', () => setVazio(padRef.current.isEmpty()))
    return () => {
      padRef.current?.off()
    }
  }, [])

  function limpar() {
    padRef.current?.clear()
    setVazio(true)
  }

  function confirmar() {
    if (!padRef.current || padRef.current.isEmpty()) return
    onConfirm(padRef.current.toDataURL('image/png'))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#222', marginBottom: 4 }}>Assinatura</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
          Desenha a tua assinatura na caixa abaixo (rato ou dedo/caneta em ecrã táctil).
        </div>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 180, border: '1px solid #ddd', borderRadius: 8, background: 'white', touchAction: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button type="button" onClick={limpar} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }}>
            Limpar
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="button" onClick={confirmar} disabled={vazio} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: vazio ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 13, fontWeight: 600,
              cursor: vazio ? 'not-allowed' : 'pointer',
            }}>
              ✓ Confirmar Assinatura
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
