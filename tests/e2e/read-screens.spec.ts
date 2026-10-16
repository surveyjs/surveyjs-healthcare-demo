import { test, expect, Page } from '@playwright/test';
import { bypassLoginAsDoctor } from './auth-helpers';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/admin/reset');
  await bypassLoginAsDoctor(page);
});

/** Picks a choice in a SurveyJS dropdown (its input wrapper intercepts pointer events). */
async function selectSurveyOption(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label }).click({ force: true });
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('manage patients screen lists all patients from the SQLite database', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Open Profile: Emma Thompson' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: David Miller' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Profile: Sophie Bennett' })).toBeVisible();

  // Status is not shown on list cards
  const emmaCard = page.locator('.patient-card').filter({ hasText: 'Emma Thompson' });
  await expect(emmaCard.getByText('Active', { exact: true })).toHaveCount(0);
  await expect(emmaCard).toContainText('945 128 4567');
  await expect(emmaCard).toContainText('12 Oakfield Road');

  await page.getByRole('link', { name: 'Open Profile: Emma Thompson' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/patients\/p-emma-thompson$/);
  await expect(
    page.getByRole('heading', { name: 'Emma Thompson', exact: true }).locator('..').getByText('Active', { exact: true }),
  ).toBeVisible();
});

test('patient search inputs opt out of browser autofill without an invalid schema value', async ({ page }) => {
  await page.goto('/manage');
  const search = page.locator('#survey-search');
  await expect(search.getByRole('textbox', { name: 'Patient name' })).toHaveAttribute('autocomplete', 'off');
  await expect(search.getByRole('textbox', { name: 'NHS Number' })).toHaveAttribute('autocomplete', 'off');
});

test('patient profile shows visits and prescriptions loaded from the database', async ({ page }) => {
  await page.goto('/patients/p-emma-thompson');

  await expect(page.getByRole('heading', { name: 'Patient Profile' })).toBeVisible();
  // Seeded visit and prescription data
  await expect(page.getByText('Tension headache').first()).toBeVisible();
  await expect(page.getByText('Amlodipine 5mg Tablets').first()).toBeVisible();
  await expect(page.getByText('Ibuprofen 200mg Tablets').first()).toBeVisible();

  // Basic and contact details collapse together
  const toggle = page.getByRole('button', { name: 'Contact Details' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Basic Details' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('Penicillin (rash), Pollen (seasonal)')).toBeHidden();
  await toggle.click();
  await expect(page.getByText('Penicillin (rash), Pollen (seasonal)')).toBeVisible();

  // Visit cards open the read-only SurveyJS dynamic-panel record
  await page.getByRole('button', { name: /View visit details: GP Consultation, 18\/04\/2024/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Visit Details' });
  await expect(dialog.getByLabel('Visit Date')).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Diagnosis' })).toHaveValue('Tension headache');
  // Read-only records are always expanded: no collapse toggle on the panel
  await expect(dialog.locator('.sd-element__title--expandable')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(dialog).toBeHidden();
});

test('medications registry iterates prescriptions of all patients from the database', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Medication', exact: true }).click();

  await expect(page.getByText('Practice Medication Overview')).toBeVisible();
  await expect(page.getByRole('cell', { name: /Amlodipine 5mg Tablets/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Ibuprofen 200mg Tablets/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Salbutamol 100mcg Inhaler/ })).toBeVisible();
});

test('medications registry filters, sorts, clears filters, and exposes row actions', async ({ page }) => {
  await page.goto('/medications');

  const table = page.getByRole('table');
  const filters = page.locator('#medication-filters');
  await filters.getByRole('textbox', { name: 'Patient name' }).fill('Emma');
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table.getByText('Amlodipine 5mg Tablets')).toBeVisible();
  await expect(table.getByText('Ibuprofen 200mg Tablets')).toBeVisible();
  await expect(table.getByText('Salbutamol 100mcg Inhaler')).toHaveCount(0);

  await filters.getByRole('textbox', { name: 'Patient name' }).fill('');
  await filters.getByRole('textbox', { name: 'NHS number' }).fill('832 918 3491');
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(filters.getByRole('textbox', { name: 'NHS number' })).toHaveValue('');
  await filters.getByRole('textbox', { name: 'Medication' }).fill('salbutamol');
  await expect(table.getByRole('row')).toHaveCount(2);
  await filters.getByRole('textbox', { name: 'Medication' }).fill('');
  await selectSurveyOption(page, 'Status', 'Completed');
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(table.getByText('Ibuprofen 200mg Tablets')).toBeVisible();

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'Sort by Patient' }).click();
  await expect(table.locator('tbody tr').first()).toContainText('Sophie Bennett');
  await expect(table.getByRole('columnheader', { name: /Patient/ })).toHaveAttribute('aria-sort', 'descending');

  const emmaRow = table.locator('tbody tr').filter({ hasText: 'Amlodipine 5mg Tablets' });
  await emmaRow.getByRole('link', { name: 'Emma Thompson' }).click();
  await expect(page).toHaveURL(/\/patients\/p-emma-thompson$/);
  await page.goto('/medications');
  await page.getByRole('button', { name: 'View Medication Record' }).first().click();
  const recordDialog = page.getByRole('dialog', { name: 'Medication Record' });
  await expect(recordDialog).toBeVisible();
  await expect(recordDialog.getByRole('textbox', { name: 'Medication', exact: true })).toHaveValue('Amlodipine 5mg Tablets');
  await expect(recordDialog.getByText('Once daily', { exact: true })).toBeVisible();
  await expect(recordDialog.locator('.sd-element__title--expandable')).toHaveCount(0);
  await expect(recordDialog.getByText('Amlodipine 5mg Tablets — Active')).toBeVisible();
  await recordDialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(recordDialog).toBeHidden();
});

test('the demo dock switches to the dark theme and toggles SurveyJS outlines', async ({ page }) => {
  await page.goto('/manage');
  const dock = page.getByRole('toolbar', { name: 'Demo display options' });
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.search-panel')).toHaveAttribute('data-survey-component', 'SurveyJS renders this');

  await dock.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  const outlines = dock.getByRole('button', { name: 'Highlight SurveyJS components' });
  await expect(outlines).toHaveAttribute('aria-pressed', 'true');
  await outlines.click();
  await expect(outlines).toHaveAttribute('aria-pressed', 'false');
  await expect(html).toHaveAttribute('data-survey-outlines', 'false');
});
