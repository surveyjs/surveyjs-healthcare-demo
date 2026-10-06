import { test, expect } from '@playwright/test';
import { bypassLoginAsDoctor } from './auth-helpers';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/admin/reset');
  await bypassLoginAsDoctor(page);
});

test('manage patients screen lists all patients from the SQLite database', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'David Miller' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sophie Bennett' })).toBeVisible();

  const emmaCard = page.getByRole('button', { name: 'Open Profile' }).filter({ hasText: 'Emma Thompson' });
  await expect(emmaCard.getByText('Active', { exact: true })).toHaveCount(0);
  await emmaCard.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/patients\/p-emma-thompson$/);
  await expect(
    page.getByRole('heading', { name: 'Emma Thompson', exact: true }).locator('..').getByText('Active', { exact: true }),
  ).toBeVisible();

  // Seeded details rendered from DB rows
  await expect(page.getByText('945 128 4567', { exact: true })).toBeVisible();
  await expect(page.getByText('12 Oakfield Road', { exact: false })).toBeVisible();
});

test('patient profile shows visits and prescriptions loaded from the database', async ({ page }) => {
  await page.goto('/');

  const emmaCard = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Emma Thompson' }) })
    .getByRole('button', { name: 'Open Profile' })
    .first();
  await emmaCard.click();

  await expect(page.getByText('Emma Thompson').first()).toBeVisible();
  // Seeded visit and prescription data
  await expect(page.getByText('Tension headache').first()).toBeVisible();
  await expect(page.getByText('Amlodipine 5mg Tablets').first()).toBeVisible();
  await expect(page.getByText('Ibuprofen 200mg Tablets').first()).toBeVisible();

  await page.getByRole('button', { name: 'Survey view' }).click();
  await expect(page.getByLabel('Visit Date')).toBeVisible();
  await expect.poll(async () => page.getByRole('textbox', { name: 'Diagnosis' }).evaluateAll(
    (inputs) => inputs.some((input) => (input as HTMLInputElement).value === 'Tension headache'),
  )).toBe(true);
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
  await page.getByLabel('Filter by patient name').fill('Emma');
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table.getByText('Amlodipine 5mg Tablets')).toBeVisible();
  await expect(table.getByText('Ibuprofen 200mg Tablets')).toBeVisible();
  await expect(table.getByText('Salbutamol 100mcg Inhaler')).toHaveCount(0);

  await page.getByLabel('Filter by patient name').fill('');
  await page.getByLabel('Filter by NHS number').fill('832 918 3491');
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByLabel('Filter by medication').fill('salbutamol');
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByLabel('Filter by medication').fill('');
  await page.getByLabel('Filter by status').selectOption('Completed');
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(table.getByText('Ibuprofen 200mg Tablets')).toBeVisible();

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'Sort by Patient' }).click();
  await expect(table.locator('tbody tr').first()).toContainText('Sophie Bennett');
  await expect(table.getByRole('columnheader', { name: /Patient/ })).toHaveAttribute('aria-sort', 'descending');

  const emmaRow = table.locator('tbody tr').filter({ hasText: 'Amlodipine 5mg Tablets' });
  await emmaRow.getByRole('link', { name: 'View Patient' }).click();
  await expect(page).toHaveURL(/\/patients\/p-emma-thompson$/);
  await page.goto('/medications');
  await page.getByRole('button', { name: 'View Medication Record' }).first().click();
  const recordDialog = page.getByRole('dialog', { name: 'Medication Record' });
  await expect(recordDialog).toBeVisible();
  await expect(recordDialog.getByRole('textbox', { name: 'Medication', exact: true })).toHaveValue('Amlodipine 5mg Tablets');
  await expect(recordDialog.getByText('Once daily', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close medication record' }).click();
  await expect(recordDialog).toBeHidden();
});
