import { MOEDAS, simboloMoeda } from '../lib/financeiro'

// Trio Moeda / Valor / Deslocamento, usado lado a lado com o campo "Tipo de
// atendimento" na primeira página de cada ficha (consulta, retorno/
// reavaliação, exame complementar, intervenção). Devolve 3 itens de grid —
// o componente pai é responsável por definir gridTemplateColumns.
export default function CamposFinanceiros({ moeda, valor, deslocamento, onChange }) {
  const semMoeda = !moeda
  const simbolo = simboloMoeda(moeda)

  function campoValor(campo, label, valorAtual) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div style={{ position: 'relative' }}>
          {simbolo && <span style={prefixStyle}>{simbolo}</span>}
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder={semMoeda ? 'Seleciona a moeda' : '0,00'}
            value={valorAtual ?? ''}
            onChange={e => onChange(campo, e.target.value)}
            disabled={semMoeda}
            style={{
              ...inputStyle,
              paddingLeft: simbolo ? 32 : 12,
              background: semMoeda ? 'var(--iv-line)' : inputStyle.background,
              color: semMoeda ? 'var(--iv-ink-muted)' : inputStyle.color,
              cursor: semMoeda ? 'not-allowed' : 'text',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div>
        <label style={labelStyle}>Moeda</label>
        <select value={moeda || ''} onChange={e => onChange('moeda', e.target.value)} style={inputStyle}>
          <option value="">Seleccionar...</option>
          {MOEDAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      {campoValor('valor', 'Valor', valor)}
      {campoValor('deslocamento', 'Deslocamento', deslocamento)}
    </>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--iv-ink-muted)', marginBottom: 6
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--iv-line)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: 'var(--iv-bg)', fontFamily: 'inherit',
  color: 'var(--iv-ink)'
}

const prefixStyle = {
  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
  fontSize: 13, color: 'var(--iv-ink-muted)', pointerEvents: 'none'
}
