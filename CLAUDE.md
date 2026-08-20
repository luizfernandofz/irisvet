# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

írisvet — a Portuguese-language veterinary practice management app (patient records, follow-ups/reavaliações, surgical consent forms, prescriptions/receituários). React + Vite SPA on the frontend, Vercel serverless functions for PDF generation/email/translation, Supabase (Postgres + Auth + Storage) as the backend. Deployed on Vercel.

## Commands

```
npm run dev      # vite dev server
npm run build    # vite build
npm run lint      # eslint .
npm run preview   # preview production build
```

No test suite exists yet (Playwright is a devDependency but there are no spec files or playwright.config). If asked to run/write tests, check with the user how they want them structured before scaffolding.

TLS: on this machine, npm/npx/vercel/node need `NODE_OPTIONS="--use-system-ca"` set to reach HTTPS (see corporate/local CA setup) — prefix commands with it if they fail with certificate errors.

## Architecture

**Frontend (`src/`)** — client-side-only React SPA (`react-router-dom`, `BrowserRouter`). `src/App.jsx` holds all routes and gates them on Supabase auth session + `profiles` row (loaded after session resolves). No server-rendering; all data access goes through `src/lib/supabase.js` (anon-key client, RLS-scoped to the logged-in user) directly from components.

Domain areas, each with a `Novo*` (create) / `Consultar*` (list/search) / `Ver*` (read) / `Editar*` (edit) page group:
- **Fichas/consultas** (`NovaConsulta`, `Consultar`, `VerFicha`, `EditarFicha`) — patient intake, built as a multi-step wizard (`Sessao1e2`…`Sessao7` components + `ProgressBar` + `Revisao`/`RevisaoReavaliacao` review step). `NovaConsulta` also handles the simplified "Retorno/Reavaliação" (follow-up) flow via `follow_ups` records, distinguished by an `fkColumn` prop (`consultation_id` vs `follow_up_id`) threaded through to image upload/review components — see [[reference_supabase_images_schema]].
- **Consentimentos** (surgical consent forms) — `consent_forms` table, PDF generated server-side.
- **Receituários** (prescriptions) — `receituarios` table; medication items are a JSONB array (shape documented in the migration file), plus a `recomendacoes` JSONB array and a base64 signature captured at save time (never a static file in the repo).

Shared building blocks: `src/lib/utils.jsx` (date/age formatting), `src/lib/receituarioOptions.js` (fixed dropdown option lists), `src/lib/pdfTranslations.js` (PT/EN string tables for PDF output), `src/components/SignaturePad.jsx`, `src/components/AutoTextarea.jsx`.

**Serverless API (`api/`)** — Vercel Node functions (`export default function handler(req, res)`, not Next.js). Each endpoint builds its own Supabase client per-request via `api/_lib/supabaseFromRequest.js`, which forwards the caller's `Authorization` header so Postgres RLS applies exactly as it would from the browser — no service-role key is ever used here.
- `api/consent-pdf.js`, `api/receituario-pdf.js` — fetch a record (joined with patient/tutor/profile) and render a PDF via `pdf-lib` (`api/_lib/consentPdf.js`, `api/_lib/receituarioPdf.js`), PT or EN via `?lang=`.
- `api/send-consent-email.js` — same PDF generation, emailed via Resend (`RESEND_API_KEY`).
- `api/translate.js` — proxies DeepL (`DEEPL_API_KEY`) so the key never reaches the browser.

**Database (Supabase)** — the base schema (`tutors`, `patients`, `consultations`, `follow_ups`, `images` tables and the `images` storage bucket) predates the `supabase/migrations/` directory and was created directly via the Supabase dashboard; only changes from 2026-07-16 onward are tracked as migration files there. Migrations are **not** applied automatically — they're written to be run manually in the Supabase SQL Editor (production only, no staging environment) or via `scripts/supabase-admin.mjs` (`getAdminClient()`/`runSql()`/`runMigrationFile()`, service-role key, local scripts only — never imported from `src/` or `api/`). See [[feedback_supabase_admin_access]].

Auth/authorization model: every domain table has an `owner_id` (defaulting to `auth.uid()`) and an RLS policy of the shape `owner_id = auth.uid() or is_godmode()`. `is_godmode()` is a `security definer` SQL function reading `profiles.role`. New tables/columns that need per-user scoping should follow this same pattern rather than inventing a new one. Storage bucket policies (`images`, `signatures`) mirror this via the object's `owner_id` metadata; note storage **upsert is blocked** by policy — the app pattern is insert-new-object + delete-old-object, not overwrite (see [[reference_supabase_images_schema]]).

## Known project-specific traps

- Windows hides asset-path case mismatches that break Vercel's Linux build silently — see [[feedback_case_sensitivity_deploy]].
- `Backup_pessoal/` is an unrelated personal backup tree living inside this repo — never touch it.
- Deploys, commits, and pushes are each a separate explicit ask — don't chain them on your own initiative even when a task implies "done" would include shipping it.
