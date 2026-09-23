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
