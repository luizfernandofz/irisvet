import AutoTextarea from './AutoTextarea'

const REFLEXOS = [
  'Blefarospasmo',
  'Ofuscamento',
  'Resposta à Ameaça',
  'RPL Direto',
  'RPL Consensual',
  'RPL Vermelho',
  'RPL Azul',
]

const TESTES = [
  { nome: 'TLS (mm/min)', atalhos: ['NR'] },
  { nome: 'PIO (mmHg)', atalhos: ['NR'] },
  { nome: 'Corantes', atalhos: ['NDN', 'NR'] },
  { nome: 'Teste de Jones', atalhos: ['NDN', 'NR'] },
  { nome: 'Seidel', atalhos: ['NDN', 'NR'] },
]

const SEGMENTAR = [
  { nome: 'Bulbo Ocular', atalhos: ['NDN'] },
  { nome: 'Aparelho Lacrimal', atalhos: ['NDN'] },
  { nome: 'Pálpebras', atalhos: ['NDN'] },
  { nome: 'Conjuntiva e Esclera', atalhos: ['NDN'] },
  { nome: 'Córnea', atalhos: ['NDN'] },
  { nome: 'Câmara Anterior', atalhos: ['NDN', 'PV', 'NV'] },
  { nome: 'Íris e Pupila', atalhos: ['NDN', 'PV', 'NV'] },
  { nome: 'Lente', atalhos: ['NDN', 'PV', 'NV'] },
  { nome: 'Retina e Vítreo', atalhos: ['NDN', 'RF+', 'PV', 'NV'] },
]

const ATALHO_TEXTO = {
  NDN: 'Nada Digno de Nota',
  NR: 'Não Realizado',
  NV: 'Não Visualizado',
  PV: 'Pouco Visualizado',
  'RF+': 'Reflexo de Fundo Positivo',
}

const ATALHO_COR = {
  NDN:  { bg: '#69dfaa7c', color: '#8b8b8b', border: '#478f7faf' },
  NR:   { bg: '#af585842', color: '#8b8b8b', border: '#bd838377' },
  NV:   { bg: '#cccccc80', color: '#8b8b8b', border: '#1414147e' },
  PV:   { bg: '#e7d15680', color: '#8b8b8b', border: '#b89f2d7e' },
  'RF+': { bg: '#d4895d5e', color: '#8b8b8b', border: '#ad77447e' },
}

function BtnRapido({ label, onClick }) {
  const cor = ATALHO_COR[label] || { bg: 'var(--iv-bg)', color: 'var(--iv-sage)', border: 'var(--iv-line)' }
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 7px', fontSize: 10, borderRadius: 6,
        border: `1px solid ${cor.border}`, background: cor.bg,
        color: cor.color, cursor: 'pointer', fontWeight: 600,
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </button>
  )
}

