import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import { translateLabel, translateFreeTextFields } from '../lib/pdfTranslations'

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
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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

function TabelaVer({ titulo, linhas, secao, lang, V, keyPrefix }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {titulo && (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {translateLabel(lang, titulo)}
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
            <th style={thStyle}>{translateLabel(lang, 'Parâmetro')}</th>
            <th style={thStyle}>OD</th>
            <th style={thStyle}>{translateLabel(lang, 'OE')}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
              <td style={{ ...tdStyle, fontSize: 13 }}>{translateLabel(lang, l)}</td>
              <td style={tdStyle}>{V(`${keyPrefix}_${l}_OD`, secao?.[l]?.OD) || ''}</td>
              <td style={tdStyle}>{V(`${keyPrefix}_${l}_OE`, secao?.[l]?.OE) || ''}</td>
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
  const [lang, setLang] = useState('pt')
  const [translated, setTranslated] = useState({})
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState(null)
  const [printRequested, setPrintRequested] = useState(false)

  useEffect(() => {
    function handleAfterPrint() { setLang('pt') }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  useEffect(() => {
    if (!printRequested) return
    window.print()
    setPrintRequested(false)
  }, [printRequested])

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

  const L = (texto) => translateLabel(lang, texto)
  const V = (chave, original) => (lang === 'en' ? (translated[chave] ?? original) : original)

  function collectFreeTextFields() {
    const fields = {
      queixa_principal: dados.queixa_principal,
      trat_ocular_previo: dados.trat_ocular_previo,
      diag_ocular_previo: dados.diag_ocular_previo,
      aspecto_geral: dados.aspecto_geral,
      doencas_pre: dados.doencas_pre,
      trat_sistemico: dados.trat_sistemico,
      cirurgias: dados.cirurgias,
      observacoes_historico: dados.observacoes_historico,
      petisco_obs: flags.petisco,
      esterelizacao_obs: flags.esterelizacao_obs,
      vacinas_obs: flags.vacinas_obs,
      ectoparasitas_obs: flags.ectoparasitas_obs,
      exame_comentarios: exame.comentarios,
      diagnostico: dados.diagnostico,
      tratamento: dados.tratamento,
      observacoes: dados.observacoes,
    }
    SINAIS.forEach(s => { fields[`sinal_obs_${s}`] = sinais[s]?.obs })
    REFLEXOS.forEach(r => { fields[`reflexo_obs_${r}`] = exame.reflexos?.[r]?.obs })
    TESTES.forEach(t => {
      fields[`testes_${t}_OD`] = exame.testes?.[t]?.OD
      fields[`testes_${t}_OE`] = exame.testes?.[t]?.OE
    })
    SEGMENTAR.forEach(s => {
      fields[`segmentar_${s}_OD`] = exame.segmentar?.[s]?.OD
      fields[`segmentar_${s}_OE`] = exame.segmentar?.[s]?.OE
    })
    return fields
  }

  async function exportarPT() {
    setLang('pt')
    setPrintRequested(true)
  }

  async function exportarEN() {
    setTranslateError(null)
    if (Object.keys(translated).length === 0) {
      setTranslating(true)
      try {
        const result = await translateFreeTextFields(collectFreeTextFields())
        setTranslated(result)
      } catch (e) {
        setTranslateError('Erro ao traduzir. Verifica a ligação e tenta novamente.')
        setTranslating(false)
        return
      }
      setTranslating(false)
    }
    setLang('en')
    setPrintRequested(true)
  }

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="ver-root" style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
        <div className="ver-inner" style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* CABEÇALHO */}
          <div className="no-print">
          <Header
            subtitulo="Ficha de atendimento"
            botoes={<>
              <button onClick={() => navigate(`/editar/${id}`)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #534AB7', background: '#EEEDFE', color: '#534AB7', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>✏️ Editar</button>
              <button onClick={exportarPT} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1D9E75', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🖨️ Exportar PDF</button>
              <button onClick={exportarEN} disabled={translating} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: translating ? '#a9a4e8' : '#534AB7', color: 'white', fontSize: 13, fontWeight: 600, cursor: translating ? 'not-allowed' : 'pointer' }}>
                {translating ? 'A traduzir...' : '🇬🇧 Exportar PDF (EN)'}
              </button>
              <button onClick={() => navigate('/consultar')} style={btnNav}>← Voltar</button>
              <button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>
            </>}
          />
          {translateError && (
            <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 12 }}>
              {translateError}
            </div>
          )}
        </div>


          {/* CABEÇALHO DA FICHA — visível só na impressão */}
          <div style={{ display: 'none' }} id="print-header">
            <style>{`#print-header { display: none; } @media print { #print-header { display: block !important; text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #534AB7; } }`}</style>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#534AB7' }}>írisvet</div>
            <div style={{ fontSize: 10, color: '#888' }}>Dra. Anna Clara B. Hussein Zanuto · OMV 10.122 · PT: +351 916720461 · annaoftalmovet.com.pt</div>
          </div>

          {/* SESSÃO 1+2 */}
          <Card>
            <SeccaoTitulo>{L('Consulta')}</SeccaoTitulo>
            <Grid2>
              <Campo label={L('Data')} valor={dados.data} />
              <Campo label={L('Local / Clínica')} valor={dados.local} />
              <Campo label={L('Tipo de atendimento')} valor={L(dados.tipo_atendimento)} />
            </Grid2>
            <Divider />
            <SeccaoTitulo>{L('Cliente (Tutor)')}</SeccaoTitulo>
            <Grid2>
              <Campo label={L('Nome')} valor={tutor.nome} />
              <Campo label={L('Telefone')} valor={tutor.telefone} />
              <Campo label={L('NIF / CPF')} valor={tutor.nif} />
              <Campo label={L('Email')} valor={tutor.email} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Campo label={L('Morada')} valor={tutor.morada} />
              </div>
            </Grid2>
            <Divider />
            <SeccaoTitulo>{L('Paciente')}</SeccaoTitulo>
            <Grid2>
              <Campo label={L('Nome do animal')} valor={paciente.nome ? `${ESPECIE_EMOJI[paciente.especie] || ''} ${paciente.nome}`.trim() : ''} />
              <Campo label={L('Espécie')} valor={L(paciente.especie)} />
              <Campo label={L('Raça')} valor={paciente.raca} />
              <Campo label={L('Género')} valor={L(paciente.genero)} />
              <Campo label={L('Data de nascimento')} valor={paciente.data_nascimento} />
            </Grid2>
          </Card>

          {/* ANAMNESE */}
          <Card>
            <SeccaoTitulo>{L('Queixa ocular principal')}</SeccaoTitulo>
            <Campo label={L('Queixa')} valor={V('queixa_principal', dados.queixa_principal)} />
            <Divider />
            <SeccaoTitulo>{L('Sinais clínicos')}</SeccaoTitulo>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={thStyle}>{L('Sinal')}</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>OD</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>{L('OE')}</th>
                  <th style={thStyle}>{L('Observação')}</th>
                </tr>
              </thead>
              <tbody>
                {SINAIS.map((s, i) => (
                  <tr key={s} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={tdStyle}>{L(s)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={sinais[s]?.OD} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={sinais[s]?.OE} /></td>
                    <td style={tdStyle}>{V(`sinal_obs_${s}`, sinais[s]?.obs) || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Divider />
            <SeccaoTitulo>{L('Histórico ocular')}</SeccaoTitulo>
            <Grid2>
              <Campo label={L('Tratamento ocular prévio')} valor={V('trat_ocular_previo', dados.trat_ocular_previo)} />
              <Campo label={L('Diagnóstico ocular prévio')} valor={V('diag_ocular_previo', dados.diag_ocular_previo)} />
            </Grid2>
          </Card>

          {/* HISTÓRICO */}
          <Card>
            <SeccaoTitulo>{L('Saúde geral')}</SeccaoTitulo>
            <Campo label={L('Aspecto geral')} valor={V('aspecto_geral', dados.aspecto_geral)} />
            <Campo label={L('Doenças pré-existentes')} valor={V('doencas_pre', dados.doencas_pre)} />
            <Campo label={L('Tratamento sistémico')} valor={V('trat_sistemico', dados.trat_sistemico)} />
            <Campo label={L('Cirurgias gerais')} valor={V('cirurgias', dados.cirurgias)} />
            <Campo label={L('Observações')} valor={V('observacoes_historico', dados.observacoes_historico)} />
            <Divider />
            <SeccaoTitulo>{L('Alimentação')}</SeccaoTitulo>
            {alimentacao.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {alimentacao.map(a => (
                  <span key={a} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '2px solid #534AB7', background: '#EEEDFE', color: '#534AB7', fontWeight: 600 }}>✓ {L(a)}</span>
                ))}
              </div>
            ) : <div style={{ fontSize: 13, color: '#ccc', marginBottom: 12 }}>—</div>}
            <Campo label={L('Observações')} valor={V('petisco_obs', flags.petisco)} />
            <Divider />
            <SeccaoTitulo>{L('Outros')}</SeccaoTitulo>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { campo: 'esterelizacao', label: 'Esterelização' },
                { campo: 'vacinas', label: 'Vacinas em dia' },
                { campo: 'ectoparasitas', label: 'Presença de Ectoparasitas' },
              ].map(({ campo, label }) => (
                <div key={campo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <CheckBox checked={flags[campo]} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{L(label)}</span>
                  </div>
                  <div style={{ marginLeft: 28, padding: '8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fafafa', fontSize: 13, color: flags[`${campo}_obs`] ? '#555' : '#ccc', minHeight: 36 }}>
                    {V(`${campo}_obs`, flags[`${campo}_obs`]) || '—'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* EXAME */}
          <Card>
            <SeccaoTitulo>{L('Reflexos e avaliação neuro-visual')}</SeccaoTitulo>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={thStyle}>{L('Parâmetro')}</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>OD</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 50 }}>{L('OE')}</th>
                  <th style={thStyle}>{L('Observação')}</th>
                </tr>
              </thead>
              <tbody>
                {REFLEXOS.map((r, i) => (
                  <tr key={r} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ ...tdStyle, fontSize: 13 }}>{L(r)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={exame.reflexos?.[r]?.OD} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><CheckBox checked={exame.reflexos?.[r]?.OE} /></td>
                    <td style={tdStyle}>{V(`reflexo_obs_${r}`, exame.reflexos?.[r]?.obs) || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Divider />
            <TabelaVer titulo="Testes Oftálmicos" linhas={TESTES} secao={exame.testes} lang={lang} V={V} keyPrefix="testes" />
            <Divider />
            <TabelaVer titulo="Avaliação Segmentar" linhas={SEGMENTAR} secao={exame.segmentar} lang={lang} V={V} keyPrefix="segmentar" />
            <Divider />
            <Campo label={L('Comentários')} valor={V('exame_comentarios', exame.comentarios)} />
          </Card>

          {/* DIAGNÓSTICO */}
          <Card>
            <SeccaoTitulo>{L('Diagnóstico e Tratamento')}</SeccaoTitulo>
            <Campo label={L('Diagnóstico')} valor={V('diagnostico', dados.diagnostico)} />
            <Campo label={L('Tratamento / Receituário')} valor={V('tratamento', dados.tratamento)} />
            <Campo label={L('Observações e procedimentos realizados')} valor={V('observacoes', dados.observacoes)} />
          </Card>

          {/* IMAGENS */}
          <Card>
            <SeccaoTitulo>{L('Imagens')}</SeccaoTitulo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[{ olho: 'OD', imagens: imagensOD, label: 'Olho Direito (OD)' },
                { olho: 'OE', imagens: imagensOE, label: 'Olho Esquerdo (OE)' }
              ].map(({ imagens, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textAlign: 'center' }}>{L(label)}</div>
                  {imagens.length > 0 ? imagens.map((img, i) => (
                    <img key={i} src={img.preview} alt=""
                      style={{ width: '100%', borderRadius: 10, marginBottom: 10, objectFit: 'cover', border: '1px solid #eee' }} />
                  )) : (
                    <div style={{ border: '2px dashed #eee', borderRadius: 10, padding: 24, textAlign: 'center', fontSize: 13, color: '#ccc' }}>
                      {L('Sem imagens')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

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
