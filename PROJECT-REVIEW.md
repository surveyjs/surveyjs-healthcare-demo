# Project Review — SurveyJS Healthcare Demo

*Date: 2026-09-23*

## Overall assessment

The project is in good shape as a **demo**: consistent architecture (JSON schemas → SurveyRenderer → repositories → Express/SQLite), full API↔client pairing, a schema lint gate, and solid e2e coverage of the main flows. Below are the concrete findings and what a real healthcare application would still need.

---

## 1. Consistency findings

### ✅ Consistent

- **API surface** — every endpoint in `server/app.ts` has a matching client function in `src/repositories/patientRepository.ts`, `src/repositories/formRepository.ts`, or `src/repositories/authRepository.ts`; no orphans on either side. Error shape is uniform (`{ error }` + proper status codes).
- **Types ↔ DB** — `src/types/patient.ts` aligns with the `server/db.ts` schema; flat address columns and computed `age` are correctly handled in `src/repositories/surveyMapping.ts`.
- **UI patterns** — the three modals share the same structure, all subscribe to schema changes, and theming/spacing is uniform via the Tailwind adapter.

### ⚠️ Inconsistencies to fix

| Severity | Finding | Where |
|---|---|---|
| 🔴 | Passwords hashed with unsalted SHA-256 | `server/db.ts` — use bcrypt/argon2 (fine for a demo, note it in README) |
| 🔴 | **No backend authorization** — role restrictions exist only in the UI; any client can `PUT /api/patients/:id` or POST visits for any patient; `POST /api/admin/reset` is open | `server/app.ts` |
| 🟠 | Visit endpoint validates only `typeof body === 'object'` while patient endpoints validate specific fields | `server/app.ts` |
| 🟠 | `mapSurveyToVisit()` / `mapSurveyToPrescription()` have **no unit tests**; auth and form-schema DB functions also untested | `tests/unit` |
| 🟡 | Prescription dosage field is named `question1` (default generated name) — works, but fragile | `src/survey/schemas/add-new-prescription.json` |
| 🟡 | Error handling is inconsistent: LoginPage shows errors, but ManagePatients/Profile/Register only `console.error` with no user-facing message; modals don't disable submit during in-flight API calls | `src/pages`, `src/components/modals` |
| 🟡 | Optional fields (`insuranceProvider`, `knownAllergies`) are `string?` in types but `NOT NULL DEFAULT ''` in DB — pick one convention | `server/db.ts` |
| 🟡 | Prescription `status` is *computed* from `endDate` instead of being explicit state | `src/repositories/surveyMapping.ts` |
| 🔵 | Accessibility: modals lack `role="dialog"`/focus trap; toast container lacks `aria-live`; no loading skeletons or "no results" empty state on search | `src/components/modals/EditPatientModal.tsx`, `src/components/common/Toast.tsx`, `src/pages/ManagePatientsPage.tsx` |

---

## 2. Healthcare use-case coverage

### Implemented ✅

- Patient registration, search (surname/DOB/NHS), profile view
- Encounters (visits) with diagnosis, treatment, follow-up date, internal notes
- Prescriptions with dosage, frequency, dates, active/completed status
- Emergency contact, basic insurance and allergy capture
- Role-based experience (doctor vs patient portal), patient self-service (revoke visit)
- Runtime form customization via Survey Creator — the standout feature

### Common healthcare concepts NOT yet modeled ❌

| Domain area | Missing |
|---|---|
| **Clinical record** | Medical history / problem list, vital signs, lab orders & results, immunizations, referrals, structured SOAP notes |
| **Medication safety** | Structured allergies (severity, reaction) — currently one free-text field; drug-allergy/drug-drug interaction checks; refill tracking; prescriber attribution |
| **Scheduling** | Appointment booking/calendar, reminders, follow-up alerts (a `followUpDate` is stored but nothing acts on it) |
| **Care coordination** | Care team / assigned GP, multiple emergency contacts, specialist referrals |
| **Documents** | File attachments (lab reports, discharge summaries, imaging) |
| **Billing** | Structured insurance (policy number, coverage), invoicing/claims |
| **Compliance** | Audit log (who viewed/edited which record), consent records, data-retention — essential for anything GDPR/HIPAA-adjacent |

---

## 3. Recommendations (prioritized)

### Quick wins (consistency/polish)

1. Rename `question1` → `dosage_amount` in the prescription schema + mapping.
2. Surface API errors via the existing Toast on all pages/modals; disable submit while saving.
3. Add unit tests for `mapSurveyToVisit`/`mapSurveyToPrescription` and the auth/form-schema DB functions; add an e2e test that a patient account cannot reach another patient's data.
4. Tighten visit/prescription request validation in `server/app.ts`.
5. Add `role="dialog"` + `aria-live` + empty-state/skeleton UI.

### Security (before any non-demo use)

6. Server-side sessions or JWT with per-request identity; enforce role checks on every endpoint (patient can only touch own record); protect or dev-gate `/api/admin/reset`; salt-hash passwords.

### Domain roadmap (great SurveyJS showcases too)

7. **Structured allergies** — a `paneldynamic` allergy form (substance, severity, reaction) replacing the free-text field.
8. **Vitals & SOAP-structured visit form** — extend `add-new-visit.json` with a vitals panel and conditional sections.
9. **Appointment booking** — a scheduling form with date/time validation + a follow-up reminders view driven by stored `followUpDate`.
10. **Problem list & medical history** — new table + registration/edit form section.
11. **Audit log table** — record every read/write with user id; simple to add given all access goes through `db.ts`.
12. Longer term: document upload, structured insurance, referrals, and lab results.
