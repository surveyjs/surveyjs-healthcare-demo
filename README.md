# SurveyJS Healthcare Demo — Patient Management Application

A production-quality demo of a healthcare / patient-management web application where **every form is defined as SurveyJS JSON**, rendered by the **SurveyJS Form Library**, and editable at runtime through the **SurveyJS Survey Creator**. Data is persisted in a **SQLite database** behind a small **Express API**.


## Use Cases

The application implements a realistic clinical workflow, split by user role:

### Authentication & roles

- **Login** — the login screen itself is a SurveyJS form ([login.json](src/survey/schemas/login.json)). A "quick sign-in" dropdown is populated live from the API via `choicesByUrl`, and SurveyJS triggers (`copyvalue` / `setvalue`) prefill the credentials. Failed logins keep the form active by cancelling `onCompleting`.
- **Role-based UI** — doctors get the full patient-management experience; patient accounts get a restricted portal showing only their own profile (no form builder, no prescription management), plus the ability to revoke their own visits.

### Doctor / staff use cases

- **Patient registration** — multi-section SurveyJS form capturing demographics, address, and emergency contact
- **Patient search & management** — filter patients by surname (required), birth date, or NHS number using a SurveyJS-driven search form. The form is prefilled with the surname "Thompson", which several seeded patients share, so the default search demonstrates multi-result matching
- **Patient profile** — basic details, contact details, visit history, and prescribed medications
- **Edit patient / Add visit / Add prescription** — modal workflows powered by the corresponding SurveyJS forms, with validation and immediate profile updates
- **Form builder** — open any application form in the embedded Survey Creator, modify it (add/remove/reorder questions, edit choices, validation, visibility logic), save the JSON, and see the updated form rendered in the app immediately

### Patient portal use cases

- **My profile** — a patient signs in and sees only their own record
- **Revoke visit** — a patient can remove a visit from their own history

## Technology Stack

| Layer | Technology |
| --- | --- |
| UI framework | React 19 + TypeScript |
| Build tool | Vite |
| Forms | `survey-core`, `survey-react-ui` |
| Form builder | `survey-creator-core`, `survey-creator-react` |
| Backend | Express + `better-sqlite3` (SQLite) |
| Styling | Tailwind CSS v4 (+ a custom SurveyJS ↔ Tailwind theme adapter) |
| Testing | Vitest (unit, incl. a SurveyJS schema lint gate) + Playwright (e2e) |
| Icons | Lucide |

No custom form engine is used — all forms load and render the actual SurveyJS JSON schemas.

## How the SurveyJS Components Were Added

The integration follows the standard SurveyJS React setup, wrapped in two reusable components:

1. **Packages** — `survey-core` + `survey-react-ui` for rendering, `survey-creator-core` + `survey-creator-react` for the builder (all v3.x).
2. **[SurveyRenderer.tsx](src/survey/SurveyRenderer.tsx)** — a single reusable renderer used by every page and modal. It:
   - creates a SurveyJS `Model` from a JSON schema (memoized per schema),
   - applies the `DefaultLightPanelless` theme and imports `survey-core/survey-core.min.css` plus the local Tailwind adapter,
   - applies `initialData` for edit workflows and supports `readOnly` (display mode),
   - exposes `onComplete` / `onValueChanged` callbacks that hand `survey.data` back to the host, and `onModelReady` for advanced cases (e.g. the login page cancelling `onCompleting`).
3. **[SurveyCreatorModal.tsx](src/survey/SurveyCreatorModal.tsx)** — embeds the Survey Creator in a modal. It loads the same JSON the Form Library renders; saving persists the edited schema through `formRepository`, closing the round-trip:

```text
SurveyJS JSON → Survey Creator → edited JSON → Form Library → application form
```

4. **JSON schemas as the source of truth** — all fields, validation, masks, and conditional logic live in [src/survey/schemas](src/survey/schemas), separate from React components:

| Schema | Used for |
| --- | --- |
| [patient-registration.json](src/survey/schemas/patient-registration.json) | Register Patient page |
| [patient-search.json](src/survey/schemas/patient-search.json) | Manage Patients search filters |
| [edit-patient.json](src/survey/schemas/edit-patient.json) | Edit Patient modal |
| [add-new-visit.json](src/survey/schemas/add-new-visit.json) | Add Visit modal |
| [add-new-prescription.json](src/survey/schemas/add-new-prescription.json) | Add Prescription modal |
| [patient-visits.json](src/survey/schemas/patient-visits.json) | Visit history display |
| [prescribed-medication.json](src/survey/schemas/prescribed-medication.json) | Medication display |
| [login.json](src/survey/schemas/login.json) | Login page |

5. **Survey ↔ domain mapping** — [surveyMapping.ts](src/repositories/surveyMapping.ts) contains the pure functions that translate between `survey.data` and the application's domain types (note: SurveyJS static panels are layout-only, so child question values arrive as flat keys, and masked inputs like the NHS number store the unmasked value).

## How SurveyJS Was Themed to Match the Host Application

