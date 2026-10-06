import { test, expect } from '@playwright/test';
import { bypassLoginAsDoctor, bypassLoginAsPatient } from './auth-helpers';

test.beforeEach(async ({ request }) => {
  await request.post('/api/admin/reset');
});

test.describe('auth guard', () => {
  test('unauthenticated users are redirected to /login from any URL', async ({ page }) => {
    await page.goto('/medications');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Clinic Portal' })).toBeVisible();

    await page.goto('/patients/p-emma-thompson');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logging in lands on /manage and logging out returns to /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('e.g. sarah.miller').fill('sarah.miller');
    await page.getByPlaceholder('Enter your password').fill('demo1234');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/manage$/);
    await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('staff routes', () => {
  test.beforeEach(async ({ page }) => {
    await bypassLoginAsDoctor(page);
  });

  test('the root URL redirects a signed-in doctor to /manage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/manage$/);
    await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();
  });

  test('header navigation updates the URL for every view', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Register Patient' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: 'Register Patient' })).toBeVisible();

    await page.getByRole('link', { name: 'Medications' }).click();
    await expect(page).toHaveURL(/\/medications$/);
    await expect(page.getByText('Practice Medication Overview')).toBeVisible();

    await page.getByRole('link', { name: 'Inpatient Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByText('Inpatient & Clinical Settings')).toBeVisible();

    await page.getByRole('link', { name: 'Manage Patients' }).click();
    await expect(page).toHaveURL(/\/manage$/);
  });

  test('opening a profile navigates to /patients/:id and Back returns to /manage', async ({ page }) => {
    await page.goto('/manage');
    await page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Emma Thompson' }) })
      .getByRole('button', { name: 'Open Profile' })
      .first()
      .click();

    await expect(page).toHaveURL(/\/patients\/p-emma-thompson$/);
    await expect(page.getByText('Emma Thompson').first()).toBeVisible();
  });

  test('deep links open the right view directly', async ({ page }) => {
    await page.goto('/patients/p-david-miller');
    await expect(page.getByText('David Miller').first()).toBeVisible();
    await expect(page.getByText('Tension headache')).toHaveCount(0);

    await page.goto('/medications');
    await expect(page.getByText('Practice Medication Overview')).toBeVisible();
  });

  test('browser back and forward move between views', async ({ page }) => {
    await page.goto('/manage');
    await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();

    await page.getByRole('link', { name: 'Medications' }).click();
    await expect(page).toHaveURL(/\/medications$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/manage$/);
    await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\/medications$/);
    await expect(page.getByText('Practice Medication Overview')).toBeVisible();
  });

  test('unknown URLs redirect to /manage', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page).toHaveURL(/\/manage$/);
    await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();
  });

  test('an unknown patient id shows the not-found state with a back link', async ({ page }) => {
    await page.goto('/patients/p-nobody');
    await expect(page.getByText('Patient record not found.')).toBeVisible();

    await page.getByRole('button', { name: 'Back to Manage Patients' }).click();
    await expect(page).toHaveURL(/\/manage$/);
  });
});

test.describe('patient portal routes', () => {
  test.beforeEach(async ({ page }) => {
    await bypassLoginAsPatient(page);
  });

  test('a patient is redirected to /my-profile from staff URLs', async ({ page }) => {
    await page.goto('/manage');
    await expect(page).toHaveURL(/\/my-profile$/);
    await expect(page.getByText('Emma Thompson').first()).toBeVisible();
    // Staff navigation is not offered to patients
    await expect(page.getByRole('link', { name: 'Manage Patients' })).toHaveCount(0);
  });

  test('/my-profile deep link opens the patient own record', async ({ page }) => {
    await page.goto('/my-profile');
    await expect(page).toHaveURL(/\/my-profile$/);
    await expect(page.getByText('Emma Thompson').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Profile' })).toBeVisible();
  });

  test('patient portal hides staff controls and sends appointment requests to staff', async ({ page }) => {
    await page.goto('/my-profile');
    const patientHeading = page.getByRole('heading', { name: 'Emma Thompson', exact: true });
    await expect(patientHeading.locator('..').getByText('Active', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Edit Patient' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add New Visit' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Record Visit/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Revoke' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Request an Appointment' }).click();
    const dialog = page.getByRole('dialog', { name: 'Request an Appointment' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Patient Name')).toHaveValue('Emma Thompson');
    await dialog.getByLabel('Preferred Appointment Date').fill('2026-10-12');
    await dialog.getByLabel('Reason for Appointment').fill('Annual review');
    await dialog.getByRole('button', { name: 'Submit Request' }).click();

    await expect(page.getByRole('heading', { name: 'Appointment request sent' })).toBeVisible();
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Log out' }).click();

    await page.getByPlaceholder('e.g. sarah.miller').fill('sarah.miller');
    await page.getByPlaceholder('Enter your password').fill('demo1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/manage$/);
    await page.getByRole('link', { name: 'Inpatient Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Appointment Requests' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();
    await expect(page.getByText('Annual review')).toBeVisible();
  });
});
