import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { bypassLoginAsDoctor } from './auth-helpers';

const patientSearchSchema = JSON.parse(
  fs.readFileSync(path.resolve('src/survey/schemas/patient-search.json'), 'utf8'),
);

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/admin/reset');
  await bypassLoginAsDoctor(page);
});

test('a customized schema stored in SQLite is rendered instead of the default', async ({ page, request }) => {
  // Simulate a Survey Creator save: customize the search form's last name title
  const customized = JSON.parse(JSON.stringify(patientSearchSchema));
  customized.pages[0].elements[0].title = 'Surname (customized)';
  const put = await request.put('/api/forms/patient-search', { data: customized });
  expect(put.ok()).toBeTruthy();

  await page.goto('/');
  await expect(page.getByText('Surname (customized)')).toBeVisible();

  // Removing the override restores the default schema
  await request.delete('/api/forms/patient-search');
  await page.reload();
  await expect(page.getByText('Surname (customized)')).toHaveCount(0);
});

test('saving a form in the Survey Creator persists the schema to SQLite', async ({ page, request }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Inpatient Settings' }).click();

  // Open the builder for the first form (Patient Registration)
  await page.getByRole('button', { name: 'Edit in Builder' }).first().click();
  await expect(page.getByText('Form Builder:').first()).toBeVisible();

  // Wait for the creator to finish loading, then save
  const saveButton = page.getByRole('button', { name: 'Save & Apply Form' });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Save & Apply closes the creator and returns to the originating view
  await expect(page.getByText('Form Builder:')).toHaveCount(0);
  await expect(page.getByText('Schema Saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit in Builder' }).first()).toBeVisible();

  // The override is now stored in the database
  const forms = await (await request.get('/api/forms')).json();
  expect(Object.keys(forms)).toContain('patient-registration');
  expect(forms['patient-registration'].pages?.length).toBeGreaterThan(0);
});

test('Save & Apply from a modal-opened builder closes the creator and reopens the modal', async ({ page, request }) => {
  await page.goto('/');

  // Open Emma Thompson's profile and the Add New Visit modal
  await page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Emma Thompson' }) })
    .getByRole('button', { name: 'Open Profile' })
    .first()
    .click();
  await page.getByRole('button', { name: 'Add New Visit' }).click();
  await expect(page.getByRole('heading', { name: 'Add New Visit' })).toBeVisible();

  // Jump into the builder from inside the modal; the modal closes
  await page.getByRole('button', { name: 'Customize Patient Visit Form' }).click();
  await expect(page.getByText('Form Builder:').first()).toBeVisible();
  // The creator's design surface shows the schema title, so assert on the modal's footer button
  await expect(page.getByRole('button', { name: 'Save Visit' })).toHaveCount(0);

  const saveButton = page.getByRole('button', { name: 'Save & Apply Form' });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // The creator closes and the Add New Visit modal reopens showing the just-edited form
  await expect(page.getByText('Form Builder:')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Add New Visit' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Visit' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Visit Date' })).toBeVisible();

  // The schema override was persisted
  const forms = await (await request.get('/api/forms')).json();
  expect(Object.keys(forms)).toContain('add-new-visit');
});
