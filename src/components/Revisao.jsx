import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import logoIrisvet from '../assets/Logo-sem-fundo-menor.png'

const ESPECIE_EMOJI = {
  canino: '🐶', felino: '🐈', roedor: '🐇', equino: '🐴', ave: '🦜', outro: '',
}

const REFLEXOS = [
  'Blefarospasmo', 'Ofuscamento', 'Resposta à Ameaça',
  'RPL Direto', 'RPL Consensual', 'RPL Vermelho', 'RPL Azul',
]
const TESTES = ['TLS (mm/min)', 'PIO (mmHg)', 'Corantes', 'Teste de Jones', 'Seidel']
const SEGMENTAR = [
  'Bulbo Ocular', 'Aparelho Lacrimal', 'Pálpebras', 'Conjuntiva e Esclera',
  'Córnea', 'Câmara Anterior', 'Íris e Pupila', 'Lente', 'Retina e Vítreo',
]
const SINAIS = [
  'Hiperemia', 'Secreção', 'Lacrimejamento', 'Blefarospasmo', 'Prurido',
  'Fotofobia', 'Sangramento', 'Neoformação', 'Bulbo ocular', 'Déficit visual',
  'Midríase/Miose',
]

const PRINT_CSS = `
@media print {
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .no-print { display: none !important; }
  body { background: white !important; margin: 0; padding: 0; }
  .revisao-root { background: white !important; padding: 0 !important; }
  .revisao-inner { max-width: 100% !important; }
  .revisao-card {
    box-shadow: none !important;
    border-radius: 0 !important;
    margin-bottom: 8px !important;
    padding: 16px !important;
    page-break-inside: avoid;
  }
  img { page-break-inside: avoid; max-width: 100%; }
  .revisao-botoes { display: none !important; }
}
`

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

function CropModal({ imagem, onConfirm, onCancel }) {
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
      <div style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 560 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--iv-ink)', marginBottom: 16 }}>Recortar imagem — {imagem.nome}</div>
        <div style={{ position: 'relative', width: '100%', height: 320, background: 'var(--iv-ink)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <Cropper image={imagem.preview} crop={crop} zoom={zoom} rotation={rotation} aspect={4/3} minZoom={0.3} restrictPosition={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', display: 'block', marginBottom: 6 }}>Zoom</label>
          <input type="range" min={0.3} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--iv-sage)' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setRotation(r => (r + 90) % 360)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-bg)', color: 'var(--iv-sage)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>↻ Rodar 90°</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--iv-plum)', background: 'transparent', color: 'var(--iv-plum-dark)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleConfirm} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--iv-sage)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>✓ Aplicar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div className="revisao-card" style={{ background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: '32px', boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function SeccaoTitulo({ children }) {
  return (
    <div style={{ fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)', textTransform: 'uppercase', letterSpacing: 1, background: 'var(--iv-line)', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }}>{label}</label>
      <div style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--iv-line)', fontSize: 14, boxSizing: 'border-box', background: 'var(--iv-bg)', color: valor ? 'var(--iv-ink)' : 'var(--iv-line)', whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word', minHeight: 40 }}>
        {valor || '—'}
      </div>
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--iv-line)', margin: '20px 0' }} />
}

