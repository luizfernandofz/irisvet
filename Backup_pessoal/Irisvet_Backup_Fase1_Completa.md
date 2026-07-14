# Projecto Írisvet — Backup de Estado
**Data:** 14 de Julho de 2026  
**Estado:** Fase 1 completa ✅

---

## Acessos e Repositórios

| Item | Valor |
|------|-------|
| App em produção | https://irisvet.vercel.app |
| Repositório GitHub | https://github.com/luizfernandofz/irisvet |
| Dashboard Supabase | https://supabase.com (projecto: irisvet) |
| Dashboard Vercel | https://vercel.com/irisvet/irisvet |
| Código local | C:\Users\luizf\irisvet |

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite |
| Base de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Storage de imagens | Supabase Storage (bucket: "images") |
| Geração de PDF | WeasyPrint (a implementar na Fase 5) |
| Hosting | Vercel (gratuito) |
| Fuzzy search | Fuse.js (a implementar na Fase 4) |

---

## O que está feito (Fase 1)

- ✅ Projecto Supabase criado com 5 tabelas
- ✅ RLS (Row Level Security) activado em todas as tabelas
- ✅ Bucket de Storage privado chamado "images" criado
- ✅ Utilizador da Dra. Anna criado no Supabase Auth
- ✅ Projecto React + Vite criado em C:\Users\luizf\irisvet
- ✅ Dependências instaladas: @supabase/supabase-js, react-router-dom
- ✅ Ficheiro .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- ✅ Cliente Supabase em src/lib/supabase.js
- ✅ Ecrã de login em src/pages/Login.jsx
- ✅ App.jsx com gestão de sessão (login/logout)
- ✅ Repositório GitHub: github.com/luizfernandofz/irisvet
- ✅ Deploy automático no Vercel
- ✅ Login funcional em produção: irisvet.vercel.app

---

## Estrutura de Ficheiros do Projecto

```
C:\Users\luizf\irisvet\
├── .env.local                  ← chaves do Supabase (NÃO commitar)
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── App.jsx                 ← gestão de sessão e routing raiz
    ├── App.css
    ├── main.jsx
    ├── index.css
    ├── lib/
    │   └── supabase.js         ← cliente Supabase
    └── pages/
        └── Login.jsx           ← ecrã de login
```

---

## Base de Dados — 5 Tabelas

### tutors
| Campo | Tipo |
|-------|------|
| id | uuid PK |
| nome | text |
| telefone | text |
| email | text |
| nif | text |
| morada | text |
| created_at | timestamptz |

### patients
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| tutor_id | uuid FK | → tutors.id |
| nome | text | |
| especie | enum | canino/felino/coelho/outro |
| raca | text | |
| data_nascimento | date | |
| genero | enum | macho/femea/desconhecido |
| created_at | timestamptz | |

### consultations
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| patient_id | uuid FK | → patients.id |
| data | date | |
| local | text | com autocomplete |
| tipo_atendimento | text | |
| queixa_principal | text | |
| sinais | jsonb | checkboxes OD/OE + observações |
| trat_ocular_previo | text | |
| diag_ocular_previo | text | |
| aspecto_geral | text | |
| doencas_pre | text | |
| trat_sistemico | text | |
| cirurgias | text | |
| flags | jsonb | esterelização/vacinas/ectoparasitas/alimentação |
| exame_oftalmologico | jsonb | todos os campos OD/OE |
| diagnostico | text | |
| tratamento | text | |
| observacoes | text | |
| status | enum | rascunho/finalizada |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-actualizado por trigger |

### follow_ups
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| consultation_id | uuid FK | → consultations.id |
| data | date | |
| local | text | |
| tipo_atendimento | text | |
| motivo | text | |
| avaliacao | text | |
| diagnostico | text | |
| tratamento | text | |
| created_at | timestamptz | |

### images
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| consultation_id | uuid FK nullable | → consultations.id |
| follow_up_id | uuid FK nullable | → follow_ups.id |
| olho | enum | OD/OE/ambos |
| storage_path | text | caminho no Supabase Storage |
| ordem | int | ordenação no PDF |
| created_at | timestamptz | |

