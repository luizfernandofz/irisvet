import AutoTextarea from './AutoTextarea'

export default function Sessao6({ dados, onChange }) {
  function set(campo, valor) {
    onChange({ ...dados, [campo]: valor })
  }

  return (
    <div>

      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Diagnóstico</div>
        <AutoTextarea
          value={dados.diagnostico || ''}
          onChange={e => set('diagnostico', e.target.value)}
          placeholder="Diagnóstico clínico..."
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Tratamento</div>
        <AutoTextarea
          value={dados.tratamento || ''}
          onChange={e => set('tratamento', e.target.value)}
          placeholder="Plano terapêutico, medicação prescrita..."
        />
      </div>

      <div>
        <div style={sectionTitleStyle}>Observações e procedimentos realizados</div>
        <AutoTextarea
          value={dados.observacoes || ''}
          onChange={e => set('observacoes', e.target.value)}
          placeholder="Procedimentos realizados durante a consulta, notas adicionais..."
        />
      </div>

    </div>
  )
}

const sectionTitleStyle = {
  fontSize: 11, fontWeight: 600, color: '#534AB7',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12
}