function CheckBox({ checked }) {
  return (
    <div style={{ width: 18, height: 18, borderRadius: 4, background: checked ? 'var(--iv-sage)' : 'var(--iv-surface)', border: '2px solid var(--iv-sage)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {checked && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
    </div>
  )
}

function TabelaRevisao({ titulo, linhas, secao }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {titulo && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--iv-ink-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{titulo}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, tableLayout: 'fixed' }}>
        <colgroup><col style={{ width: '50%' }} /><col style={{ width: '25%' }} /><col style={{ width: '25%' }} /></colgroup>
        <thead>
          <tr>
            <th style={thStyle}>Parâmetro</th>
            <th style={thStyle}>OD</th>
            <th style={thStyle}>OE</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l} style={{ background: i % 2 === 0 ? 'var(--iv-bg)' : 'var(--iv-surface)' }}>
              <td style={{ ...tdStyle, fontSize: 13 }}>{l}</td>
              <td style={tdStyle}>{secao?.[l]?.OD || ''}</td>
              <td style={tdStyle}>{secao?.[l]?.OE || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Revisao({ dados, onEditar, onFinalizar, finalizing, erro }) {
  const exame = dados.exame_oftalmologico || {}
  const sinais = dados.sinais || {}
  const flags = dados.flags || {}
  const alimentacao = Array.isArray(dados.alimentacao) ? dados.alimentacao : []
  const [imagensOD, setImagensOD] = useState(dados.imagens_OD || [])
  const [imagensOE, setImagensOE] = useState(dados.imagens_OE || [])
  const [cropTarget, setCropTarget] = useState(null)

  function handleCropConfirm(croppedDataUrl) {
    const { olho, idx } = cropTarget
    if (olho === 'OD') {
      const novas = [...imagensOD]; novas[idx] = { ...novas[idx], preview: croppedDataUrl }; setImagensOD(novas)
    } else {
      const novas = [...imagensOE]; novas[idx] = { ...novas[idx], preview: croppedDataUrl }; setImagensOE(novas)
    }
    setCropTarget(null)
  }

  async function abrirCrop(olho, idx, img) {
    const localUrl = await urlToBlob(img.original || img.preview)
    setCropTarget({ olho, idx, imagem: { ...img, preview: localUrl } })
  }

  function nomeArquivo() {
    const sanitizar = s => (s || '').replace(/[\\/:*?"<>|]/g, '').trim()
    const nomePaciente = sanitizar(dados.paciente_nome) || 'Paciente'
    const primeiroNomeTutor = sanitizar((dados.tutor_nome || '').trim().split(/\s+/)[0]) || 'Tutor'
    const data = sanitizar(dados.data)
    return [nomePaciente, primeiroNomeTutor, data].filter(Boolean).join('_')
  }

  function exportarPDF() {
    document.title = nomeArquivo()
    window.print()
  }

  return (
    <>
      <style>{PRINT_CSS}</style>

      {cropTarget && <CropModal imagem={cropTarget.imagem} onConfirm={handleCropConfirm} onCancel={() => setCropTarget(null)} />}

      <div className="revisao-root" style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
        <div className="revisao-inner" style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* CABEÇALHO — não imprime */}
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--iv-font-display)', fontSize: 22, fontWeight: 500, color: 'var(--iv-sage)' }}>írisvet</div>
              <div style={{ fontSize: 13, color: 'var(--iv-ink-muted)' }}>Revisão da ficha</div>
            </div>
            <button onClick={onEditar} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer' }}>← Voltar a editar</button>
          </div>

          {/* CABEÇALHO DA FICHA — só aparece na impressão */}
          <div style={{ display: 'none' }} id="print-header">
            <style>{`#print-header { display: none; } @media print { #print-header { display: flex !important; align-items: center; gap: 14px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid var(--iv-sage); } }`}</style>
            <img src={logoIrisvet} alt="írisvet" style={{ height: 44, width: 'auto' }} />
            <div>
              <div style={{ fontFamily: 'var(--iv-font-display)', fontSize: 18, fontWeight: 500, color: 'var(--iv-sage)' }}>Dra. Anna Clara B. Hussein Zanuto</div>
              <div style={{ fontSize: 11, color: 'var(--iv-ink-muted)' }}>OMV 10.122 · PT: +351 916720461 · annaoftalmovet.com.pt</div>
            </div>
          </div>

          {/* SESSÃO 1+2 */}
          <Card>
            <SeccaoTitulo>Consulta</SeccaoTitulo>
            <Grid2>
              <Campo label="Data" valor={dados.data} />
              <Campo label="Local / Clínica" valor={dados.local} />
              <Campo label="Tipo de atendimento" valor={dados.tipo_atendimento} />
            </Grid2>
            <Divider />
            <SeccaoTitulo>Cliente (Tutor)</SeccaoTitulo>
            <Grid2>
              <Campo label="Nome" valor={dados.tutor_nome} />
              <Campo label="Telefone" valor={dados.tutor_telefone} />
              <Campo label="NIF / CPF" valor={dados.tutor_nif} />
              <Campo label="Email" valor={dados.tutor_email} />
              <div style={{ gridColumn: '1 / -1' }}><Campo label="Morada" valor={dados.tutor_morada} /></div>
            </Grid2>
            <Divider />
            <SeccaoTitulo>Paciente</SeccaoTitulo>
            <Grid2>
              <Campo label="Nome do animal" valor={dados.paciente_nome ? `${ESPECIE_EMOJI[dados.paciente_especie] || ''} ${dados.paciente_nome}`.trim() : ''} />
              <Campo label="Espécie" valor={dados.paciente_especie} />
              <Campo label="Raça" valor={dados.paciente_raca} />
              <Campo label="Género" valor={dados.paciente_genero} />
              <Campo label="Data de nascimento" valor={dados.paciente_nascimento} />
            </Grid2>
          </Card>

          {/* SESSÃO 2 — ANAMNESE */}
          <Card>
            <SeccaoTitulo>Queixa ocular principal</SeccaoTitulo>
            <Campo label="Queixa" valor={dados.queixa_principal} />
            <Divider />
            <SeccaoTitulo>Sinais clínicos</SeccaoTitulo>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Sinal</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>OD</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>OE</th>
                  <th style={thStyle}>Observação</th>
                </tr>
              </thead>
              <tbody>
                {SINAIS.map((s, i) => (
                  <tr key={s} style={{ background: i % 2 === 0 ? 'var(--iv-bg)' : 'var(--iv-surface)' }}>
                    <td style={tdStyle}>{s}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={sinais[s]?.OD} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={sinais[s]?.OE} /></td>
                    <td style={tdStyle}>{sinais[s]?.obs || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Divider />
            <SeccaoTitulo>Histórico ocular</SeccaoTitulo>
            <Grid2>
              <Campo label="Tratamento ocular prévio" valor={dados.trat_ocular_previo} />
              <Campo label="Diagnóstico ocular prévio" valor={dados.diag_ocular_previo} />
            </Grid2>
          </Card>

          {/* SESSÃO 3 — HISTÓRICO */}
          <Card>
            <SeccaoTitulo>Saúde geral</SeccaoTitulo>
            <Campo label="Aspecto geral" valor={dados.aspecto_geral} />
            <Campo label="Doenças pré-existentes" valor={dados.doencas_pre} />
            <Campo label="Tratamento sistémico" valor={dados.trat_sistemico} />
            <Campo label="Cirurgias gerais" valor={dados.cirurgias} />
            <Campo label="Observações" valor={dados.observacoes_historico} />
            <Divider />
            <SeccaoTitulo>Alimentação</SeccaoTitulo>
            {alimentacao.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {alimentacao.map(a => (
                  <span key={a} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '2px solid var(--iv-sage)', background: 'var(--iv-sage-light)', color: 'var(--iv-sage)', fontWeight: 600 }}>✓ {a}</span>
                ))}
              </div>
            ) : <div style={{ fontSize: 13, color: 'var(--iv-line)', marginBottom: 12 }}>—</div>}
            <Campo label="Observações" valor={dados.petisco} />
            <Divider />
            <SeccaoTitulo>Outros</SeccaoTitulo>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { campo: 'esterelizacao', label: 'Esterelização' },
                { campo: 'vacinas', label: 'Vacinas em dia' },
                { campo: 'ectoparasitas', label: 'Presença de Ectoparasitas' },
              ].map(({ campo, label }) => (
                <div key={campo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <CheckBox checked={flags[campo]} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--iv-ink)' }}>{label}</span>
                  </div>
                  <div style={{ marginLeft: 28, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--iv-line)', background: 'var(--iv-bg)', fontSize: 13, color: flags[`${campo}_obs`] ? 'var(--iv-ink-muted)' : 'var(--iv-line)', minHeight: 36 }}>
                    {flags[`${campo}_obs`] || '—'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* SESSÃO 4 — EXAME */}
          <Card>
            <SeccaoTitulo>Reflexos e avaliação neuro-visual</SeccaoTitulo>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Parâmetro</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>OD</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>OE</th>
                  <th style={thStyle}>Observação</th>
                </tr>
              </thead>
              <tbody>
                {REFLEXOS.map((r, i) => (
                  <tr key={r} style={{ background: i % 2 === 0 ? 'var(--iv-bg)' : 'var(--iv-surface)' }}>
                    <td style={{ ...tdStyle, fontSize: 13 }}>{r}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={exame.reflexos?.[r]?.OD} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={exame.reflexos?.[r]?.OE} /></td>
                    <td style={tdStyle}>{exame.reflexos?.[r]?.obs || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Divider />
            <TabelaRevisao titulo="Testes Oftálmicos" linhas={TESTES} secao={exame.testes} />
            <Divider />
            <TabelaRevisao titulo="Avaliação Segmentar" linhas={SEGMENTAR} secao={exame.segmentar} />
            <Divider />
            <Campo label="Comentários" valor={exame.comentarios} />
          </Card>

          {/* SESSÃO 5 — DIAGNÓSTICO */}
          <Card>
            <SeccaoTitulo>Diagnóstico e Tratamento</SeccaoTitulo>
            <Campo label="Diagnóstico" valor={dados.diagnostico} />
            <Campo label="Tratamento / Receituário" valor={dados.tratamento} />
            <Campo label="Observações e procedimentos realizados" valor={dados.observacoes} />
          </Card>

          {/* SESSÃO 6 — IMAGENS */}
          <Card>
            <SeccaoTitulo>Imagens</SeccaoTitulo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { olho: 'OD', imagens: imagensOD, label: 'Olho Direito (OD)' },
                { olho: 'OE', imagens: imagensOE, label: 'Olho Esquerdo (OE)' }
              ].map(({ olho, imagens, label }) => (
                <div key={olho}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--iv-ink-muted)', marginBottom: 10, textAlign: 'center' }}>{label}</div>
                  {imagens.length > 0 ? imagens.map((img, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: 10 }}>
                      <img src={img.preview} alt={img.nome} style={{ width: '100%', borderRadius: 10, objectFit: 'cover', border: '1px solid var(--iv-line)', display: 'block' }} />
                      <button className="no-print" onClick={() => abrirCrop(olho, i, img)} style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(91,110,88,0.85)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        ✂️ Recortar / Rodar
                      </button>
                    </div>
                  )) : (
                    <div style={{ border: '2px dashed var(--iv-line)', borderRadius: 10, padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--iv-line)' }}>Sem imagens</div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {erro && (
            <div className="no-print" style={{ background: 'var(--iv-plum-light)', color: 'var(--iv-plum-dark)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{erro}</div>
          )}

          {/* BOTÕES FINAIS */}
          <div className="revisao-botoes no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 40 }}>
            <button onClick={onEditar} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--iv-line)', background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 14, cursor: 'pointer' }}>← Voltar a editar</button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={exportarPDF} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--iv-sage)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>🖨️ Exportar PDF</button>
              <button onClick={onFinalizar} disabled={finalizing} style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: 'var(--iv-sage)', opacity: finalizing ? 0.55 : 1, color: 'white', fontSize: 14, fontWeight: 600, cursor: finalizing ? 'not-allowed' : 'pointer' }}>
                {finalizing ? 'A guardar...' : '✓ Finalizar e guardar ficha'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

const thStyle = {
  textAlign: 'left', padding: '10px 12px', fontSize: 12,
  fontWeight: 600, color: 'var(--iv-ink-muted)', borderBottom: '2px solid var(--iv-line)', background: 'var(--iv-bg)'
}

const tdStyle = {
  padding: '8px 12px', borderBottom: '1px solid var(--iv-line)',
  fontSize: 13, color: 'var(--iv-ink)', verticalAlign: 'top'
}