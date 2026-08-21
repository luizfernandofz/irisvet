import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarData } from '../lib/utils'
import { formatarValor } from '../lib/financeiro'
import Header from '../components/Header'

const TIPO_BADGE = {
  'Consulta': { bg: 'var(--iv-sage-light)', color: 'var(--iv-sage)', border: 'var(--iv-sage)' },
  'Retorno/Reavaliação': { bg: 'var(--iv-sage-light)', color: 'var(--iv-sage-dark)', border: 'var(--iv-sage)' },
  'Exame Complementar': { bg: 'var(--iv-plum-light)', color: 'var(--iv-plum-dark)', border: 'var(--iv-plum)' },
  'Intervenção': { bg: 'var(--iv-amber-light)', color: 'var(--iv-amber-dark)', border: 'var(--iv-amber)' },
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function badgeStyle(tipo) {
  const s = TIPO_BADGE[tipo] || { bg: 'var(--iv-line)', color: 'var(--iv-ink-muted)', border: 'var(--iv-line)' }
  return {
    fontSize: 10, padding: '2px 8px', borderRadius: 20,
    background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    fontWeight: 600, whiteSpace: 'nowrap'
  }
}

function ymDe(dataStr) {
  return (dataStr || '').slice(0, 7) // "AAAA-MM"
}

function labelYm(ym) {
  const [ano, mes] = ym.split('-')
  return `${MESES_ABREV[parseInt(mes, 10) - 1]}/${ano.slice(2)}`
}

function proximoYm(ym) {
  let [ano, mes] = ym.split('-').map(Number)
  mes += 1
  if (mes > 12) { mes = 1; ano += 1 }
  return `${ano}-${String(mes).padStart(2, '0')}`
}

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function primeiroDiaDoAno() {
  return `${new Date().getFullYear()}-01-01`
}

function primeiroDiaDoMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [registros, setRegistros] = useState([])
  const [dataDe, setDataDe] = useState(primeiroDiaDoAno())
  const [dataAte, setDataAte] = useState(hoje())
  const [moedaGrafico, setMoedaGrafico] = useState('EUR')
  const [hoverBarra, setHoverBarra] = useState(null)

  useEffect(() => {
    async function fetchDados() {
      setLoading(true)
      const campos = 'id, data, tipo_atendimento, local, moeda, valor, deslocamento, patients(nome, tutors(nome))'
      const [{ data: cons }, { data: fus }] = await Promise.all([
        supabase.from('consultations').select(campos),
        supabase.from('follow_ups').select(campos),
      ])
      const normalizar = (lista, tabela) => (lista || []).map(r => ({
        id: r.id,
        tabela,
        data: r.data,
        tipo_atendimento: r.tipo_atendimento || (tabela === 'consultations' ? 'Consulta' : 'Retorno/Reavaliação'),
        local: r.local || '',
        moeda: r.moeda || null,
        valor: r.valor,
        deslocamento: r.deslocamento,
        paciente_nome: r.patients?.nome || '',
        tutor_nome: r.patients?.tutors?.nome || '',
      }))
      setRegistros([...normalizar(cons, 'consultations'), ...normalizar(fus, 'follow_ups')])
      setLoading(false)
    }
    fetchDados()
  }, [])

  const filtrados = useMemo(() => {
    return registros
      .filter(r => r.data && (!dataDe || r.data >= dataDe) && (!dataAte || r.data <= dataAte))
      .sort((a, b) => b.data.localeCompare(a.data))
  }, [registros, dataDe, dataAte])

  const resumo = useMemo(() => {
    const porMoeda = { EUR: { total: 0, deslocamento: 0, meses: new Set(), contagem: 0 }, BRL: { total: 0, deslocamento: 0, meses: new Set(), contagem: 0 } }
    for (const r of filtrados) {
      if (r.moeda !== 'EUR' && r.moeda !== 'BRL') continue
      const bucket = porMoeda[r.moeda]
      if (typeof r.valor === 'number') {
        bucket.total += r.valor
        bucket.meses.add(ymDe(r.data))
        bucket.contagem += 1
      }
      if (typeof r.deslocamento === 'number') bucket.deslocamento += r.deslocamento
    }
    return porMoeda
  }, [filtrados])

  const barrasGrafico = useMemo(() => {
    const somaPorMes = {}
    for (const r of filtrados) {
      if (r.moeda !== moedaGrafico || typeof r.valor !== 'number') continue
      const ym = ymDe(r.data)
      somaPorMes[ym] = (somaPorMes[ym] || 0) + r.valor
    }
    const chaves = Object.keys(somaPorMes)
    if (chaves.length === 0) return []

    let sequencia
    if (dataDe && dataAte) {
      sequencia = []
      let cursor = ymDe(dataDe)
      const fim = ymDe(dataAte)
      let guarda = 0
      while (cursor <= fim && guarda < 240) {
        sequencia.push(cursor)
        cursor = proximoYm(cursor)
        guarda++
      }
    } else {
      sequencia = chaves.sort()
    }

    return sequencia.map(ym => ({ ym, label: labelYm(ym), total: somaPorMes[ym] || 0 }))
  }, [filtrados, moedaGrafico, dataDe, dataAte])

  function aplicarPreset(preset) {
    if (preset === 'mes') { setDataDe(primeiroDiaDoMes()); setDataAte(hoje()) }
    if (preset === 'ano') { setDataDe(primeiroDiaDoAno()); setDataAte(hoje()) }
    if (preset === 'tudo') { setDataDe(''); setDataAte('') }
  }

  const maxBarra = Math.max(...barrasGrafico.map(b => b.total), 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--iv-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <Header
          subtitulo="Dashboard financeiro"
          botoes={<button onClick={() => navigate('/')} style={btnNav}>🏠 Home</button>}
        />

        {/* FILTROS */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Período</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <button onClick={() => aplicarPreset('mes')} style={chipStyle}>Este mês</button>
            <button onClick={() => aplicarPreset('ano')} style={chipStyle}>Este ano</button>
            <button onClick={() => aplicarPreset('tudo')} style={chipStyle}>Tudo</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Data de</label>
              <input type="date" value={dataDe} onChange={e => setDataDe(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data até</label>
              <input type="date" value={dataAte} onChange={e => setDataAte(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--iv-ink-muted)', fontSize: 14 }}>A carregar dados financeiros...</div>
        ) : (
          <>
            {/* STAT TILES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <StatTile
                titulo="Faturamento Total"
                linhas={[
                  formatarValor(resumo.EUR.total, 'EUR') || '€ 0,00',
                  formatarValor(resumo.BRL.total, 'BRL') || 'R$ 0,00',
                ]}
              />
              <StatTile
                titulo="Faturamento Médio Mensal"
                linhas={[
                  formatarValor(resumo.EUR.meses.size ? resumo.EUR.total / resumo.EUR.meses.size : 0, 'EUR') || '€ 0,00',
                  formatarValor(resumo.BRL.meses.size ? resumo.BRL.total / resumo.BRL.meses.size : 0, 'BRL') || 'R$ 0,00',
                ]}
              />
              <StatTile
                titulo="Número de Atendimentos"
                destaque={String(filtrados.length)}
                linhas={[`${resumo.EUR.contagem} em EUR · ${resumo.BRL.contagem} em BRL`]}
              />
            </div>

            {/* DESLOCAMENTO — secundário */}
            <div style={{ ...cardStyle, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--iv-ink-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Deslocamento Total</span>
              <span style={{ fontSize: 14, color: 'var(--iv-ink-muted)' }}>
                {formatarValor(resumo.EUR.deslocamento, 'EUR') || '€ 0,00'} · {formatarValor(resumo.BRL.deslocamento, 'BRL') || 'R$ 0,00'}
              </span>
            </div>

            {/* GRÁFICO */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={sectionTitleStyle}>Faturamento por mês</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['EUR', 'BRL'].map(m => (
                    <button
                      key={m}
                      onClick={() => setMoedaGrafico(m)}
                      style={{
                        padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${moedaGrafico === m ? 'var(--iv-sage)' : 'var(--iv-line)'}`,
                        background: moedaGrafico === m ? 'var(--iv-sage)' : 'var(--iv-surface)',
                        color: moedaGrafico === m ? 'white' : 'var(--iv-ink-muted)',
                      }}
                    >{m}</button>
                  ))}
                </div>
              </div>

              {barrasGrafico.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--iv-ink-muted)', fontSize: 13 }}>
                  Sem faturamento registado em {moedaGrafico} neste período.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* eixo Y — coluna fixa, não faz scroll com as barras */}
                  <div style={{ position: 'relative', width: 52, flexShrink: 0, height: 220, paddingTop: 24 }}>
                    {[0.25, 0.5, 0.75, 1].map(f => (
                      <div key={f} style={{
                        position: 'absolute', right: 8, bottom: f * 180,
                        transform: 'translateY(50%)', fontSize: 10, color: 'var(--iv-ink-muted)', whiteSpace: 'nowrap'
                      }}>
                        {maxBarra > 0 ? formatarValor(maxBarra * f, moedaGrafico) : ''}
                      </div>
                    ))}
                  </div>

                  <div style={{ overflowX: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 220, minWidth: barrasGrafico.length * 56, position: 'relative', paddingTop: 24 }}>
                      {[0.25, 0.5, 0.75, 1].map(f => (
                        <div key={f} style={{
                          position: 'absolute', left: 0, right: 0, bottom: f * 180,
                          borderTop: '1px dashed var(--iv-line)'
                        }} />
                      ))}
                      {barrasGrafico.map(b => {
                        const alturaPct = maxBarra > 0 ? (b.total / maxBarra) : 0
                        const emHover = hoverBarra === b.ym
                        return (
                          <div key={b.ym} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 40px', zIndex: 1 }}>
                            {b.total > 0 && (
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--iv-sage)', marginBottom: 4, whiteSpace: 'nowrap' }}>
                                {formatarValor(b.total, moedaGrafico)}
                              </div>
                            )}
                            <div
                              onMouseEnter={() => setHoverBarra(b.ym)}
                              onMouseLeave={() => setHoverBarra(null)}
                              style={{
                                width: 24, height: Math.max(alturaPct * 180, b.total > 0 ? 3 : 0),
                                background: emHover ? 'var(--iv-sage-dark)' : 'var(--iv-sage)',
                                borderRadius: '4px 4px 0 0', cursor: 'pointer', transition: 'background 0.15s'
                              }}
                            />
                            <div style={{ fontSize: 10, color: 'var(--iv-ink-muted)', marginTop: 6, whiteSpace: 'nowrap' }}>{b.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LISTA DE ATENDIMENTOS */}
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--iv-line)', fontSize: 13, color: 'var(--iv-ink-muted)' }}>
                {filtrados.length} atendimento{filtrados.length !== 1 ? 's' : ''} no período
              </div>
              {filtrados.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--iv-ink-muted)', fontSize: 14 }}>Nenhum atendimento neste período</div>
              ) : (
                filtrados.map((r, i) => (
                  <div key={`${r.tabela}-${r.id}`} style={{
                    padding: '14px 24px', borderBottom: i < filtrados.length - 1 ? '1px solid var(--iv-line)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
                  }}>
                    <div style={{ minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={badgeStyle(r.tipo_atendimento)}>{r.tipo_atendimento}</span>
                        <span style={{ fontSize: 13, color: 'var(--iv-ink-muted)' }}>{formatarData(r.data)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--iv-ink)' }}>
                        {r.paciente_nome || 'Sem nome'}
                        {r.tutor_nome ? <span style={{ color: 'var(--iv-ink-muted)' }}> · {r.tutor_nome}</span> : ''}
                        {r.local ? <span style={{ color: 'var(--iv-ink-muted)' }}> · {r.local}</span> : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right', fontSize: 13 }}>
                        <div style={{ fontWeight: 600, color: r.valor != null ? 'var(--iv-ink)' : 'var(--iv-line)' }}>
                          {formatarValor(r.valor, r.moeda) || 'Sem valor'}
                        </div>
                        {r.deslocamento != null && r.deslocamento > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--iv-ink-muted)' }}>+ {formatarValor(r.deslocamento, r.moeda)} desloc.</div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(r.tabela === 'consultations' ? `/editar/${r.id}` : `/editar-reav/${r.id}`)}
                        style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--iv-plum)', background: 'transparent', color: 'var(--iv-plum-dark)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >✏️ Editar</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

function StatTile({ titulo, destaque, linhas }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--iv-ink-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        {titulo}
      </div>
      {destaque && (
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--iv-sage)', marginBottom: 4 }}>{destaque}</div>
      )}
      {linhas.map((l, i) => (
        <div key={i} style={{ fontSize: destaque ? 12 : 18, fontWeight: destaque ? 500 : 700, color: destaque ? 'var(--iv-ink-muted)' : 'var(--iv-ink)' }}>{l}</div>
      ))}
    </div>
  )
}

const cardStyle = {
  background: 'var(--iv-surface)', border: '0.5px solid var(--iv-line)', borderRadius: 12, padding: 24,
  boxShadow: '0 2px 16px rgba(91,110,88,0.08)', marginBottom: 16
}

const sectionTitleStyle = {
  fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)',
  textTransform: 'uppercase', letterSpacing: 1
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 4 }

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--iv-line)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--iv-bg)',
  fontFamily: 'inherit', color: 'var(--iv-ink)'
}

const chipStyle = {
  padding: '7px 16px', borderRadius: 20, border: '1px solid var(--iv-line)',
  background: 'var(--iv-surface)', color: 'var(--iv-sage)', fontSize: 12, fontWeight: 600, cursor: 'pointer'
}

const btnNav = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--iv-line)',
  background: 'var(--iv-surface)', color: 'var(--iv-ink-muted)', fontSize: 13, cursor: 'pointer'
}
