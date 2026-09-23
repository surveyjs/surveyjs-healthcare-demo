import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('/api/admin/reset');
});

test('app is gated by the login screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Clinic Portal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  // No patient data before signing in
  await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toHaveCount(0);
});

test('roster quick sign-in fills credentials and logs in a doctor', async ({ page }) => {
  await page.goto('/');

  // SurveyJS dropdown: the combobox input has an intercepting wrapper
  await page.getByRole('combobox').click({ force: true });
  await page.getByRole('option', { name: 'Dr. Sarah Miller (Doctor)', exact: true }).click();

  await expect(page.getByPlaceholder('e.g. sarah.miller')).toHaveValue('sarah.miller');
  await expect(page.getByPlaceholder('Enter your password')).toHaveValue('demo1234');

  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Logged in as:')).toBeVisible();
  await expect(page.getByText('Dr. Sarah Miller').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();
});

test('a patient from the roster can sign in with manual credentials', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('e.g. sarah.miller').fill('emma.thompson');
  await page.getByPlaceholder('Enter your password').fill('demo1234');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Logged in as:')).toBeVisible();
  await expect(page.getByText('Emma Thompson').first()).toBeVisible();
});

test('invalid credentials keep the user on the login screen with an error', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('e.g. sarah.miller').fill('sarah.miller');
  await page.getByPlaceholder('Enter your password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByRole('alert')).toContainText('Invalid username or password');
  await expect(page.getByRole('heading', { name: 'Clinic Portal' })).toBeVisible();
});

test('logging out returns to the login screen', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('e.g. sarah.miller').fill('mark.jones');
  await page.getByPlaceholder('Enter your password').fill('demo1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Dr. Mark Jones').first()).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();

  await expect(page.getByRole('heading', { name: 'Clinic Portal' })).toBeVisible();
  // Session is cleared, so a reload stays on the login screen
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Clinic Portal' })).toBeVisible();
});
