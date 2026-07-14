import AutoTextarea from './AutoTextarea'

const ALIMENTACAO_OPCOES = [
  'Ração Seca Comum',
  'Ração de Tratamento',
  'Ração Húmida',
  'Alimentação Natural',
  'Sobras de Comida',
  'Petiscos',
  'Outro',
]

const FLAGS = [
  { campo: 'esterelizacao', label: 'Esterelização' },
  { campo: 'vacinas', label: 'Vacinas em dia' },
  { campo: 'ectoparasitas', label: 'Presença de Ectoparasitas' },
]

export default function Sessao4({ dados, onChange }) {
  function set(campo, valor) {
    onChange({ ...dados, [campo]: valor })
  }

  function setFlag(campo, valor) {
    const flags = dados.flags || {}
    onChange({ ...dados, flags: { ...flags, [campo]: valor } })
  }

  function setFlagObs(campo, valor) {
    const flags = dados.flags || {}
    onChange({ ...dados, flags: { ...flags, [`${campo}_obs`]: valor } })
  }

  function toggleAlimentacao(opcao) {
    const actual = dados.alimentacao || []
    const nova = actual.includes(opcao)
      ? actual.filter(a => a !== opcao)
      : [...actual, opcao]
    set('alimentacao', nova)
  }

  const flags = dados.flags || {}
  const alimentacao = dados.alimentacao || []

  return (
    <div>
      {/* SAÚDE GERAL */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Saúde geral</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Aspecto geral</label>
            <AutoTextarea
              value={dados.aspecto_geral || ''}
              onChange={e => set('aspecto_geral', e.target.value)}
              placeholder="Estado geral do animal..."
            />
          </div>
          <div>
            <label style={labelStyle}>Doenças pré-existentes</label>
            <AutoTextarea
              value={dados.doencas_pre || ''}
              onChange={e => set('doencas_pre', e.target.value)}
              placeholder="Doenças conhecidas..."
            />
          </div>
          <div>
            <label style={labelStyle}>Tratamento sistémico</label>
            <AutoTextarea
              value={dados.trat_sistemico || ''}
              onChange={e => set('trat_sistemico', e.target.value)}
              placeholder="Medicação sistémica em curso..."
            />
          </div>
          <div>
            <label style={labelStyle}>Cirurgias gerais</label>
            <AutoTextarea
              value={dados.cirurgias || ''}
              onChange={e => set('cirurgias', e.target.value)}
              placeholder="Histórico cirúrgico..."
            />
          </div>
          <div>
            <label style={labelStyle}>Observações</label>
            <AutoTextarea
              value={dados.observacoes_historico || ''}
              onChange={e => set('observacoes_historico', e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>
        </div>
      </div>

      <div style={dividerStyle} />

      {/* ALIMENTAÇÃO */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Alimentação</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {ALIMENTACAO_OPCOES.map(opcao => {
            const selected = alimentacao.includes(opcao)
            return (
              <button
                key={opcao}
                onClick={() => toggleAlimentacao(opcao)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13,
                  border: selected ? '2px solid #534AB7' : '2px solid #ddd',
                  background: selected ? '#EEEDFE' : 'white',
                  color: selected ? '#534AB7' : '#555',
                  fontWeight: selected ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                {selected ? '✓ ' : ''}{opcao}
              </button>
            )
          })}
        </div>
        <div>
          <label style={labelStyle}>Observações</label>
          <AutoTextarea
            value={dados.petisco || ''}
            onChange={e => set('petisco', e.target.value)}
            placeholder="Ex: Snacks, ossos, bifinho..."
          />
        </div>
      </div>

      <div style={dividerStyle} />

      {/* FLAGS */}
      <div>
        <div style={sectionTitleStyle}>Outros</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FLAGS.map(({ campo, label }) => (
            <div key={campo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={flags[campo] || false}
                  onChange={e => setFlag(campo, e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#534AB7', flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{label}</span>
              </div>
              <AutoTextarea
                value={flags[`${campo}_obs`] || ''}
                onChange={e => setFlagObs(campo, e.target.value)}
                placeholder={`Detalhes sobre ${label.toLowerCase()}...`}
                style={{
                  marginLeft: 28,
                  border: '1px solid #eee',
                  background: '#fafafa',
                  fontSize: 13,
                }}
              />
            </div>
          ))}
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

const dividerStyle = {
  height: 1, background: '#f0f0f0', margin: '20px 0'
}