function TabelaOftalmologica({ titulo, linhas, secao, onChange, dados }) {
  function setValor(campo, olho, valor) {
    const actual = dados.exame_oftalmologico || {}
    onChange({
      ...dados,
      exame_oftalmologico: {
        ...actual,
        [secao]: {
          ...(actual[secao] || {}),
          [campo]: {
            ...((actual[secao] || {})[campo] || {}),
            [olho]: valor
          }
        }
      }
    })
  }

  function setAtalho(campo, olho, atalho) {
    const texto = ATALHO_TEXTO[atalho] || atalho
    const actual = dados.exame_oftalmologico || {}
    const campoActual = (actual[secao] || {})[campo] || {}
    const jaPreenchido = campoActual[olho] === texto
    setValor(campo, olho, jaPreenchido ? '' : texto)
  }

  const secaoData = (dados.exame_oftalmologico || {})[secao] || {}

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={sectionTitleStyle}>{titulo}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={thStyle}>Parâmetro</th>
              <th style={thStyle}>OD</th>
              <th style={thStyle}>OE</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ nome, atalhos }, i) => (
              <tr key={nome} style={{ background: i % 2 === 0 ? 'var(--iv-bg)' : 'var(--iv-surface)' }}>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap', width: 160, fontSize: 13 }}>{nome}</td>
                <td style={tdStyle}>
                  <AutoTextarea
                    value={secaoData[nome]?.OD || ''}
                    onChange={e => setValor(nome, 'OD', e.target.value)}
                    placeholder="—"
                    style={{ border: '1px solid var(--iv-line)', background: 'transparent', fontSize: 12, padding: '5px 8px', borderRadius: 6 }}
                  />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {atalhos.map(a => (
                      <BtnRapido key={a} label={a} onClick={() => setAtalho(nome, 'OD', a)} />
                    ))}
                  </div>
                </td>
                <td style={tdStyle}>
                  <AutoTextarea
                    value={secaoData[nome]?.OE || ''}
                    onChange={e => setValor(nome, 'OE', e.target.value)}
                    placeholder="—"
                    style={{ border: '1px solid var(--iv-line)', background: 'transparent', fontSize: 12, padding: '5px 8px', borderRadius: 6 }}
                  />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {atalhos.map(a => (
                      <BtnRapido key={a} label={a} onClick={() => setAtalho(nome, 'OE', a)} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Sessao5({ dados, onChange }) {
  const exame = dados.exame_oftalmologico || {}
  const reflexos = exame.reflexos || {}

  function setReflexo(campo, olho, valor) {
    onChange({
      ...dados,
      exame_oftalmologico: {
        ...exame,
        reflexos: {
          ...reflexos,
          [campo]: { ...(reflexos[campo] || {}), [olho]: valor }
        }
      }
    })
  }

  function setReflexoObs(campo, valor) {
    onChange({
      ...dados,
      exame_oftalmologico: {
        ...exame,
        reflexos: {
          ...reflexos,
          [campo]: { ...(reflexos[campo] || {}), obs: valor }
        }
      }
    })
  }

  function setComentarios(valor) {
    onChange({ ...dados, exame_oftalmologico: { ...exame, comentarios: valor } })
  }

  return (
    <div>

      {/* REFLEXOS */}
      <div style={{ marginBottom: 28 }}>
        <div style={sectionTitleStyle}>Reflexos e avaliação neuro-visual</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
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
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', width: 160, fontSize: 13 }}>{r}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={reflexos[r]?.OD || false}
                      onChange={e => setReflexo(r, 'OD', e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--iv-sage)' }}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={reflexos[r]?.OE || false}
                      onChange={e => setReflexo(r, 'OE', e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--iv-sage)' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <AutoTextarea
                      value={reflexos[r]?.obs || ''}
                      onChange={e => setReflexoObs(r, e.target.value)}
                      placeholder="—"
                      style={{ border: '1px solid var(--iv-line)', background: 'transparent', fontSize: 12, padding: '5px 8px', borderRadius: 6 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TESTES OFTÁLMICOS */}
      <TabelaOftalmologica
        titulo="Testes Oftálmicos"
        linhas={TESTES}
        secao="testes"
        onChange={onChange}
        dados={dados}
      />

      {/* AVALIAÇÃO SEGMENTAR */}
      <TabelaOftalmologica
        titulo="Avaliação Segmentar"
        linhas={SEGMENTAR}
        secao="segmentar"
        onChange={onChange}
        dados={dados}
      />

      {/* COMENTÁRIOS */}
      <div>
        <div style={sectionTitleStyle}>Comentários</div>
        <AutoTextarea
          value={exame.comentarios || ''}
          onChange={e => setComentarios(e.target.value)}
          placeholder="Observações adicionais sobre o exame..."
        />
      </div>

    </div>
  )
}

const sectionTitleStyle = {
  fontFamily: 'var(--iv-font-display)', fontSize: 12, fontWeight: 500, color: 'var(--iv-sage)',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12
}

const thStyle = {
  textAlign: 'left', padding: '10px 12px', fontSize: 12,
  fontWeight: 600, color: 'var(--iv-ink-muted)', borderBottom: '2px solid var(--iv-line)',
  background: 'var(--iv-bg)'
}

const tdStyle = {
  padding: '8px 12px', borderBottom: '1px solid var(--iv-line)', verticalAlign: 'top'
}