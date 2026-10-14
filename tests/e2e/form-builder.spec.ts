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
  // Simulate a Survey Creator save: customize the search form's name title
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

  await page.getByRole('button', { name: 'Edit in Builder: Patient Registration Form' }).click();
  const builder = page.getByRole('dialog', { name: 'Form Builder: Patient Registration Form' });
  await expect(builder).toBeVisible();

  const saveButton = builder.getByRole('button', { name: 'Save & Apply Form' });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Save & Apply closes the creator and returns to the originating view
  await expect(builder).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Form saved.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit in Builder: Patient Registration Form' })).toBeFocused();

  // The override is now stored in the database
  const forms = await (await request.get('/api/forms')).json();
  expect(Object.keys(forms)).toContain('patient-registration');
  expect(forms['patient-registration'].pages?.length).toBeGreaterThan(0);
});

test('the search form header opens its schema in the builder', async ({ page }) => {
  await page.goto('/manage');
  await page.getByRole('button', { name: 'Edit Search Form' }).click();
  const builder = page.getByRole('dialog', { name: 'Form Builder: Search for a Patient Form' });
  await expect(builder).toBeVisible();
  await builder.getByRole('button', { name: 'Close Form Builder' }).click();
  await expect(builder).toBeHidden();
});

test('Save & Apply from a dialog-opened builder closes the creator and reopens the dialog', async ({ page, request }) => {
  await page.goto('/patients/p-emma-thompson');

  await page.getByRole('button', { name: 'Record Visit' }).first().click();
  const visitDialog = page.getByRole('dialog', { name: 'Record Visit — Emma Thompson' });
  await expect(visitDialog).toBeVisible();

  // Jump into the builder from inside the dialog; the dialog closes
  await visitDialog.getByRole('button', { name: 'Edit Visit Form' }).click();
  const builder = page.getByRole('dialog', { name: 'Form Builder: Add New Visit Form' });
  await expect(builder).toBeVisible();
  await expect(visitDialog).toBeHidden();

  await builder.getByRole('button', { name: 'Save & Apply Form' }).click();

  // The creator closes and the visit dialog reopens showing the just-edited form
  await expect(builder).toBeHidden();
  await expect(visitDialog).toBeVisible();
  await expect(visitDialog.getByRole('button', { name: 'Save Visit' })).toBeVisible();
  await expect(visitDialog.getByRole('textbox', { name: 'Visit Date' })).toBeVisible();

  // The schema override was persisted
  const forms = await (await request.get('/api/forms')).json();
  expect(Object.keys(forms)).toContain('add-new-visit');
});
