import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const patientSearchSchema = JSON.parse(
  fs.readFileSync(path.resolve('src/survey/schemas/patient-search.json'), 'utf8'),
);

test.beforeEach(async ({ request }) => {
  await request.post('/api/admin/reset');
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
  await page.getByRole('button', { name: 'Inpatient Settings' }).click();

  // Open the builder for the first form (Patient Registration)
  await page.getByRole('button', { name: 'Edit in Builder' }).first().click();
  await expect(page.getByText('Form Builder:').first()).toBeVisible();

  // Wait for the creator to finish loading, then save
  const saveButton = page.getByRole('button', { name: 'Save & Apply Form' });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  await expect(page.getByText('Changes saved & active')).toBeVisible();

  // The override is now stored in the database
  const forms = await (await request.get('/api/forms')).json();
  expect(Object.keys(forms)).toContain('patient-registration');
  expect(forms['patient-registration'].pages?.length).toBeGreaterThan(0);
});
