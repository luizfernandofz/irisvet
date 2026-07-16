import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

function UploadZona({ olho, imagens, onAdd, onRemove, consultationId, fkColumn }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [apagandoIdx, setApagandoIdx] = useState(null)

async function handleFiles(files) {
  if (!files || files.length === 0) return
  setUploading(true)

  for (const file of Array.from(files)) {
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const nomeUnico = `${consultationId || 'rascunho'}/${olho}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(nomeUnico, file, { upsert: false })

      if (uploadError) throw uploadError

      let novaLinhaId = null
      if (consultationId) {
        const { data: novaLinha, error: insertError } = await supabase.from('images').insert({
          [fkColumn]: consultationId,
          olho: olho,
          storage_path: nomeUnico,
          ordem: 0,
        }).select().single()
        if (insertError) throw insertError
        novaLinhaId = novaLinha?.id
      }

      const preview = URL.createObjectURL(file)
      onAdd({ id: novaLinhaId, storage_path: nomeUnico, nome: file.name, olho, preview, original: preview })
    } catch (e) {
      console.error('Erro ao fazer upload:', e)
    }
  }
  setUploading(false)
}

  async function handleRemove(i, img) {
    setApagandoIdx(i)
    try {
      const path = img.storage_path || img.path
      if (path) await supabase.storage.from('images').remove([path])
      if (img.id) await supabase.from('images').delete().eq('id', img.id)
      onRemove(i)
    } catch (e) {
      console.error('Erro ao apagar imagem:', e)
    } finally {
      setApagandoIdx(null)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div style={{
        fontSize: 12, fontWeight: 600, color: '#534AB7',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center'
      }}>
        Olho {olho === 'OD' ? 'Direito (OD)' : 'Esquerdo (OE)'}
      </div>

      {/* ZONA DE UPLOAD */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: '2px dashed #AFA9EC', borderRadius: 12, padding: '24px 16px',
          textAlign: 'center', cursor: 'pointer', background: '#EEEDFE',
          marginBottom: 12, transition: 'background 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#e0dffe'}
        onMouseLeave={e => e.currentTarget.style.background = '#EEEDFE'}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
        <div style={{ fontSize: 13, color: '#534AB7', fontWeight: 500 }}>
          {uploading ? 'A carregar...' : 'Clica ou arrasta imagens aqui'}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>JPG, PNG, HEIC</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* LISTA DE IMAGENS */}
      {imagens.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {imagens.map((img, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              border: '1px solid #eee', borderRadius: 10, padding: '8px 10px',
              background: 'white', opacity: apagandoIdx === i ? 0.5 : 1
            }}>
              {img.preview && (
                <img
                  src={img.preview}
                  alt={img.nome}
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, fontSize: 12, color: '#555', wordBreak: 'break-all' }}>
                {img.nome}
              </div>
              <button
                onClick={() => handleRemove(i, img)}
                disabled={apagandoIdx === i}
                style={{
                  background: '#FAECE7', border: 'none', borderRadius: 6,
                  color: '#993C1D', fontSize: 12, padding: '4px 8px',
                  cursor: apagandoIdx === i ? 'not-allowed' : 'pointer', flexShrink: 0
                }}
              >
                {apagandoIdx === i ? 'A apagar...' : '🗑 Apagar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {imagens.length === 0 && (
        <div style={{ fontSize: 12, color: '#bbb', textAlign: 'center' }}>
          Nenhuma imagem adicionada
        </div>
      )}
    </div>
  )
}

export default function Sessao7({ dados, onChange, consultationId, fkColumn = 'consultation_id' }) {
  const imagensOD = dados.imagens_OD || []
  const imagensOE = dados.imagens_OE || []

  function addImagem(olho, img) {
    const campo = `imagens_${olho}`
    onChange({ ...dados, [campo]: [...(dados[campo] || []), img] })
  }

  function removeImagem(olho, idx) {
    const campo = `imagens_${olho}`
    const novas = [...(dados[campo] || [])]
    novas.splice(idx, 1)
    onChange({ ...dados, [campo]: novas })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <UploadZona
          olho="OD"
          imagens={imagensOD}
          onAdd={img => addImagem('OD', img)}
          onRemove={idx => removeImagem('OD', idx)}
          consultationId={consultationId}
          fkColumn={fkColumn}
        />
        <UploadZona
          olho="OE"
          imagens={imagensOE}
          onAdd={img => addImagem('OE', img)}
          onRemove={idx => removeImagem('OE', idx)}
          consultationId={consultationId}
          fkColumn={fkColumn}
        />
      </div>
    </div>
  )
}
