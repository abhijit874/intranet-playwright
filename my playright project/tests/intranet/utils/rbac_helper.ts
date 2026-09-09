import { expect, Page } from '@playwright/test';

/**
 * Shared helpers for direct-URL access control.
 *
 * The intranet hides restricted pages from a role's navigation menu, but menu
 * visibility is not the same thing as authorization. These helpers assert on
 * what happens when a role types the URL, which is the only check that proves
 * the controller itself is guarded.
 *
 * Two different flash messages are in use on staging:
 *   - 'You are not authorized to access this page.'  (most controllers)
 *   - 'You are not authorize to perform this action' (employee on some pages)
 * so the matcher below accepts either wording.
 */
export const NOT_AUTHORIZED = /You are not authoriz(ed to access this page|e to perform this action)/i;

/** A direct visit to `path` must bounce the user home with an authorization flash. */
export async function expectAccessDenied(page: Page, path: string) {
  await page.goto(path);
  await expect(page, `${path} should have redirected home`).toHaveURL(/\/$/);
  await expect(page.locator('#flashes')).toContainText(NOT_AUTHORIZED);
}

/** A direct visit to `path` must render the page itself. */
export async function expectAccessAllowed(page: Page, path: string) {
  await page.goto(path);
  await expect(page, `${path} should have stayed open`).toHaveURL(new RegExp(`${path.replace(/\//g, '\/')}`));
}