The surveys are styled to be indistinguishable from the surrounding Tailwind UI:

- **Base theme** — `SurveyRenderer` and `SurveyCreatorModal` apply the built-in `DefaultLightPanelless` theme, which removes SurveyJS's panel chrome so forms sit flat on the host page.
- **[tailwind-adapter.css](src/survey/tailwind-adapter.css)** — a generic SurveyJS ↔ Tailwind v4 theme adapter. Inside a `.sjs-theme-overrides` scope it remaps SurveyJS design tokens to the host's semantic CSS variables with a three-level fallback chain: shadcn-style semantic variables (`--color-primary`, `--color-primary-hover`, `--color-input`, `--color-border`, `--color-ring`, …) → Tailwind default variables → literal fallbacks. Spacing and density are expressed via `calc(var(--spacing) * N)` so the survey follows the host's spacing scale.
- **Host design tokens** — the application defines its brand values in [src/index.css](src/index.css) under `@theme static` (`--font-sans`, `--color-primary: #00695c`, `--color-primary-hover: #004d40`). The adapter picks these up automatically, so changing the brand color restyles every form.
- **Chrome handled by the host** — survey titles are hidden (`model.showTitle = false`); page and modal headers are rendered by regular React components so typography stays consistent.

The result: SurveyJS forms inherit the app's colors, fonts, borders, focus rings, and spacing without forking any SurveyJS CSS.

## How Data Persistence Is Implemented

Persistence is a real client–server setup:

- **SQLite via Express** — the backend lives in [server](server): [db.ts](server/db.ts) holds the schema and data-access layer (a `createDb(path)` factory; tests pass `':memory:'`), [app.ts](server/app.ts) is the Express app factory, and [index.ts](server/index.ts) is the entry point. The API listens on port **4001** and stores data in `data/healthcare.db` (override with `DB_PATH` / `API_PORT`).
- **Auto-seeding** — an empty database is seeded from [src/data/initialData.ts](src/data/initialData.ts): demo patients plus demo users (2 doctors + 2 patients, all with password `demo1234`). All data is fictional.
- **Client repositories** — the UI never touches the database directly:
  - [patientRepository.ts](src/repositories/patientRepository.ts) is an async fetch client for the `/api` endpoints (proxied by Vite in dev).
  - [formRepository.ts](src/repositories/formRepository.ts) persists **only schema overrides** edited in the Survey Creator (the `form_schemas` table); the default schemas stay in the bundled JSON. `formRepository.init()` preloads overrides in [main.tsx](src/main.tsx) before the first render so `getForm()` remains synchronous.
  - [authRepository.ts](src/repositories/authRepository.ts) calls `POST /api/auth/login` / `GET /api/auth/roster` and keeps the session in `sessionStorage`/`localStorage` (key `hc-auth-user`). Passwords are stored as hashes server-side.
- **Ordering** — visits and prescriptions use a `seq` column (newest = highest, `ORDER BY seq DESC`) so newly added records appear first.
- **Test isolation** — e2e tests reset database state via `POST /api/admin/reset`; unit tests run the same `db.ts` against an in-memory SQLite database.

Because all storage goes through the repositories, the SQLite backend could be swapped for any other API/database without touching the UI.

## Architecture

```text
server/
  db.ts               SQLite schema + data access (better-sqlite3)
  app.ts              Express app factory (REST API under /api)
  index.ts            Server entry point (port 4001)
src/
  components/
    common/           Toast notifications
    layout/           Header, Sidebar
    modals/           Edit Patient, Add Visit, Add Prescription
    patients/         Patient cards, details, history
  pages/
    LoginPage
    RegisterPatientPage
    ManagePatientsPage
    PatientProfilePage
  repositories/
    patientRepository   async API client for patient data
    formRepository      SurveyJS schema overrides (API-backed)
    authRepository      login/session handling
    surveyMapping       pure survey.data ↔ domain mapping
  survey/
    schemas/            SurveyJS JSON definitions
    SurveyRenderer      Reusable renderer (Model creation, initial data, validation, completion)
    SurveyCreatorModal  Embedded Survey Creator
    tailwind-adapter.css  Generic SurveyJS ↔ Tailwind v4 theme adapter
  data/
    initialData         Seed demo patients and users
  types/                Patient, form, and auth type definitions
tests/
  unit/               Vitest: API, DB, survey mapping, schema linting
  e2e/                Playwright: auth, editing, form builder, read screens
```

## Run Locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

`npm run dev` starts the Express API (port 4001) and the Vite dev server (http://localhost:3000) together.

Sign in with any seeded account (e.g. pick one from the quick sign-in dropdown); every demo password is `demo1234`.

Other scripts:

```bash
npm run build      # production build
npm run preview    # preview the production build
npm run lint       # TypeScript type check
npm run test:unit  # Vitest unit tests (includes SurveyJS schema lint gate)
npm run test:e2e   # Playwright end-to-end tests
```

To reset the demo data, stop the server and delete `data/healthcare.db` (it re-seeds on next start), or call `POST /api/admin/reset`.
