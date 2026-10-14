import { test, expect } from '@playwright/test';
import { bypassLoginAsDoctor, bypassLoginAsPatient } from './auth-helpers';

test.beforeEach(async ({ request }) => {
  await request.post('/api/admin/reset');
});

const emmaLink = (page: import('@playwright/test').Page) => page.getByRole('link', { name: 'Open Profile: Emma Thompson' });

test.describe('auth guard', () => {
  test('unauthenticated users are redirected to /login from any URL', async ({ page }) => {
    await page.goto('/medications');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Clinic Portal Sign In' })).toBeVisible();

    await page.goto('/patients/p-emma-thompson');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logging in lands on /manage and logging out returns to /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('e.g. sarah.miller').fill('sarah.miller');
    await page.getByPlaceholder('Enter your password').fill('demo1234');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/manage$/);
    await expect(emmaLink(page)).toBeVisible();

    await page.getByRole('button', { name: 'Log Out' }).click();
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
    await expect(emmaLink(page)).toBeVisible();
  });

  test('header navigation updates the URL for every view', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'HEALTHCARE' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Manage Patients' })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Register Patient' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('link', { name: 'Register Patient' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'Register Patient' })).toBeVisible();
    await expect(page).toHaveTitle('Healthcare · Register Patient');

    await page.getByRole('link', { name: 'Medication', exact: true }).click();
    await expect(page).toHaveURL(/\/medications$/);
    await expect(page.getByRole('link', { name: 'Medication', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('Practice Medication Overview')).toBeVisible();

    await page.getByRole('link', { name: 'Inpatient Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('link', { name: 'Inpatient Settings' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('Inpatient & Clinical Settings')).toBeVisible();

    await page.getByRole('link', { name: 'Manage Patients' }).click();
    await expect(page).toHaveURL(/\/manage$/);
  });

  test('Inpatient Settings identifies the authenticated doctor for each seeded account', async ({ page }) => {
    await page.goto('/settings');

    const sarahRow = page.getByTestId('practitioner-row').filter({ hasText: 'Dr. Sarah Miller' });
    const markRow = page.getByTestId('practitioner-row').filter({ hasText: 'Dr. Mark Jones' });
    await expect(sarahRow).toContainText('Logged In');
    await expect(markRow).toContainText('Active');

    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByPlaceholder('e.g. sarah.miller').fill('mark.jones');
    await page.getByPlaceholder('Enter your password').fill('demo1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/manage$/);
    await page.getByRole('link', { name: 'Inpatient Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);

    const markLoggedInRow = page.getByTestId('practitioner-row').filter({ hasText: 'Dr. Mark Jones' });
    const sarahActiveRow = page.getByTestId('practitioner-row').filter({ hasText: 'Dr. Sarah Miller' });
    await expect(markLoggedInRow).toContainText('Logged In');
    await expect(sarahActiveRow).toContainText('Active');
    await expect(page.getByText('Logged In', { exact: true })).toHaveCount(1);
  });

  test('the patient name opens /patients/:id and the breadcrumb returns to /manage', async ({ page }) => {
    await page.goto('/manage');
    await emmaLink(page).click();

    await expect(page).toHaveURL(/\/patients\/p-emma-thompson$/);
    const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(primaryNav.getByRole('link', { name: 'Manage Patients' })).toHaveAttribute('aria-current', 'page');
    const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumbs.getByText('Emma Thompson')).toHaveAttribute('aria-current', 'page');

    await breadcrumbs.getByRole('link', { name: 'Manage Patients' }).click();
    await expect(page).toHaveURL(/\/manage$/);
  });

  test('deep links open the right view directly', async ({ page }) => {
    await page.goto('/patients/p-david-miller');
    await expect(page.getByRole('heading', { name: 'David Miller' })).toBeVisible();
    await expect(page.getByText('Tension headache')).toHaveCount(0);

    await page.goto('/medications');
    await expect(page.getByText('Practice Medication Overview')).toBeVisible();
  });

  test('browser back and forward move between views', async ({ page }) => {
    await page.goto('/manage');
    await expect(emmaLink(page)).toBeVisible();

    await page.getByRole('link', { name: 'Medication', exact: true }).click();
    await expect(page).toHaveURL(/\/medications$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/manage$/);
    await expect(emmaLink(page)).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\/medications$/);
    await expect(page.getByText('Practice Medication Overview')).toBeVisible();
  });

  test('unknown URLs redirect to /manage', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page).toHaveURL(/\/manage$/);
    await expect(emmaLink(page)).toBeVisible();
  });

  test('an unknown patient id shows the not-found state with a back link', async ({ page }) => {
    await page.goto('/patients/p-nobody');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();

    await page.getByRole('link', { name: 'Back to Manage Patients' }).click();
    await expect(page).toHaveURL(/\/manage$/);
  });
});

