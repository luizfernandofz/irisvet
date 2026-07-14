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
  { nome: 'Câmara Anterior', atalhos: ['NDN', 'NV'] },
  { nome: 'Íris e Pupila', atalhos: ['NDN', 'NV'] },
  { nome: 'Lente', atalhos: ['NDN', 'NV'] },
  { nome: 'Retina e Vítreo', atalhos: ['NDN', 'RF+'] },
]

const ATALHO_TEXTO = {
  NDN: 'Nada Digno de Nota',
  NR: 'Não Realizado',
  NV: 'Não Visualizado',
  'RF+': 'Reflexo de Fundo Positivo',
}

const ATALHO_COR = {
  NDN:  { bg: '#69dfaa7c', color: '#8b8b8b', border: '#478f7faf' },
  NR:   { bg: '#af585842', color: '#8b8b8b', border: '#bd838377' },
  NV:   { bg: '#cccccc80', color: '#8b8b8b', border: '#1414147e' },
  'RF+': { bg: '#d4895d5e', color: '#8b8b8b', border: '#ad77447e' },
}

function BtnRapido({ label, onClick }) {
  const cor = ATALHO_COR[label] || { bg: '#f5f4fe', color: '#534AB7', border: '#ddd' }
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

  function setAtalho(campo, atalho) {
    const texto = ATALHO_TEXTO[atalho] || atalho
    const actual = dados.exame_oftalmologico || {}
    const campoActual = (actual[secao] || {})[campo] || {}
    const jaPreenchido = campoActual.OD === texto && campoActual.OE === texto
    onChange({
      ...dados,
      exame_oftalmologico: {
        ...actual,
        [secao]: {
          ...(actual[secao] || {}),
          [campo]: {
            OD: jaPreenchido ? '' : texto,
            OE: jaPreenchido ? '' : texto
          }
        }
      }
    })
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
              <th style={{ ...thStyle, width: 100 }}>Atalhos</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ nome, atalhos }, i) => (
              <tr key={nome} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap', width: 160, fontSize: 13 }}>{nome}</td>
                <td style={tdStyle}>
                  <AutoTextarea
                    value={secaoData[nome]?.OD || ''}
                    onChange={e => setValor(nome, 'OD', e.target.value)}
                    placeholder="—"
                    style={{ border: '1px solid #eee', background: 'transparent', fontSize: 12, padding: '5px 8px', borderRadius: 6 }}
                  />
                </td>
                <td style={tdStyle}>
                  <AutoTextarea
                    value={secaoData[nome]?.OE || ''}
                    onChange={e => setValor(nome, 'OE', e.target.value)}
                    placeholder="—"
                    style={{ border: '1px solid #eee', background: 'transparent', fontSize: 12, padding: '5px 8px', borderRadius: 6 }}
                  />
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {atalhos.map(a => (
                      <BtnRapido key={a} label={a} onClick={() => setAtalho(nome, a)} />
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
                <tr key={r} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', width: 160, fontSize: 13 }}>{r}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={reflexos[r]?.OD || false}
                      onChange={e => setReflexo(r, 'OD', e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#534AB7' }}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={reflexos[r]?.OE || false}
                      onChange={e => setReflexo(r, 'OE', e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#534AB7' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <AutoTextarea
                      value={reflexos[r]?.obs || ''}
                      onChange={e => setReflexoObs(r, e.target.value)}
                      placeholder="—"
                      style={{ border: '1px solid #eee', background: 'transparent', fontSize: 12, padding: '5px 8px', borderRadius: 6 }}
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
  fontSize: 11, fontWeight: 600, color: '#534AB7',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12
}

const thStyle = {
  textAlign: 'left', padding: '10px 12px', fontSize: 12,
  fontWeight: 600, color: '#555', borderBottom: '2px solid #eee',
  background: '#f5f4fe'
}

const tdStyle = {
  padding: '8px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top'
}