# SurveyJS Healthcare Demo — Patient Management Application

A production-quality demo of a healthcare / patient-management web application where **every form is defined as SurveyJS JSON**, rendered by the **SurveyJS Form Library**, and editable at runtime through the **SurveyJS Survey Creator**. Data is persisted in a **SQLite database** behind a small **Express API**.


## Use Cases

The application implements a realistic clinical workflow, split by user role:

### Authentication & roles

- **Login** — the login screen uses the shared Healthcare header and a SurveyJS form ([login.json](src/survey/schemas/login.json)). A "quick sign-in" dropdown is populated live from the API via `choicesByUrl`, and SurveyJS triggers (`copyvalue` / `setvalue`) prefill the credentials. Failed logins keep the form active by cancelling `onCompleting` and attach the error to the password question.
- **Role-based UI** — doctors get the full patient-management experience; patient accounts get a restricted portal showing only their own profile and read-only history, with staff management controls hidden.

### Doctor / staff use cases

- **Patient registration** — multi-section SurveyJS form capturing demographics, address, and emergency contact
- **Patient search & management** — results update as you type in the SurveyJS search form: patient name (first name, last name, or both), date of birth, or a full or partial NHS number. All filters are optional; an empty search lists every patient. The patient name links to the profile, and each result offers **Record Visit** plus a menu with **Add Prescription** and **Edit Patient**, which open the SurveyJS dialogs in place. Several seeded patients share the surname "Thompson", so searching for it demonstrates multi-result matching
- **Patient profile** — breadcrumb, identity summary, collapsible basic and contact details, visit history, and prescribed medications. Visit cards open a read-only SurveyJS dynamic-panel record; visits recorded today and active prescriptions show edit actions.
- **Practice medication overview** — browse all active and past prescriptions, filter by patient name, NHS number, medication, or status (a SurveyJS filter form), sort the table columns, navigate to the patient's profile, and open an individual read-only SurveyJS medication record
- **Edit patient / Record visit / Add or edit prescription** — native `<dialog>` workflows powered by the corresponding SurveyJS forms, with validation and immediate updates. Each dialog's SurveyJS footer holds Save, Cancel, and an **Edit … Form** action that opens the builder. Doctors can edit visits recorded today and active prescriptions; older visits and completed prescriptions are read-only, enforced by the API. Prescription forms can export their current values as a PDF download (**Preview and Print**). Dialog forms render single-column, all date fields use native date pickers (the visit date defaults to today and stays editable), and validation errors appear below the inputs. Saving closes the dialog directly — the SurveyJS completion page is suppressed. The visit form's practitioner defaults to the signed-in doctor (via the dropdown's "Other" option when they are not among the schema's choices)
- **Form builder** — open any application form in the embedded Survey Creator, modify it (add/remove/reorder questions, edit choices, validation, visibility logic), save the JSON, and see the updated form rendered in the app immediately
- **Demo display options** — a floating dock switches between the light and dark clinic themes (shared by the app chrome, the forms, and Creator) and toggles outlines that mark every SurveyJS-rendered component

### Patient portal use cases

- **Patient portal** — a patient signs in and sees only their own contact details, appointment requests, visits, and prescribed medication; medication cards open the read-only SurveyJS record
- **Request an appointment** — a dedicated page with a SurveyJS form prefilled with the patient's contact details; submitting returns to the portal with a confirmation toast
- **Staff review** — submitted requests appear in Inpatient Settings, where the practitioner list is loaded from the account roster and marks the signed-in doctor

## Navigation & URLs

Every view has its own URL (client-side routing via `react-router-dom`), so browser Back/Forward and deep links work:

| Route | View | Access |
| --- | --- | --- |
| `/login` | Login screen | public (signed-in users are redirected to their home view) |
| `/register` | Register Patient | staff |
| `/manage` | Manage Patients (search + list) | staff |
| `/patients/:id` | Patient profile | staff |
| `/medications` | Practice Medication Overview | staff |
| `/settings` | Inpatient & Clinical Settings | staff |
| `/portal` | Patient portal (own record) | patient |
| `/appointments/new` | Request an appointment | patient |

Unauthenticated visitors are redirected to `/login`; unknown URLs redirect to the role's home view (`/manage` for staff, `/portal` for patients). Patients hitting staff URLs are redirected to `/portal`. An unknown patient id shows a "Page not found" view.

The shared header shows the HEALTHCARE brand, role-appropriate route links with an active-page indicator, the signed-in user's name, and sign-out. Nested views (patient profile, appointment request) add breadcrumbs. On narrow screens, navigation wraps to its own row and stays horizontally scrollable.

## Technology Stack