test.describe('patient portal routes', () => {
  test.beforeEach(async ({ page }) => {
    await bypassLoginAsPatient(page);
  });

  test('a patient is redirected to /portal from staff URLs', async ({ page }) => {
    await page.goto('/manage');
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByRole('heading', { name: 'Patient Portal' })).toBeVisible();
    await expect(page.getByText('Welcome, Emma Thompson.')).toBeVisible();
    // Staff navigation is not offered to patients
    await expect(page.getByRole('link', { name: 'Manage Patients' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Patient Portal' })).toHaveAttribute('aria-current', 'page');
  });

  test('the portal shows the patient own record without staff controls', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByRole('heading', { name: 'Emma Thompson', exact: true })).toBeVisible();
    await expect(page.getByText('Tension headache')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Patient' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Record Visit/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Edit Prescription/ })).toHaveCount(0);

    // Medication cards open the read-only SurveyJS record
    await page.getByRole('button', { name: 'View medication: Amlodipine 5mg Tablets' }).click();
    const dialog = page.getByRole('dialog', { name: 'Medication Record' });
    await expect(dialog.getByRole('textbox', { name: 'Medication', exact: true })).toHaveValue('Amlodipine 5mg Tablets');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'View medication: Amlodipine 5mg Tablets' })).toBeFocused();
  });

  test('appointment requests are sent from their own page and reach staff', async ({ page }) => {
    await page.goto('/portal');
    await page.getByRole('link', { name: 'Request an Appointment' }).click();
    await expect(page).toHaveURL(/\/appointments\/new$/);
    await expect(page.getByRole('link', { name: 'Request Appointment' })).toHaveAttribute('aria-current', 'page');

    await expect(page.getByLabel('Patient Name')).toHaveValue('Emma Thompson');
    await page.getByLabel('Preferred Appointment Date').fill('2026-10-12');
    await page.getByLabel('Reason for Appointment').fill('Annual review');
    await page.getByRole('button', { name: 'Submit Request' }).click();

    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByRole('status').filter({ hasText: 'Appointment request sent.' })).toBeVisible();
    await expect(page.locator('.appointment-request')).toContainText('Annual review');

    await page.getByRole('button', { name: 'Log Out' }).click();
    await page.getByPlaceholder('e.g. sarah.miller').fill('sarah.miller');
    await page.getByPlaceholder('Enter your password').fill('demo1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/manage$/);
    await page.getByRole('link', { name: 'Inpatient Settings' }).click();
    const requests = page.locator('.appointments');
    await expect(requests.getByRole('heading', { name: 'Appointment Requests' })).toBeVisible();
    await expect(requests.getByRole('heading', { name: 'Emma Thompson' })).toBeVisible();
    await expect(requests.getByText('Annual review')).toBeVisible();
  });

  test('cancelling an appointment request returns to the portal', async ({ page }) => {
    await page.goto('/appointments/new');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/portal$/);
  });
});
