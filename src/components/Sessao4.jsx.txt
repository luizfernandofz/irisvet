import AutoTextarea from './AutoTextarea'

const FLAGS = [
  { campo: 'esterelizacao', label: 'Esterelização' },
  { campo: 'vacinas', label: 'Vacinas em dia' },
  { campo: 'ectoparasitas', label: 'Ectoparasitas' },
]

export default function Sessao4({ dados, onChange }) {
  function set(campo, valor) {
    onChange({ ...dados, [campo]: valor })
  }

  function setFlag(campo, valor) {
    const flags = dados.flags || {}
    onChange({ ...dados, flags: { ...flags, [campo]: valor } })
  }

  const flags = dados.flags || {}

  return (
    <div>
      {/* CAMPOS DE TEXTO */}
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
        </div>
      </div>

      <div style={dividerStyle} />

      {/* ALIMENTAÇÃO */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Alimentação</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Alimentação</label>
            <AutoTextarea
              value={dados.alimentacao || ''}
              onChange={e => set('alimentacao', e.target.value)}
              placeholder="Ex: Ração, comida húmida..."
            />
          </div>
          <div>
            <label style={labelStyle}>Petisco</label>
            <AutoTextarea
              value={dados.petisco || ''}
              onChange={e => set('petisco', e.target.value)}
              placeholder="Ex: Snacks, ossos..."
            />
          </div>
        </div>
      </div>

      <div style={dividerStyle} />

      {/* FLAGS / CHECKBOXES */}
      <div>
        <div style={sectionTitleStyle}>Outros</div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {FLAGS.map(({ campo, label }) => (
            <label key={campo} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 14, color: '#333', cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={flags[campo] || false}
                onChange={e => setFlag(campo, e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#534AB7' }}
              />
              {label}
            </label>
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