import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('/api/admin/reset');
});

test('manage patients screen lists all patients from the SQLite database', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'David Miller' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sophie Bennett' })).toBeVisible();

  // Seeded details rendered from DB rows
  await expect(page.getByText('945 128 4567')).toBeVisible();
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
});

test('medications registry iterates prescriptions of all patients from the database', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Medications' }).click();

  await expect(page.getByText('Practice Prescription Registry')).toBeVisible();
  await expect(page.getByRole('cell', { name: /Amlodipine 5mg Tablets/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Ibuprofen 200mg Tablets/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Salbutamol 100mcg Inhaler/ })).toBeVisible();
});