---

## Formulário — Sessões

| Sessão | Conteúdo |
|--------|----------|
| 1+2 | Data, local (autocomplete), tipo atendimento; dados do tutor (nome, tel, NIF, email, morada); dados do paciente (nome, espécie+emoji, raça, data nasc., género) |
| 3 | Queixa principal; tabela de sinais OD/OE com checkboxes (hiperemia, secreção, lacrimejamento, blefarospasmo, prurido, fotofobia, sangramento, neoformação, bulbo ocular, déficit visual) + observação; tratamento e diagnóstico ocular prévio |
| 4 | Aspecto geral, doenças pré-existentes, tratamento sistémico, cirurgias; checkboxes esterelização/vacinas/ectoparasitas; alimentação e petisco |
| 5 | Exame oftalmológico OD/OE: reflexos (checkboxes), parâmetros segmentares (texto), PIO em mmHg; botões NDN e Não realizado |
| 6 | Diagnóstico, tratamento/receituário, observações e procedimentos |
| 7 | Upload de imagens OD e OE (JPEG/PNG/HEIC); preview; reordenar; upload para Supabase Storage |

---

## Decisões Confirmadas

- Auto-save por sessão como rascunho
- PDF A4 com logo írisvet em todas as páginas
- Grelha de imagens: 1 coluna OD + 1 coluna OE lado a lado, tamanho fixo
- WhatsApp via link temporário de 24h
- Email com PDF em anexo
- Impressão via browser nativo do iPad
- Versão inglês do PDF via toggle (só labels, não conteúdo clínico)
- Autocomplete de clínica por histórico
- Fuzzy search nos filtros (Fuse.js)
- Emojis de espécie: 🐕 canino, 🐈 felino, 🐇 coelho, nada para outro
- HEIC suportado com conversão automática
- Multi-utilizador (Fase 2) deixado para depois da v1.0
- Um animal = uma ficha principal; reavaliações em follow_ups
- Campos JSONB para sinais e exame oftalmológico

---

## 5 Perguntas Pendentes para a Dra. Anna

**Antes de iniciar a Fase 2, obter respostas a:**

1. **Exame oftalmológico:** Os campos (PIO, córnea, conjuntiva, etc.) são texto livre ou têm valores pré-definidos em dropdown? Os botões "NDN" e "Não realizado" são suficientes como atalhos?
2. **Campos obrigatórios:** Quais os campos obrigatórios para finalizar a ficha? Ou pode guardar com campos em branco?
3. **PDF em inglês:** Traduz só os labels estruturais, ou a Dra. quer também poder escrever o conteúdo clínico em inglês?
4. **Reavaliações:** Incluem o exame oftalmológico completo (tabela OD/OE toda), ou apenas os campos resumidos (motivo, avaliação, diagnóstico, tratamento, imagens)?
5. **Domínio:** Fica irisvet.vercel.app (gratuito) ou prefere domínio próprio como irisvet.pt (~€12/ano)?

---

## Plano de Fases

| Fase | Descrição | Duração | Estado |
|------|-----------|---------|--------|
| F1 | Supabase + Auth + Vercel | ~1 semana | ✅ Completa |
| F2 | Formulário sessões 1–4 | ~1.5 semanas | ⏳ A seguir |
| F3 | Sessões 5–7 + vista de revisão | ~1.5 semanas | ⏳ Pendente |
| F4 | Pesquisa + reavaliações + edição | ~1 semana | ⏳ Pendente |
| F5 | PDF + exportação + partilha | ~1.5 semanas | ⏳ Pendente |

---

## Como Retomar

1. Abrir nova conversa com Claude
2. Escrever: **"quero continuar o projecto írisvet"**
3. Anexar este ficheiro se necessário
4. Ter as respostas da Dra. Anna às 5 perguntas acima
5. Abrir o projecto: `cd C:\Users\luizf\irisvet` e `npm run dev`

