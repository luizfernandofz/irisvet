import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { supabase } from '../lib/supabase'

async function urlToBlob(url) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch {
    return url
  }
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })
  const rotCanvas = document.createElement('canvas')
  const rad = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  rotCanvas.width = image.width * cos + image.height * sin
  rotCanvas.height = image.width * sin + image.height * cos
  const rotCtx = rotCanvas.getContext('2d')
  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2)
  rotCtx.rotate(rad)
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2)
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = pixelCrop.width
  finalCanvas.height = pixelCrop.height
  const finalCtx = finalCanvas.getContext('2d')
  finalCtx.drawImage(rotCanvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return finalCanvas.toDataURL('image/jpeg', 0.92)
}

function CropModal({ imagem, onConfirm, onCancel, saving }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.5)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const onCropComplete = useCallback((_, cap) => setCroppedAreaPixels(cap), [])

  async function handleConfirm() {
    const cropped = await getCroppedImg(imagem.preview, croppedAreaPixels, rotation)
    onConfirm(cropped)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#222', marginBottom: 16 }}>Recortar imagem — {imagem.nome}</div>
        <div style={{ position: 'relative', width: '100%', height: 320, background: '#111', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <Cropper image={imagem.preview} crop={crop} zoom={zoom} rotation={rotation} aspect={4 / 3} minZoom={0.3} restrictPosition={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Zoom</label>
          <input type="range" min={0.3} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ width: '100%', accentColor: '#534AB7' }} disabled={saving} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setRotation(r => (r + 90) % 360)} disabled={saving} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#f5f4fe', color: '#534AB7', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>↻ Rodar 90°</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}>Cancelar</button>
            <button onClick={handleConfirm} disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: saving ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'A guardar...' : '✓ Aplicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function SeccaoTitulo({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, background: '#f0f0f0', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }}>{label}</label>
      <div style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', background: '#fafafa', color: valor ? '#222' : '#ccc', whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word', minHeight: 40 }}>
        {valor || '—'}
      </div>
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

const btnNav = { padding: '10px 24px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 14, cursor: 'pointer' }

export default function RevisaoReavaliacao({ dados, onChange, patientInfo, onEditar, onFinalizar, finalizing, erro, labelFinalizar = '✓ Finalizar e guardar ficha', consultationId, fkColumn = 'follow_up_id' }) {
  const imagensOD = dados.imagens_OD || []
  const imagensOE = dados.imagens_OE || []
  const [cropTarget, setCropTarget] = useState(null)
  const [salvandoCrop, setSalvandoCrop] = useState(false)
  const [apagando, setApagando] = useState(null)

  async function abrirCrop(olho, idx, img) {
    const localUrl = await urlToBlob(img.original || img.preview)
    setCropTarget({ olho, idx, imagem: { ...img, preview: localUrl } })
  }

  async function handleCropConfirm(croppedDataUrl) {
    const { olho, idx } = cropTarget
    const campo = `imagens_${olho}`
    const lista = dados[campo] || []
    const img = lista[idx]
    const oldPath = img.storage_path || img.path

    setSalvandoCrop(true)
    try {
      let novoMeta = {}
      if (consultationId && oldPath) {
        const novoPath = `${consultationId}/${olho}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
        const blob = await (await fetch(croppedDataUrl)).blob()
        const { error: upErr } = await supabase.storage.from('images').upload(novoPath, blob, { contentType: 'image/jpeg' })
        if (upErr) throw upErr

        const { data: novaLinha, error: insErr } = await supabase.from('images')
          .insert({ [fkColumn]: consultationId, olho, storage_path: novoPath, ordem: img.ordem || 0 })
          .select().single()
        if (insErr) throw insErr

        await supabase.storage.from('images').remove([oldPath])
        if (img.id) await supabase.from('images').delete().eq('id', img.id)

        novoMeta = { id: novaLinha?.id, storage_path: novoPath, path: undefined, original: croppedDataUrl }
      }

      const novas = [...lista]
      novas[idx] = { ...img, ...novoMeta, preview: croppedDataUrl }
      onChange?.({ ...dados, [campo]: novas })
      setCropTarget(null)
    } catch (e) {
      console.error('Erro ao guardar imagem recortada:', e)
    } finally {
      setSalvandoCrop(false)
    }
  }

  async function apagarImagem(olho, idx, img) {
    const campo = `imagens_${olho}`
    const chave = `${olho}-${idx}`
    setApagando(chave)
    try {
      const path = img.storage_path || img.path
      if (path) await supabase.storage.from('images').remove([path])
      if (img.id) await supabase.from('images').delete().eq('id', img.id)

      const lista = dados[campo] || []
      const novas = [...lista]
      novas.splice(idx, 1)
      onChange?.({ ...dados, [campo]: novas })
    } catch (e) {
      console.error('Erro ao apagar imagem:', e)
    } finally {
      setApagando(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {cropTarget && (
          <CropModal
            imagem={cropTarget.imagem}
            saving={salvandoCrop}
            onConfirm={handleCropConfirm}
            onCancel={() => setCropTarget(null)}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7' }}>írisvet</div>
            <div style={{ fontSize: 13, color: '#888' }}>Revisão do retorno / reavaliação</div>
          </div>
          <button onClick={onEditar} style={btnNav}>← Voltar a editar</button>
        </div>

        {patientInfo && (
          <div style={{ background: '#EEEDFE', borderRadius: 12, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: '#534AB7' }}>
            <strong>{patientInfo.nome}</strong>
            {patientInfo.raca ? ` · ${patientInfo.raca}` : ''}
            {patientInfo.tutor ? ` · Tutor: ${patientInfo.tutor}` : ''}
          </div>
        )}

        <Card>
          <SeccaoTitulo>Consulta</SeccaoTitulo>
          <Grid2>
            <Campo label="Data" valor={dados.data} />
            <Campo label="Local / Clínica" valor={dados.local} />
            <Campo label="Tipo de atendimento" valor={dados.tipo_atendimento} />
          </Grid2>
          <Campo label="Motivo" valor={dados.motivo} />
        </Card>

        <Card>
          <SeccaoTitulo>Avaliação clínica</SeccaoTitulo>
          <Campo label="Avaliação" valor={dados.avaliacao} />
          <Campo label="Diagnóstico" valor={dados.diagnostico} />
          <Campo label="Tratamento" valor={dados.tratamento} />
        </Card>

        <Card>
          <SeccaoTitulo>Imagens</SeccaoTitulo>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[{ olho: 'OD', imagens: imagensOD, label: 'Olho Direito (OD)' }, { olho: 'OE', imagens: imagensOE, label: 'Olho Esquerdo (OE)' }].map(({ olho, imagens, label }) => (
              <div key={label}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textAlign: 'center' }}>{label}</div>
                {imagens.length > 0 ? imagens.map((img, i) => {
                  const chave = `${olho}-${i}`
                  const aApagar = apagando === chave
                  return (
                    <div key={i} style={{ position: 'relative', marginBottom: 10 }}>
                      <img src={img.preview} alt={img.nome || ''} style={{ width: '100%', borderRadius: 10, objectFit: 'cover', border: '1px solid #eee', display: 'block', opacity: aApagar ? 0.4 : 1 }} />
                      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
                        <button onClick={() => abrirCrop(olho, i, img)} disabled={aApagar} style={{ background: 'rgba(83,74,183,0.85)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          ✂️ Recortar / Rodar
                        </button>
                        <button onClick={() => apagarImagem(olho, i, img)} disabled={aApagar} style={{ background: 'rgba(153,60,29,0.9)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          {aApagar ? 'A apagar...' : '🗑 Apagar'}
                        </button>
                      </div>
                    </div>
                  )
                }) : (
                  <div style={{ border: '2px dashed #eee', borderRadius: 10, padding: 24, textAlign: 'center', fontSize: 13, color: '#ccc' }}>Sem imagens</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {erro && (
          <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 40 }}>
          <button onClick={onEditar} style={btnNav}>← Voltar a editar</button>
          <button onClick={onFinalizar} disabled={finalizing}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: finalizing ? '#a9a4e8' : '#1D9E75', color: 'white', fontSize: 14, fontWeight: 600, cursor: finalizing ? 'not-allowed' : 'pointer' }}>
            {finalizing ? 'A guardar...' : labelFinalizar}
          </button>
        </div>

      </div>
    </div>
  )
}
