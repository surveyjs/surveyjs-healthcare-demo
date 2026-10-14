import { test, expect, Locator, Page } from '@playwright/test';
import { bypassLoginAsDoctor } from './auth-helpers';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/admin/reset');
  await bypassLoginAsDoctor(page);
});

const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

async function openEmmaProfile(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Open Profile: Emma Thompson' }).click();
  await expect(page.getByRole('button', { name: 'Edit Patient', exact: true })).toBeVisible();
}

/**
 * Enters a value and checks it stuck. Committing a field on blur re-renders the
 * SurveyJS form (its footer holds the Save button); input that Playwright lands
 * in the same tick as that re-render is discarded, so each entry is committed,
 * allowed to settle, verified, and retried if needed.
 */
async function typeInto(field: Locator, value: string, { keystrokes = false } = {}) {
  const digits = (text: string) => text.replace(/\D/g, '');
  await expect(async () => {
    await field.click();
    await field.clear();
    // Masked inputs need real keystrokes so the mask formats the value
    if (keystrokes) await field.pressSequentially(value);
    else await field.fill(value);
    // Commit on blur and let the re-render finish before the next field is touched
    await field.blur();
    await field.page().waitForTimeout(50);
    const entered = await field.inputValue();
    expect(keystrokes ? digits(entered) : entered).toBe(keystrokes ? digits(value) : value);
  }).toPass({ timeout: 10_000 });
}

const toast = (page: Page, message: string) => page.getByRole('status').filter({ hasText: message });

