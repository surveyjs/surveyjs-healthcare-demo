import { Page } from '@playwright/test';

/** Injects a stored doctor session so specs that aren't about auth skip the login screen. */
export async function bypassLoginAsDoctor(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'hc-auth-user',
      JSON.stringify({
        id: 'u-sarah-miller',
        username: 'sarah.miller',
        fullName: 'Dr. Sarah Miller',
        role: 'doctor',
      }),
    );
  });
}

/** Injects a stored patient session (Emma Thompson) for patient-portal specs. */
export async function bypassLoginAsPatient(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'hc-auth-user',
      JSON.stringify({
        id: 'u-emma-thompson',
        username: 'emma.thompson',
        fullName: 'Emma Thompson',
        role: 'patient',
        patientId: 'p-emma-thompson',
      }),
    );
  });
}