| Layer | Technology |
| --- | --- |
| UI framework | React 19 + TypeScript |
| Build tool | Vite |
| Routing | `react-router-dom` |
| Forms | `survey-core`, `survey-react-ui` |
| Form builder | `survey-creator-core`, `survey-creator-react` |
| PDF export | `survey-pdf` (SurveyJS PDF Generator; commercial license required for commercial use) |
| Backend | Express + `better-sqlite3` (SQLite) |
| Styling | Plain CSS ([styles.css](src/styles.css)) + a shared SurveyJS theme ([clinicTheme.ts](src/theme/clinicTheme.ts)) |
| Testing | Vitest (unit, incl. a SurveyJS schema lint gate) + Playwright (e2e) |
| Icons | Feather (inline SVG subset in [featherIcons.ts](src/ui/featherIcons.ts)) |

No custom form engine is used — all forms load and render the actual SurveyJS JSON schemas.

## How the SurveyJS Components Were Added

The integration follows the standard SurveyJS React setup, wrapped in two reusable components:

1. **Packages** — `survey-core` + `survey-react-ui` for rendering, `survey-creator-core` + `survey-creator-react` for the builder, and `survey-pdf` for PDF export (all v3.x).
2. **[SurveyRenderer.tsx](src/survey/SurveyRenderer.tsx)** — a single reusable renderer used by every page and dialog. It:
   - creates a SurveyJS `Model` from a JSON schema (memoized per schema) inside a `.native-survey` host element,
   - applies the shared clinic theme and re-applies it when the display mode or viewport changes,
   - places validation errors below the inputs (`questionErrorLocation: "bottom"`) and suppresses the completion page,
   - applies initial `data` for edit workflows and supports `readOnly` (display mode),
   - hands validated answers to `onSave` from `onCompleting` (the form stays live), reports `onValueChanged`, and adds host actions (Cancel, Reset, Edit … Form) as SurveyJS footer navigation items.
3. **[SurveyCreatorModal.tsx](src/survey/SurveyCreatorModal.tsx)** — embeds the Survey Creator in a full-viewport dialog themed with the clinic palette. It loads the same JSON the Form Library renders; **Reset to Default** loads the bundled schema, and **Save & Apply Form** persists the schema through `formRepository`, closes the creator, and returns to the view the builder was opened from (if it was opened from inside a form dialog, that dialog reopens with the updated schema):

```text
SurveyJS JSON → Survey Creator → edited JSON → Form Library → application form
```

4. **JSON schemas as the source of truth** — all fields, validation, masks, and conditional logic live in [src/survey/schemas](src/survey/schemas), separate from React components:

| Schema | Used for |
| --- | --- |
| [patient-registration.json](src/survey/schemas/patient-registration.json) | Register Patient page |
| [patient-search.json](src/survey/schemas/patient-search.json) | Manage Patients search filters |
| [edit-patient.json](src/survey/schemas/edit-patient.json) | Edit Patient dialog |
| [add-new-visit.json](src/survey/schemas/add-new-visit.json) | Record / Edit Visit dialog |
| [add-new-prescription.json](src/survey/schemas/add-new-prescription.json) | Add / Edit Prescription dialog |
| [patient-visits.json](src/survey/schemas/patient-visits.json) | Read-only Visit Details dialog on the patient profile |
| [prescribed-medication.json](src/survey/schemas/prescribed-medication.json) | Read-only Medication Record dialog (medications overview, patient portal) |
| [appointment-request.json](src/survey/schemas/appointment-request.json) | Patient portal Request an Appointment page |
| [login.json](src/survey/schemas/login.json) | Login page |

5. **Survey ↔ domain mapping** — [surveyMapping.ts](src/repositories/surveyMapping.ts) contains the pure functions that translate between `survey.data` and the application's domain types, including collection mappings for the visit and prescription dynamic panels (note: SurveyJS static panels are layout-only, so child question values arrive as flat keys, and masked inputs like the NHS number store the unmasked value).

## How SurveyJS Was Themed to Match the Host Application

One theme drives both the SurveyJS forms and the surrounding clinic UI:

- **Clinic theme** — [clinicTheme.ts](src/theme/clinicTheme.ts) extends the built-in `FlatLightPanelless` / `FlatDarkPanelless` themes with the clinic palette, Open Sans typography, radii, and spacing tokens (`--sjs2-*`). The selected palette is also written to the document root, and [styles.css](src/styles.css) derives the app's own tokens from it (`--brand: var(--sjs2-color-project-brand-600)`, …), so the chrome and the forms always share colors.
- **Per-form tokens** — `getClinicFormTheme()` adds host-specific values on each model (tighter insets on narrow screens, flush filter forms, dynamic-panel spacing, tertiary-surface action colors) without leaking them into Creator.
- **Creator** — `applyClinicCreatorTheme()` gives the Survey Creator the same palette (`applyCreatorTheme`) and the form theme for its preview.
- **Basic headers** — schemas use `"headerView": "basic"`, so form titles and descriptions render inside the card; [styles.css](src/styles.css) contains the small layout bridges SurveyJS needs (header divider, search header actions, dynamic-panel header spacing).
- **Dark mode and outlines** — [demoTools.ts](src/theme/demoTools.ts) renders the display dock (a manual popover, moved into open dialogs so it stays above the top layer). It switches the palette and re-themes every mounted form and Creator; the outline toggle marks each `[data-survey-component]` mount point.

