import AutoTextarea from './AutoTextarea'

const SINAIS = [
  'Hiperemia',
  'Secreção',
  'Lacrimejamento',
  'Blefarospasmo',
  'Prurido',
  'Fotofobia',
  'Sangramento',
  'Neoformação',
  'Bulbo ocular',
  'Déficit visual',
]

export default function Sessao3({ dados, onChange }) {
  function set(campo, valor) {
    onChange({ ...dados, [campo]: valor })
  }

  function setSinal(sinal, olho, valor) {
    const sinais = dados.sinais || {}
    onChange({
      ...dados,
      sinais: {
        ...sinais,
        [sinal]: {
          ...(sinais[sinal] || {}),
          [olho]: valor
        }
      }
    })
  }

  function setObs(sinal, valor) {
    const sinais = dados.sinais || {}
    onChange({
      ...dados,
      sinais: {
        ...sinais,
        [sinal]: {
          ...(sinais[sinal] || {}),
          obs: valor
        }
      }
    })
  }

  const sinais = dados.sinais || {}

  return (
    <div>
      {/* QUEIXA PRINCIPAL */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Queixa ocular principal</div>
        <AutoTextarea
          value={dados.queixa_principal || ''}
          onChange={e => set('queixa_principal', e.target.value)}
          placeholder="Descreva a queixa principal..."
        />
      </div>

      {/* SINAIS CLÍNICOS */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Sinais clínicos</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={thStyle}>Sinal</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>OD</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>OE</th>
                <th style={thStyle}>Observação</th>
              </tr>
            </thead>
            <tbody>
              {SINAIS.map((sinal, i) => (
                <tr key={sinal} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                  <td style={tdStyle}>{sinal}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={sinais[sinal]?.OD || false}
                      onChange={e => setSinal(sinal, 'OD', e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#534AB7' }}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={sinais[sinal]?.OE || false}
                      onChange={e => setSinal(sinal, 'OE', e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#534AB7' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={sinais[sinal]?.obs || ''}
                      onChange={e => setObs(sinal, e.target.value)}
                      placeholder="—"
                      style={{
                        width: '100%', padding: '6px 10px', borderRadius: 6,
                        border: '1px solid #eee', fontSize: 13, outline: 'none',
                        boxSizing: 'border-box', background: 'transparent', fontFamily: 'inherit'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTÓRICO OCULAR */}
      <div style={sectionTitleStyle}>Histórico ocular</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Tratamento ocular prévio</label>
          <AutoTextarea
            value={dados.trat_ocular_previo || ''}
            onChange={e => set('trat_ocular_previo', e.target.value)}
            placeholder="Medicação prévia..."
          />
        </div>
        <div>
          <label style={labelStyle}>Diagnóstico ocular prévio</label>
          <AutoTextarea
            value={dados.diag_ocular_previo || ''}
            onChange={e => set('diag_ocular_previo', e.target.value)}
            placeholder="Diagnóstico anterior..."
          />
        </div>
      </div>
    </div>
  )
}

const sectionTitleStyle = {
  fontSize: 11, fontWeight: 600, color: '#534AB7',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6
}

const thStyle = {
  textAlign: 'left', padding: '10px 12px', fontSize: 12,
  fontWeight: 600, color: '#555', borderBottom: '2px solid #eee',
  background: '#f5f4fe'
}

const tdStyle = {
  padding: '8px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle'
}