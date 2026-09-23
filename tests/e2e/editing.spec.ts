import { test, expect, Page } from '@playwright/test';
import { bypassLoginAsDoctor } from './auth-helpers';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/admin/reset');
  await bypassLoginAsDoctor(page);
});

async function openEmmaProfile(page: Page) {
  await page.goto('/');
  await page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Emma Thompson' }) })
    .getByRole('button', { name: 'Open Profile' })
    .first()
    .click();
  await expect(page.getByRole('button', { name: 'Edit Patient' })).toBeVisible();
}

test('search form filters the patient list via the database', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'David Miller' })).toBeVisible();

  // The search form is prefilled with Emma Thompson's details
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'David Miller' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByRole('heading', { name: 'David Miller' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sophie Bennett' })).toBeVisible();
});

test('registering a patient via the SurveyJS form persists it to SQLite', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Register Patient' }).click();

  await page.getByRole('textbox', { name: 'First Name' }).fill('Oliver');
  await page.getByRole('textbox', { name: 'Last Name' }).fill('Stone');
  await page.getByRole('textbox', { name: 'Date of Birth' }).fill('1990-05-20');

  const gender = page.getByRole('combobox', { name: 'Gender at Birth' });
  // The dropdown's decorative prefix wrapper intercepts pointer events; force the click
  await gender.click({ force: true });
  const maleOption = page.getByRole('option', { name: 'Male', exact: true });
  if (!(await maleOption.isVisible().catch(() => false))) {
    await gender.press('ArrowDown');
  }
  await maleOption.click();

  await page.getByRole('textbox', { name: 'Phone Number' }).first().pressSequentially('07700900555');
  await page.getByRole('textbox', { name: 'NHS Number' }).pressSequentially('9998887777');
  await page.getByRole('textbox', { name: 'Email' }).fill('oliver.stone@example.com');

  const emergency = page.getByRole('group', { name: 'Emergency Contact' });
  await emergency.getByRole('textbox', { name: 'Full Name' }).fill('Mia Stone');
  await emergency.getByRole('textbox', { name: 'Phone Number' }).pressSequentially('07700900556');

  await page.getByRole('button', { name: 'Save Patient' }).click();

  // Redirects to the new profile
  await expect(page.getByText('Oliver Stone').first()).toBeVisible();

  // Reload from scratch: data must come back from the database
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Oliver Stone' })).toBeVisible();
  // SurveyJS stores the unmasked input value (saveMaskedValue is false by default)
  await expect(page.getByText(/999\s?888\s?7777|9998887777/)).toBeVisible();
});

test('editing a patient via the SurveyJS modal saves changes to SQLite', async ({ page }) => {
  await openEmmaProfile(page);

  await page.getByRole('button', { name: 'Edit Patient' }).click();
  const townInput = page.getByRole('textbox', { name: 'Town or city' });
  await expect(townInput).toHaveValue('Bristol');
  await townInput.fill('Manchester');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(page.getByText('Patient updated').first()).toBeVisible();

  // Reload and verify persistence via the prefilled edit form
  await openEmmaProfile(page);
  await page.getByRole('button', { name: 'Edit Patient' }).click();
  await expect(page.getByRole('textbox', { name: 'Town or city' })).toHaveValue('Manchester');
});

test('adding a visit via the SurveyJS modal persists it to SQLite', async ({ page }) => {
  await openEmmaProfile(page);

  await page.getByRole('button', { name: 'Add New Visit' }).click();
  await page.getByRole('textbox', { name: 'Reason for Visit' }).fill('Annual wellbeing review');
  await page.getByRole('textbox', { name: 'Diagnosis' }).fill('Healthy');
  await page.getByRole('button', { name: 'Save Visit' }).click();

  await expect(page.getByText('Annual wellbeing review').first()).toBeVisible();

  // Reload and verify persistence
  await openEmmaProfile(page);
  await expect(page.getByText('Annual wellbeing review').first()).toBeVisible();
});

test('adding a prescription via the SurveyJS modal persists it to SQLite', async ({ page }) => {
  await openEmmaProfile(page);

  await page.getByRole('button', { name: 'Add New Prescription' }).click();
  await page.getByRole('textbox', { name: 'Medication' }).fill('Paracetamol 500mg Tablets');
  await page.getByRole('textbox', { name: 'Instructions' }).fill('Take with water.');
  await page.getByRole('button', { name: 'Save Prescription' }).click();

  await expect(page.getByText('Paracetamol 500mg Tablets').first()).toBeVisible();

  // Also visible in the cross-patient medications registry after reload
  await page.goto('/');
  await page.getByRole('button', { name: 'Medications' }).click();
  await expect(page.getByRole('cell', { name: /Paracetamol 500mg Tablets/ })).toBeVisible();
});