test('search form filters the patient list as you type', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Open Profile: David Miller' })).toBeVisible();

  // "Thompson" is shared by several seeded patients
  const name = page.getByRole('textbox', { name: 'Patient name' });
  await name.fill('Thompson');

  await expect(page.getByText('3 matches found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: Emma Thompson' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: Oliver Thompson' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: Grace Thompson' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: David Miller' })).toHaveCount(0);

  // First and last name terms combine; Enter keeps the entered criteria
  await name.fill('emma thom');
  await name.press('Enter');
  await expect(page.getByText('1 match found')).toBeVisible();
  await expect(name).toHaveValue('emma thom');

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(name).toHaveValue('');
  await expect(page.getByRole('link', { name: 'Open Profile: David Miller' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: Sophie Bennett' })).toBeVisible();
});

test('partial NHS numbers match regardless of spacing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'NHS Number' }).fill('8329');
  await expect(page.getByText('1 match found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: David Miller' })).toBeVisible();
});

test('reset filters restores the full patient list after a no-match search', async ({ page }) => {
  await page.goto('/');
  const name = page.getByRole('textbox', { name: 'Patient name' });
  await name.fill('Zzyzx');

  await expect(page.getByText('No patients matched your search')).toBeVisible();

  await page.getByRole('button', { name: 'Reset filters to view all patients' }).click();
  await expect(name).toHaveValue('');
  await expect(page.getByRole('link', { name: 'Open Profile: David Miller' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: Emma Thompson' })).toBeVisible();
});

test('patient actions in the results list open the SurveyJS dialogs', async ({ page }) => {
  await page.goto('/');

  const menuItem = page.getByRole('button', { name: 'Edit Patient: David Miller' });
  await expect(menuItem).toBeHidden();
  await page.locator('summary[aria-label="More actions: David Miller"]').click();
  await menuItem.click();

  const dialog = page.getByRole('dialog', { name: 'Edit Patient — David Miller' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Date of birth: 22/07/1978 · NHS: 832 918 3491')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Town or city' }).fill('Bath');
  await dialog.getByRole('button', { name: 'Save Changes' }).click();

  await expect(dialog).toBeHidden();
  await expect(toast(page, 'Patient details saved.')).toBeVisible();
  await expect(page.locator('.patient-card').filter({ hasText: 'David Miller' })).toContainText('Bath');
  // Focus returns to the menu button the action came from
  await expect(page.locator('summary[aria-label="More actions: David Miller"]')).toBeFocused();

  await page.getByRole('button', { name: 'Record Visit: David Miller' }).click();
  const visit = page.getByRole('dialog', { name: 'Record Visit — David Miller' });
  await expect(visit.getByRole('textbox', { name: 'Visit Date' })).toHaveValue(todayIso());
  await visit.getByRole('button', { name: 'Cancel' }).click();
  await expect(visit).toBeHidden();
});

test('registering a patient via the SurveyJS form persists it to SQLite', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Register Patient' }).click();

  await page.getByRole('textbox', { name: 'First Name' }).fill('Oliver');
  await page.getByRole('textbox', { name: 'Last Name' }).fill('Stone');
  await typeInto(page.getByRole('textbox', { name: 'Date of Birth' }), '1990-05-20');

  const gender = page.getByRole('combobox', { name: 'Gender at Birth' });
  // The dropdown's decorative prefix wrapper intercepts pointer events; force the click
  await gender.click({ force: true });
  const maleOption = page.getByRole('option', { name: 'Male', exact: true });
  if (!(await maleOption.isVisible().catch(() => false))) {
    await gender.press('ArrowDown');
  }
  await maleOption.click();

  await typeInto(page.getByRole('textbox', { name: 'Phone Number' }).first(), '07700900555', { keystrokes: true });
  await typeInto(page.getByRole('textbox', { name: 'NHS Number' }), '9998887777', { keystrokes: true });
  await typeInto(page.getByRole('textbox', { name: 'Email' }), 'oliver.stone@example.com');

  const emergency = page.getByRole('group', { name: 'Emergency Contact' });
  await typeInto(emergency.getByRole('textbox', { name: 'Full Name' }), 'Mia Stone');
  await typeInto(emergency.getByRole('textbox', { name: 'Phone Number' }), '07700900556', { keystrokes: true });

  await page.getByRole('button', { name: 'Save Patient' }).click();

  // Redirects to the new profile
  await expect(page.getByRole('heading', { name: 'Oliver Stone' })).toBeVisible();
  await expect(toast(page, 'Patient saved.')).toBeVisible();

  // Reload from scratch: data must come back from the database
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Open Profile: Oliver Stone' })).toBeVisible();
  // SurveyJS stores the unmasked input value (saveMaskedValue is false by default)
  await expect(page.getByText(/999\s?888\s?7777|9998887777/)).toBeVisible();
});

test('the registration form resets its answers', async ({ page }) => {
  await page.goto('/register');
  const firstName = page.getByRole('textbox', { name: 'First Name' });
  await firstName.fill('Temporary');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(firstName).toHaveValue('');
});

test('editing a patient via the SurveyJS dialog saves changes to SQLite', async ({ page }) => {
  await openEmmaProfile(page);

  await page.getByRole('button', { name: 'Edit Patient', exact: true }).click();
  const townInput = page.getByRole('textbox', { name: 'Town or city' });
  await expect(townInput).toHaveValue('Bristol');
  await townInput.fill('Manchester');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(toast(page, 'Patient details saved.')).toBeVisible();

  // Reload and verify persistence via the prefilled edit form
  await openEmmaProfile(page);
  await page.getByRole('button', { name: 'Edit Patient', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Town or city' })).toHaveValue('Manchester');
});

test('adding a visit via the SurveyJS dialog persists it to SQLite', async ({ page }) => {
  await openEmmaProfile(page);

  await page.getByRole('button', { name: 'Record Visit' }).first().click();

  // Visit Date is a native date input, prefilled with today and editable
  const visitDate = page.getByRole('textbox', { name: 'Visit Date' });
  await expect(visitDate).toHaveAttribute('type', 'date');
  await expect(visitDate).toHaveValue(todayIso());
  await visitDate.fill('2026-01-15');

  // Dialog forms are single-column: Visit Time renders below Visit Date
  const dateBox = await visitDate.boundingBox();
  const timeBox = await page.getByRole('textbox', { name: 'Visit Time' }).boundingBox();
  expect(timeBox!.y).toBeGreaterThanOrEqual(dateBox!.y + dateBox!.height);

  await page.getByRole('textbox', { name: 'Reason for Visit' }).fill('Annual wellbeing review');
  await page.getByRole('textbox', { name: 'Diagnosis' }).fill('Healthy');
  await page.getByRole('button', { name: 'Save Visit' }).click();

  await expect(toast(page, 'Visit recorded.')).toBeVisible();
  await expect(page.getByText('Annual wellbeing review').first()).toBeVisible();

  // Reload and verify persistence, including the edited visit date (15 Jan 2026)
  await openEmmaProfile(page);
  await expect(page.getByText('Annual wellbeing review').first()).toBeVisible();
  await expect(page.getByText('Jan 2026').first()).toBeVisible();
});

test('doctors can edit visits from today but not older visits', async ({ page }) => {
  await openEmmaProfile(page);
  await expect(page.getByRole('button', { name: /^Edit Visit:/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Record Visit' }).first().click();
  await expect(page.getByRole('textbox', { name: 'Visit Date' })).toHaveValue(todayIso());
  await page.getByRole('textbox', { name: 'Reason for Visit' }).fill('Visit to edit');
  await page.getByRole('button', { name: 'Save Visit' }).click();

  const editButton = page.getByRole('button', { name: /^Edit Visit:/ });
  await expect(editButton).toHaveCount(1);
  await editButton.click();

  const dialog = page.getByRole('dialog', { name: 'Edit Visit — Emma Thompson' });
  await expect(dialog).toBeVisible();
  const reason = dialog.getByRole('textbox', { name: 'Reason for Visit' });
  await expect(reason).toHaveValue('Visit to edit');
  await reason.fill('Updated same-day visit');
  await dialog.getByRole('button', { name: 'Save Visit' }).click();

  await expect(toast(page, 'Visit updated.')).toBeVisible();
  await expect(page.getByText('Updated same-day visit').first()).toBeVisible();
  await expect(page.getByText('Visit to edit', { exact: true })).toHaveCount(0);
});

test('validation errors appear below the input', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Register Patient' }).click();
  await page.getByRole('button', { name: 'Save Patient' }).click();

  const error = page.locator('.sd-error').first();
  await expect(error).toBeVisible();

  const inputBox = await page.getByRole('textbox', { name: 'First Name' }).boundingBox();
  const errorBox = await error.boundingBox();
  expect(errorBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);
});

test('adding a prescription via the SurveyJS dialog persists it to SQLite', async ({ page }) => {
  await openEmmaProfile(page);

  await page.getByRole('button', { name: 'Add Prescription' }).first().click();
  await page.getByRole('textbox', { name: 'Medication' }).fill('Paracetamol 500mg Tablets');
  await page.getByRole('textbox', { name: 'Instructions' }).fill('Take with water.');
  await page.getByRole('button', { name: 'Save Prescription' }).click();

  await expect(toast(page, 'Prescription saved.')).toBeVisible();
  await expect(page.getByText('Paracetamol 500mg Tablets').first()).toBeVisible();

  // Also visible in the cross-patient medications registry after reload
  await page.goto('/');
  await page.getByRole('link', { name: 'Medication', exact: true }).click();
  await expect(page.getByRole('cell', { name: /Paracetamol 500mg Tablets/ })).toBeVisible();
});

test('doctors can edit active prescriptions and completed prescriptions stay read-only', async ({ page }) => {
  await openEmmaProfile(page);

  const activeEdit = page.getByRole('button', { name: 'Edit Prescription: Amlodipine 5mg Tablets' });
  await expect(activeEdit).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Prescription: Ibuprofen 200mg Tablets' })).toHaveCount(0);
  await activeEdit.click();

  const dialog = page.getByRole('dialog', { name: 'Edit Prescription — Emma Thompson' });
  await expect(dialog).toBeVisible();
  const medication = dialog.getByRole('textbox', { name: 'Medication' });
  await expect(medication).toHaveValue('Amlodipine 5mg Tablets');
  await expect(dialog.getByRole('textbox', { name: 'Start Date' })).toHaveValue('2024-01-15');
  await expect(dialog.getByRole('textbox', { name: 'End Date' })).toHaveValue('');
  await medication.fill('Amlodipine 10mg Tablets');
  await dialog.getByRole('textbox', { name: 'Instructions' }).fill('Take with breakfast.');
  await dialog.getByRole('button', { name: 'Save Prescription' }).click();

  await expect(toast(page, 'Prescription saved.')).toBeVisible();
  await expect(page.getByText('Amlodipine 10mg Tablets').first()).toBeVisible();

  await openEmmaProfile(page);
  await page.getByRole('button', { name: 'Edit Prescription: Amlodipine 10mg Tablets' }).click();
  await expect(page.getByRole('textbox', { name: 'Instructions' })).toHaveValue('Take with breakfast.');
});

test('prescription form exports the current values as a PDF download', async ({ page }) => {
  await openEmmaProfile(page);
  await page.getByRole('button', { name: 'Add Prescription' }).first().click();
  await page.getByRole('textbox', { name: 'Medication' }).fill('Paracetamol 500mg Tablets');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Preview and Print' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/thompson-paracetamol-500mg-tablets\.pdf/);
});

test('visit dialog defaults the practitioner to the signed-in doctor and never flashes the completion page', async ({
  page,
}) => {
  await openEmmaProfile(page);

  // Delay the save API so a rendered completion page would stay visible long enough to be caught
  await page.route('**/api/patients/*/visits', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });

  await page.getByRole('button', { name: 'Record Visit' }).first().click();

  // Dr. Sarah Miller is not among the schema's practitioner choices, so the
  // dropdown selects "Other" and carries her name in the comment field
  const practitionerQuestion = page.locator('[data-name="practitioner"]');
  await expect(practitionerQuestion.locator('.sd-dropdown__input')).toContainText('Other');
  await expect(practitionerQuestion.locator('textarea')).toHaveValue('Dr. Sarah Miller');

  await page.getByRole('textbox', { name: 'Reason for Visit' }).fill('Completion flash check');
  await page.getByRole('button', { name: 'Save Visit' }).click();

  // While the save request is in flight the completion page must not render
  await expect(page.locator('.sd-completedpage')).toHaveCount(0);
  await expect(page.getByText('Thank you for completing the survey')).toHaveCount(0);

  await expect(page.getByText('Completion flash check').first()).toBeVisible();
  await expect(page.getByText('Practitioner: Dr. Sarah Miller').first()).toBeVisible();
});
