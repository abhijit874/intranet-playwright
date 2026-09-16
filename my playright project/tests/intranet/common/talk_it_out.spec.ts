import { test, expect, Page } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';

/**
 * Talk It Out.
 *
 * A floating circular button rendered on every page, opening #talkItOutModal.
 * The modal points employees at the Workplace FAQ on HONO first, and offers a
 * Google Form as the fallback route. Both links open in a new tab.
 *
 * This is cross-cutting rather than owned by any one module, hence its own
 * folder: it appears on the dashboard and on every module page, for every role.
 *
 * Deliberate scope limit: these tests assert the links' href and target
 * attributes and never click them. Following "Continue" would open the real
 * intake Google Form, and a suite run must not submit — or even land on — a
 * live form that a human monitors.
 */
const HONO_URL = 'https://josh.honohr.com/';
const TRIGGER = 'button[data-bs-target="#talkItOutModal"]';

async function openTalkItOut(page: Page) {
  const trigger = page.locator(TRIGGER);
  await expect(trigger).toBeVisible();
  await trigger.click();
  const modal = page.locator('#talkItOutModal');
  await expect(modal).toBeVisible();
  return modal;
}

test.describe('Talk It Out', () => {

  // The point of the feature is that it is reachable from anywhere, so check a
  // spread of pages rather than just one.
  const PAGES = [
    '/',
    '/contributions',
    '/view/leave_applications',
    '/projects',
    '/companies',
  ];

  for (const path of PAGES) {
    test(`hr: the Talk It Out button is present on ${path}`, async ({ page }) => {
      await login(page, 'hr');
      await page.goto(path);
      await expect(page.locator(TRIGGER)).toBeVisible();
    });
  }

  test('hr: the modal opens with its guidance text', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/');
    const modal = await openTalkItOut(page);

    await expect(modal.locator('.modal-title')).toHaveText('Talk It Out');
    await expect(modal).toContainText('Workplace FAQ');
    await expect(modal).toContainText('HONO');
  });

  test('hr: the modal offers the HONO link, opening in a new tab', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/');
    const modal = await openTalkItOut(page);

    const hono = modal.getByRole('link', { name: /Take me to HONO/i });
    await expect(hono).toBeVisible();
    await expect(hono).toHaveAttribute('href', HONO_URL);
    await expect(hono).toHaveAttribute('target', '_blank');
  });

  test('hr: the modal offers the Continue link, opening in a new tab', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/');
    const modal = await openTalkItOut(page);

    const cont = modal.getByRole('link', { name: /^Continue$/i });
    await expect(cont).toBeVisible();
    await expect(cont).toHaveAttribute('target', '_blank');
    // Asserted by shape, not by exact URL: the form link can be swapped without
    // that being a regression. Never navigated to — see the file header.
    await expect(cont).toHaveAttribute('href', /^https:\/\/(forms\.gle|docs\.google\.com)\//);
  });

  test('hr: the modal can be dismissed', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/');
    const modal = await openTalkItOut(page);

    await modal.locator('[data-bs-dismiss="modal"]').first().click();
    await expect(modal).not.toBeVisible();
  });

  // Talk It Out is support tooling for everyone, so every role must get it -
  // including a plain employee, who is the likeliest person to need it.
  const ALL_ROLES: UserKey[] = [
    'employee', 'hr', 'admin', 'manager', 'finance', 'sales', 'leader', 'ld', 'marketing',
  ];

  for (const role of ALL_ROLES) {
    test(`${role}: Talk It Out is available and opens`, async ({ page }) => {
      await login(page, role);
      const modal = await openTalkItOut(page);
      await expect(modal.getByRole('link', { name: /Take me to HONO/i })).toHaveAttribute('href', HONO_URL);
    });
  }
});
