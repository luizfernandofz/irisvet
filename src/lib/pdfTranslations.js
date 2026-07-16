// Dicionário PT -> EN para os textos fixos da ficha (títulos, labels,
// cabeçalhos de tabela, valores de enum e listas de sinais/reflexos).
// Traduzido à mão em vez de via DeepL: é um vocabulário pequeno e fixo,
// não vale a pena gastar chamadas à API nem depender da rede para isto.
// Convenção oftalmológica: OE (olho esquerdo) -> OS (oculus sinister).
export const EN_LABELS = {
  // secções
  'Consulta': 'Visit',
  'Cliente (Tutor)': 'Client (Owner)',
  'Paciente': 'Patient',
  'Queixa ocular principal': 'Main ocular complaint',
  'Sinais clínicos': 'Clinical signs',
  'Histórico ocular': 'Ocular history',
  'Saúde geral': 'General health',
  'Alimentação': 'Diet',
  'Outros': 'Other',
  'Reflexos e avaliação neuro-visual': 'Reflexes and neuro-visual assessment',
  'Diagnóstico e Tratamento': 'Diagnosis and Treatment',
  'Imagens': 'Images',
  'Avaliação clínica': 'Clinical assessment',

  // labels de campo
  'Data': 'Date',
  'Local / Clínica': 'Location / Clinic',
  'Tipo de atendimento': 'Visit type',
  'Nome': 'Name',
  'Telefone': 'Phone',
  'NIF / CPF': 'Tax ID',
  'Email': 'Email',
  'Morada': 'Address',
  'Nome do animal': 'Animal name',
  'Espécie': 'Species',
  'Raça': 'Breed',
  'Género': 'Sex',
  'Data de nascimento': 'Date of birth',
  'Queixa': 'Complaint',
  'Tratamento ocular prévio': 'Previous ocular treatment',
  'Diagnóstico ocular prévio': 'Previous ocular diagnosis',
  'Aspecto geral': 'General appearance',
  'Doenças pré-existentes': 'Pre-existing conditions',
  'Tratamento sistémico': 'Systemic treatment',
  'Cirurgias gerais': 'General surgeries',
  'Observações': 'Notes',
  'Comentários': 'Comments',
  'Diagnóstico': 'Diagnosis',
  'Tratamento / Receituário': 'Treatment / Prescription',
  'Observações e procedimentos realizados': 'Notes and procedures performed',
  'Tutor': 'Owner',
  'Motivo': 'Reason',
  'Avaliação': 'Assessment',
  'Tratamento': 'Treatment',

  // cabeçalhos de tabela
  'Parâmetro': 'Parameter',
  'Sinal': 'Sign',
  'OE': 'OS',
  'Observação': 'Note',

  // outros literais
  'Esterelização': 'Sterilization',
  'Vacinas em dia': 'Vaccines up to date',
  'Presença de Ectoparasitas': 'Presence of ectoparasites',
  'Testes Oftálmicos': 'Ophthalmic Tests',
  'Avaliação Segmentar': 'Segmental Evaluation',
  'Olho Direito (OD)': 'Right Eye (OD)',
  'Olho Esquerdo (OE)': 'Left Eye (OS)',
  'Sem imagens': 'No images',

  // valores de enum
  'canino': 'Canine', 'felino': 'Feline', 'roedor': 'Rodent',
  'equino': 'Equine', 'ave': 'Bird', 'outro': 'Other',
  'macho': 'Male', 'femea': 'Female', 'desconhecido': 'Unknown',
  'Retorno/Reavaliação': 'Follow-up/Reassessment',
  'Exame Complementar': 'Complementary Exam',
  'Intervenção': 'Intervention',

  // sinais clínicos
  'Hiperemia': 'Hyperemia', 'Secreção': 'Discharge', 'Lacrimejamento': 'Epiphora',
  'Blefarospasmo': 'Blepharospasm', 'Prurido': 'Pruritus', 'Fotofobia': 'Photophobia',
  'Sangramento': 'Bleeding', 'Neoformação': 'Mass/growth', 'Bulbo ocular': 'Globe',
  'Déficit visual': 'Visual deficit',

  // reflexos
  'Ofuscamento': 'Dazzle reflex', 'Resposta à Ameaça': 'Menace response',
  'RPL Direto': 'Direct PLR', 'RPL Consensual': 'Consensual PLR',
  'RPL Vermelho': 'Red-light PLR', 'RPL Azul': 'Blue-light PLR',

  // testes oftálmicos
  'TLS (mm/min)': 'STT (mm/min)', 'PIO (mmHg)': 'IOP (mmHg)',
  'Corantes': 'Staining', 'Teste de Jones': 'Jones test', 'Seidel': 'Seidel test',

  // avaliação segmentar
  'Bulbo Ocular': 'Globe', 'Aparelho Lacrimal': 'Lacrimal apparatus',
  'Pálpebras': 'Eyelids', 'Conjuntiva e Esclera': 'Conjunctiva and Sclera',
  'Córnea': 'Cornea', 'Câmara Anterior': 'Anterior Chamber',
  'Íris e Pupila': 'Iris and Pupil', 'Lente': 'Lens',
  'Retina e Vítreo': 'Retina and Vitreous',

  // alimentação
  'Ração Seca Comum': 'Regular Dry Food', 'Ração de Tratamento': 'Prescription Diet',
  'Ração Húmida': 'Wet Food', 'Alimentação Natural': 'Natural/Homemade Diet',
  'Sobras de Comida': 'Table Scraps', 'Petiscos': 'Treats',
}

export function translateLabel(lang, text) {
  if (lang !== 'en' || !text) return text
  return EN_LABELS[text] ?? text
}

// Traduz um dicionário {chave: texto} via /api/translate (DeepL), só para
// as entradas com conteúdo. Devolve {chave: textoTraduzido}.
export async function translateFreeTextFields(fields) {
  const entries = Object.entries(fields).filter(([, v]) => v && String(v).trim())
  if (entries.length === 0) return {}

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: entries.map(([, v]) => v) }),
  })
  if (!res.ok) throw new Error('Falha ao traduzir')
  const { translations } = await res.json()

  const result = {}
  entries.forEach(([key], i) => { result[key] = translations[i] })
  return result
}