The result: SurveyJS forms inherit the app's colors, fonts, borders, focus rings, and spacing without forking any SurveyJS CSS.

## How Data Persistence Is Implemented

Persistence is a real client–server setup:

- **SQLite via Express** — the backend lives in [server](server): [db.ts](server/db.ts) holds the schema and data-access layer (a `createDb(path)` factory; tests pass `':memory:'`), [app.ts](server/app.ts) is the Express app factory, and [index.ts](server/index.ts) is the entry point. The API listens on port **4001** and stores data in `data/healthcare.db` (override with `DB_PATH` / `API_PORT`).
- **Auto-seeding** — an empty database is seeded from [src/data/initialData.ts](src/data/initialData.ts): demo patients plus demo users (2 doctors + 2 patients, all with password `demo1234`). All data is fictional.
- **Client repositories** — the UI never touches the database directly:
  - [patientRepository.ts](src/repositories/patientRepository.ts) is an async fetch client for the `/api` endpoints (proxied by Vite in dev).
  - [appointmentRepository.ts](src/repositories/appointmentRepository.ts) submits appointment requests and loads them for staff review.
  - [formRepository.ts](src/repositories/formRepository.ts) persists **only schema overrides** edited in the Survey Creator (the `form_schemas` table); the default schemas stay in the bundled JSON. `formRepository.init()` preloads overrides in [main.tsx](src/main.tsx) before the first render so `getForm()` remains synchronous.
  - [authRepository.ts](src/repositories/authRepository.ts) calls `POST /api/auth/login` / `GET /api/auth/roster` and keeps the session in `sessionStorage`/`localStorage` (key `hc-auth-user`). Passwords are stored as hashes server-side.
- **Ordering** — visits and prescriptions use a `seq` column (newest = highest, `ORDER BY seq DESC`) so newly added records appear first.
- **Visit updates** — `PUT /api/patients/:id/visits/:visitId` updates a visit in place only when both its saved date and submitted date are today; other visit updates are rejected.
- **Prescription updates** — `PUT /api/patients/:id/prescriptions/:prescriptionId` updates active prescriptions only; the API and database both reject edits to completed or missing records.
- **Appointment requests** — `POST /api/appointment-requests` stores patient form responses in SQLite; `GET /api/appointment-requests` supplies the staff review list. Requests are linked to the patient record and cleared by the demo reset.
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
    common/           Native dialog shell, toast
    layout/           AppShell (header, navigation, page frame)
    modals/           Patient form dialogs (edit patient, visit, prescription, read-only records)
    patients/         Patient card, detail lists, visit/medication/appointment records
  pages/
    LoginPage
    RegisterPatientPage
    ManagePatientsPage
    PatientProfilePage
    MedicationsPage
    SettingsPage
    PatientPortalPage   portal + appointment request page
  repositories/
    patientRepository   async API client for patient data
    appointmentRepository appointment request API client
    formRepository      SurveyJS schema overrides (API-backed)
    authRepository      login/session handling
    surveyMapping       pure survey.data ↔ domain mapping
  survey/
    schemas/            SurveyJS JSON definitions
    SurveyRenderer      Reusable renderer (Model creation, initial data, validation, completion)
    SurveyCreatorModal  Embedded Survey Creator
  theme/
    clinicTheme         Shared SurveyJS + app theme (light/dark)
    demoTools           Display dock (theme switch, SurveyJS outlines)
  ui/                 Feather icons, shared page components, formatting helpers
  styles.css          Application stylesheet
  data/
    initialData         Seed demo patients and users
  types/                Patient, form, and auth type definitions
tests/
  unit/               Vitest: API, DB, survey mapping, schema linting
  e2e/                Playwright: auth, routing, editing, form builder, read screens
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

Playwright uses API port `4101` and web port `3100` by default. To avoid conflicts with a running local app, set `E2E_API_PORT` and `E2E_WEB_PORT` before running the suite.

To reset the demo data, stop the server and delete `data/healthcare.db` (it re-seeds on next start), or call `POST /api/admin/reset`.
