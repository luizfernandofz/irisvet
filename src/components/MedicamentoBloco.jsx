import {
  USO_OPCOES, DISTRIBUICAO_OPCOES, APRESENTACAO_OPCOES, ACAO_OPCOES,
  FORMATO_OPCOES, LOCAIS_GRUPOS, DURACAO_OPCOES, composerFraseMedicamento,
} from '../lib/receituarioOptions'

export default function MedicamentoBloco({ med, onChange, onRemover, indice }) {
  function set(campo, valor) {
    onChange({ ...med, [campo]: valor })
  }
  function toggleLocal(opcao) {
    const actual = med.locais || []
    const novo = actual.includes(opcao) ? actual.filter(l => l !== opcao) : [...actual, opcao]
    set('locais', novo)
  }

  const frase = composerFraseMedicamento(med)

  return (
    <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#534AB7' }}>Medicação {indice + 1}</div>
        <button type="button" onClick={onRemover} style={{ fontSize: 12, color: '#993C1D', background: 'none', border: 'none', cursor: 'pointer' }}>
          🗑 Remover
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Uso</label>
          <select value={med.uso} onChange={e => set('uso', e.target.value)} style={inputStyle}>
            <option value="">Seleccionar...</option>
            {USO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Distribuição</label>
          <select value={med.distribuicao} onChange={e => set('distribuicao', e.target.value)} style={inputStyle}>
            <option value="">Seleccionar...</option>
            {DISTRIBUICAO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Apresentação</label>
          <select value={med.apresentacao} onChange={e => set('apresentacao', e.target.value)} style={inputStyle}>
            <option value="">Seleccionar...</option>
            {APRESENTACAO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Medicação</label>
        <input type="text" value={med.medicacao} onChange={e => set('medicacao', e.target.value)} placeholder="Ex: Tobramicina col." style={inputStyle} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 8px' }}>
        Posologia
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Ação</label>
          <select value={med.acao} onChange={e => set('acao', e.target.value)} style={inputStyle}>
            <option value="">Seleccionar...</option>
            {ACAO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Quantidade</label>
          <input type="text" value={med.quantidade} onChange={e => set('quantidade', e.target.value)} placeholder="Ex: um, duas" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Formato</label>
          <select value={med.formato} onChange={e => set('formato', e.target.value)} style={inputStyle}>
            <option value="">Seleccionar...</option>
            {FORMATO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Local da aplicação</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          {LOCAIS_GRUPOS.map(g => (
            <div key={g.grupo}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', marginBottom: 6 }}>{g.grupo}</div>
              {g.opcoes.map(o => (
                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={(med.locais || []).includes(o)} onChange={() => toggleLocal(o)} />
                  {o}
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Frequência</label>
          <input type="text" value={med.frequencia} onChange={e => set('frequencia', e.target.value)} placeholder="Ex: 4x ao dia" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Duração</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={med.duracao_tipo} onChange={e => set('duracao_tipo', e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              <option value="">Seleccionar...</option>
              {DURACAO_OPCOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {med.duracao_tipo === 'durante' && (
              <input type="text" value={med.duracao_texto} onChange={e => set('duracao_texto', e.target.value)} placeholder="Ex: 7 dias" style={{ ...inputStyle, flex: 1 }} />
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Comentário</label>
        <input type="text" value={med.comentario} onChange={e => set('comentario', e.target.value)} placeholder="Opcional" style={inputStyle} />
      </div>

      {frase && (
        <div style={{ background: '#EEEDFE', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#534AB7', fontStyle: 'italic' }}>
          Pré-visualização: "{frase}"
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafafa',
  fontFamily: 'inherit', color: '#222',
}
