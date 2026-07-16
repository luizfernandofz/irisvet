function Card({ children }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(83,74,183,0.08)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function SeccaoTitulo({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, background: '#f0f0f0', borderRadius: 6, padding: '6px 10px', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }}>{label}</label>
      <div style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', background: '#fafafa', color: valor ? '#222' : '#ccc', whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word', minHeight: 40 }}>
        {valor || '—'}
      </div>
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

const btnNav = { padding: '10px 24px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 14, cursor: 'pointer' }

export default function RevisaoReavaliacao({ dados, patientInfo, onEditar, onFinalizar, finalizing, erro, labelFinalizar = '✓ Finalizar e guardar ficha' }) {
  const imagensOD = dados.imagens_OD || []
  const imagensOE = dados.imagens_OE || []

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fe', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7' }}>írisvet</div>
            <div style={{ fontSize: 13, color: '#888' }}>Revisão do retorno / reavaliação</div>
          </div>
          <button onClick={onEditar} style={btnNav}>← Voltar a editar</button>
        </div>

        {patientInfo && (
          <div style={{ background: '#EEEDFE', borderRadius: 12, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: '#534AB7' }}>
            <strong>{patientInfo.nome}</strong>
            {patientInfo.raca ? ` · ${patientInfo.raca}` : ''}
            {patientInfo.tutor ? ` · Tutor: ${patientInfo.tutor}` : ''}
          </div>
        )}

        <Card>
          <SeccaoTitulo>Consulta</SeccaoTitulo>
          <Grid2>
            <Campo label="Data" valor={dados.data} />
            <Campo label="Local / Clínica" valor={dados.local} />
            <Campo label="Tipo de atendimento" valor={dados.tipo_atendimento} />
          </Grid2>
          <Campo label="Motivo" valor={dados.motivo} />
        </Card>

        <Card>
          <SeccaoTitulo>Avaliação clínica</SeccaoTitulo>
          <Campo label="Avaliação" valor={dados.avaliacao} />
          <Campo label="Diagnóstico" valor={dados.diagnostico} />
          <Campo label="Tratamento" valor={dados.tratamento} />
        </Card>

        <Card>
          <SeccaoTitulo>Imagens</SeccaoTitulo>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[{ imagens: imagensOD, label: 'Olho Direito (OD)' }, { imagens: imagensOE, label: 'Olho Esquerdo (OE)' }].map(({ imagens, label }) => (
              <div key={label}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textAlign: 'center' }}>{label}</div>
                {imagens.length > 0 ? imagens.map((img, i) => (
                  <img key={i} src={img.preview} alt={img.nome || ''} style={{ width: '100%', borderRadius: 10, marginBottom: 10, objectFit: 'cover', border: '1px solid #eee' }} />
                )) : (
                  <div style={{ border: '2px dashed #eee', borderRadius: 10, padding: 24, textAlign: 'center', fontSize: 13, color: '#ccc' }}>Sem imagens</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {erro && (
          <div style={{ background: '#FAECE7', color: '#993C1D', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 40 }}>
          <button onClick={onEditar} style={btnNav}>← Voltar a editar</button>
          <button onClick={onFinalizar} disabled={finalizing}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: finalizing ? '#a9a4e8' : '#1D9E75', color: 'white', fontSize: 14, fontWeight: 600, cursor: finalizing ? 'not-allowed' : 'pointer' }}>
            {finalizing ? 'A guardar...' : labelFinalizar}
          </button>
        </div>

      </div>
    </div>
  )
}
