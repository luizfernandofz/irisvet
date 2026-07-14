import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ESPECIE_EMOJI = {
  canino: '🐕', felino: '🐈', roedor: '🐇', equino: '🐴', ave: '🦜', outro: '',
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
]

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { background: white !important; margin: 0; padding: 0; }
  .ver-root { background: white !important; padding: 8px !important; }
  .ver-inner { max-width: 100% !important; }
  .ver-card {
    box-shadow: none !important;
    border-radius: 4px !important;
    margin-bottom: 8px !important;
    padding: 16px !important;
    border: 0.5px solid #eee !important;
    page-break-inside: avoid;
  }
  img { page-break-inside: avoid; max-width: 100%; }
}
`

function Card({ children }) {
  return (
    <div className="ver-card" style={{
      background: 'white', borderRadius: 16, padding: '32px',
      boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16
    }}>
      {children}
    </div>
  )
}

function SeccaoTitulo({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#534AB7',
      textTransform: 'uppercase', letterSpacing: 1,
      background: '#f0f0f0', borderRadius: 6,
      padding: '6px 10px', marginBottom: 16
    }}>
      {children}
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }}>
        {label}
      </label>
      <div style={{
        width: '100%', padding: '10px 12px', borderRadius: 8,
        border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box',
        background: '#fafafa', color: valor ? '#222' : '#ccc',
        whiteSpace: 'pre-wrap', lineHeight: 1.6,
        wordBreak: 'break-word', overflowWrap: 'break-word', minHeight: 40
      }}>
        {valor || '—'}
      </div>
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

function Divider() {
  return <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0' }} />
}

function CheckBox({ checked }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 4,
      background: checked ? '#534AB7' : 'white',
      border: '2px solid #534AB7',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      {checked && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
    </div>
  )
}

function TabelaVer({ titulo, linhas, secao }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {titulo && (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {titulo}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={thStyle}>Parâmetro</th>
            <th style={thStyle}>OD</th>
            <th style={thStyle}>OE</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
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

export default function VerFicha() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [imagens, setImagens] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDados() {
      const { data: cons, error } = await supabase
        .from('consultations')
        .select(`*, patients (*, tutors (*))`)
        .eq('id', id)
        .single()

      if (error) { console.error(error); setLoading(false); return }

      const { data: imgs } = await supabase
        .from('images').select('*').eq('consultation_id', id).order('ordem')

      const imagensComUrl = await Promise.all((imgs || []).map(async img => {
        const { data, error } = await supabase.storage
          .from('images').createSignedUrl(img.storage_path, 60 * 60 * 24)
        return { ...img, preview: error ? '' : data.signedUrl }
      }))

      const { data: fus } = await supabase
        .from('follow_ups').select('*').eq('consultation_id', id)
        .order('data', { ascending: true })

      setDados(cons)
      setImagens(imagensComUrl)
      setFollowUps(fus || [])
      setLoading(false)
    }
    fetchDados()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>A carregar ficha...</div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Ficha não encontrada.</div>
    </div>
  )

  const exame = dados.exame_oftalmologico || {}
  const sinais = dados.sinais || {}
  const flags = dados.flags || {}
  const alimentacao = Array.isArray(flags.alimentacao) ? flags.alimentacao : []
  const imagensOD = imagens.filter(i => i.olho === 'OD')
  const imagensOE = imagens.filter(i => i.olho === 'OE')
  const paciente = dados.patients || {}
  const tutor = paciente.tutors || {}

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="ver-root" style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
        <div className="ver-inner" style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* CABEÇALHO */}
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7', cursor: 'pointer' }}
                onClick={() => navigate('/')}>írisvet</div>
              <div style={{ fontSize: 13, color: '#888' }}>Ficha de atendimento</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate(`/editar/${id}`)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #534AB7',
                background: '#EEEDFE', color: '#534AB7', fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>✏️ Editar</button>
              <button onClick={() => window.print()} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#1D9E75', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>🖨️ Exportar PDF</button>
              <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar</button>
              <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            </div>
          </div>

          {/* CABEÇALHO DA FICHA — visível só na impressão */}
          <div style={{ display: 'none' }} id="print-header">
            <style>{`#print-header { display: none; } @media print { #print-header { display: block !important; text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #534AB7; } }`}</style>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#534AB7' }}>írisvet</div>
            <div style={{ fontSize: 10, color: '#888' }}>Dra. Anna Clara B. Hussein Zanuto · OMV 10.122 · PT: +351 916720461 · annaoftalmovet.com.pt</div>
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
              <Campo label="Nome" valor={tutor.nome} />
              <Campo label="Telefone" valor={tutor.telefone} />
              <Campo label="NIF / CPF" valor={tutor.nif} />
              <Campo label="Email" valor={tutor.email} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Campo label="Morada" valor={tutor.morada} />
              </div>
            </Grid2>
            <Divider />
            <SeccaoTitulo>Paciente</SeccaoTitulo>
            <Grid2>
              <Campo label="Nome do animal" valor={paciente.nome ? `${ESPECIE_EMOJI[paciente.especie] || ''} ${paciente.nome}`.trim() : ''} />
              <Campo label="Espécie" valor={paciente.especie} />
              <Campo label="Raça" valor={paciente.raca} />
              <Campo label="Género" valor={paciente.genero} />
              <Campo label="Data de nascimento" valor={paciente.data_nascimento} />
            </Grid2>
          </Card>

          {/* ANAMNESE */}
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
                  <tr key={s} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
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

          {/* HISTÓRICO */}
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
                  <span key={a} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '2px solid #534AB7', background: '#EEEDFE', color: '#534AB7', fontWeight: 600 }}>✓ {a}</span>
                ))}
              </div>
            ) : <div style={{ fontSize: 13, color: '#ccc', marginBottom: 12 }}>—</div>}
            <Campo label="Observações" valor={flags.petisco} />
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
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{label}</span>
                  </div>
                  <div style={{ marginLeft: 28, padding: '8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fafafa', fontSize: 13, color: flags[`${campo}_obs`] ? '#555' : '#ccc', minHeight: 36 }}>
                    {flags[`${campo}_obs`] || '—'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* EXAME */}
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
                  <tr key={r} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ ...tdStyle, fontSize: 13 }}>{r}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={exame.reflexos?.[r]?.OD} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={exame.reflexos?.[r]?.OE} /></td>
                    <td style={tdStyle}>{exame.reflexos?.[r]?.obs || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Divider />
            <TabelaVer titulo="Testes Oftálmicos" linhas={TESTES} secao={exame.testes} />
            <Divider />
            <TabelaVer titulo="Avaliação Segmentar" linhas={SEGMENTAR} secao={exame.segmentar} />
            <Divider />
            <Campo label="Comentários" valor={exame.comentarios} />
          </Card>

          {/* DIAGNÓSTICO */}
          <Card>
            <SeccaoTitulo>Diagnóstico e Tratamento</SeccaoTitulo>
            <Campo label="Diagnóstico" valor={dados.diagnostico} />
            <Campo label="Tratamento / Receituário" valor={dados.tratamento} />
            <Campo label="Observações e procedimentos realizados" valor={dados.observacoes} />
          </Card>

          {/* IMAGENS */}
          <Card>
            <SeccaoTitulo>Imagens</SeccaoTitulo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[{ olho: 'OD', imagens: imagensOD, label: 'Olho Direito (OD)' },
                { olho: 'OE', imagens: imagensOE, label: 'Olho Esquerdo (OE)' }
              ].map(({ imagens, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textAlign: 'center' }}>{label}</div>
                  {imagens.length > 0 ? imagens.map((img, i) => (
                    <img key={i} src={img.preview} alt=""
                      style={{ width: '100%', borderRadius: 10, marginBottom: 10, objectFit: 'cover', border: '1px solid #eee' }} />
                  )) : (
                    <div style={{ border: '2px dashed #eee', borderRadius: 10, padding: 24, textAlign: 'center', fontSize: 13, color: '#ccc' }}>
                      Sem imagens
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* REAVALIAÇÕES */}
          {followUps.length > 0 && (
            <Card>
              <SeccaoTitulo>Reavaliações ({followUps.length})</SeccaoTitulo>
              {followUps.map((fu, i) => (
                <div key={fu.id} style={{
                  borderBottom: i < followUps.length - 1 ? '1px solid #f0f0f0' : 'none',
                  paddingBottom: i < followUps.length - 1 ? 24 : 0,
                  marginBottom: i < followUps.length - 1 ? 24 : 0,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#534AB7', background: '#EEEDFE', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                    Reavaliação {i + 1} — {fu.data}
                    {fu.local ? ` · ${fu.local}` : ''}
                    {fu.tipo_atendimento ? ` · ${fu.tipo_atendimento}` : ''}
                  </div>
                  <Grid2>
                    <Campo label="Motivo" valor={fu.motivo} />
                    <Campo label="Avaliação" valor={fu.avaliacao} />
                    <Campo label="Diagnóstico" valor={fu.diagnostico} />
                    <Campo label="Tratamento" valor={fu.tratamento} />
                  </Grid2>
                </div>
              ))}
            </Card>
          )}

          {/* BOTÕES */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 40 }}>
            <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar à pesquisa</button>
          </div>

        </div>
      </div>
    </>
  )
}

const btnNav = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
  background: 'white', color: '#555', fontSize: 13, cursor: 'pointer'
}

const thStyle = {
  textAlign: 'left', padding: '10px 12px', fontSize: 12,
  fontWeight: 600, color: '#555', borderBottom: '2px solid #eee', background: '#f5f4fe'
}

const tdStyle = {
  padding: '8px 12px', borderBottom: '1px solid #f0f0f0',
  fontSize: 13, color: '#222', verticalAlign: 'top'
}
