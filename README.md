# SurveyJS Healthcare Demo — Patient Management Application

A production-quality demo of a healthcare / patient-management web application where **every form is defined as SurveyJS JSON**, rendered by the **SurveyJS Form Library**, and editable at runtime through the **SurveyJS Survey Creator**.

## Features

- **Patient registration** — multi-section SurveyJS form capturing demographics, address, and emergency contact
- **Patient search & management** — filter patients by surname, birth date, or NHS number using a SurveyJS-driven search form
- **Patient profile** — basic details, contact details, visit history, and prescribed medications
- **Edit patient / Add visit / Add prescription** — modal workflows powered by the corresponding SurveyJS forms, with validation and immediate profile updates
- **Form builder** — open any application form in the embedded Survey Creator, modify it (add/remove/reorder questions, edit choices, validation, visibility logic), save the JSON, and see the updated form rendered in the app
- **Local persistence** — patient records and customized form schemas survive a browser refresh via `localStorage`

## Technology Stack

| Layer | Technology |
| --- | --- |
| UI framework | React 19 + TypeScript |
| Build tool | Vite |
| Forms | `survey-core`, `survey-react-ui` |
| Form builder | `survey-creator-core`, `survey-creator-react` |
| Styling | Tailwind CSS (+ a custom SurveyJS ↔ Tailwind adapter and clinical theme) |
| Icons | Lucide |

No custom form engine is used — all forms load and render the actual SurveyJS JSON schemas.

## SurveyJS Form Schemas

The JSON definitions are the source of truth for all form fields, validation, and conditional logic. They live in [src/survey/schemas](src/survey/schemas) separately from the React components:

| Schema | Used for |
| --- | --- |
| [patient-registration.json](src/survey/schemas/patient-registration.json) | Register Patient page |
| [patient-search.json](src/survey/schemas/patient-search.json) | Manage Patients search filters |
| [edit-patient.json](src/survey/schemas/edit-patient.json) | Edit Patient modal |
| [add-new-visit.json](src/survey/schemas/add-new-visit.json) | Add Visit modal |
| [add-new-prescription.json](src/survey/schemas/add-new-prescription.json) | Add Prescription modal |
| [patient-visits.json](src/survey/schemas/patient-visits.json) | Visit history display |
| [prescribed-medication.json](src/survey/schemas/prescribed-medication.json) | Medication display |

## Architecture

```text
src/
  components/
    common/        Toast notifications
    layout/        Header, Sidebar
    modals/        Edit Patient, Add Visit, Add Prescription
    patients/      Patient cards, details, history
  pages/
    RegisterPatientPage
    ManagePatientsPage
    PatientProfilePage
  repositories/
    patientRepository   localStorage-backed patient store
    formRepository      localStorage-backed SurveyJS schema store
  survey/
    schemas/            SurveyJS JSON definitions
    SurveyRenderer      Reusable renderer (Model creation, initial data, validation, completion)
    SurveyCreatorModal  Embedded Survey Creator
    survey-theme.css    SurveyJS design-token overrides mapped to the app's Tailwind variables
  data/
    initialData         Seed demo patients
  types/                Patient and form type definitions
```

### Key design points

- **`SurveyRenderer`** is a single reusable component that creates a SurveyJS `Model` from a JSON schema, applies initial data (for editing existing records), handles validation/completion, and returns `survey.data`.
- **Repositories** (`patientRepository`, `formRepository`) abstract all `localStorage` access, so a real API/database could replace them without touching the UI.
- **Survey Creator round-trip**: the Creator loads the same JSON the Form Library renders. Saving in the builder persists the edited schema, and the application immediately renders forms from the modified definition:

```text
SurveyJS JSON → Survey Creator → edited JSON → Form Library → application form
```

## Run Locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000.

Other scripts:

```bash
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # TypeScript type check
```

## Demo Data & Persistence

- Seed patients are defined in [src/data/initialData.ts](src/data/initialData.ts) (fictional data only).
- Patient records and any form schemas customized in the Survey Creator are persisted to `localStorage`, so the demo state survives page reloads.
- To reset the demo, clear the site's `localStorage` in your browser devtools.
