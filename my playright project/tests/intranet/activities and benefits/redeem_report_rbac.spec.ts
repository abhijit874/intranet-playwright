import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Redeem Invoice report access control.
 *
 * /redeems/summary lists every employee's redemption: employee ID, name, work
 * email, amount, redeem date, paid date and payment status, plus a Reports
 * export. It belongs to HR and Finance and appears only in HR's navigation.
 *
 * Trello #1309 — the page has no authorization filter, so any signed-in
 * employee can read the whole company's redemption data by typing the URL.
 * Those tests are marked test() until the guard is added.
 */
test.describe('Redeem Invoice report - access per role', () => {

  test('hr: the Redeem Invoice report opens with its expected columns', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/redeems/summary');
    await expect(page.getByRole('heading', { name: 'Redeem Invoice' })).toBeVisible();
    const headers = page.locator('#sortable-benefits thead th');
    await expect(headers).toContainText([
      '#', 'Employee ID', 'Employee Name', 'Employee Email',
      'Amount', 'Redeem Date', 'Paid Date', 'Payment Status',
    ]);
  });

  test('hr: the report offers a date range filter and a Reports export', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/redeems/summary');
    await expect(page.locator('#start_date')).toBeVisible();
    await expect(page.locator('#end_date')).toBeVisible();
    // "Reports" also appears in the collapsed sidebar menu (and as "Redeem
    // Reports" / "Export Reports"), so match the page's own dropdown button
    // rather than any text saying Reports.
    await expect(page.getByRole('button', { name: 'Reports', exact: true })).toBeVisible();
  });

  // Trello #1309 (FIXED, verified 2026-09-23) — the report used to be readable by
  // every signed-in role, exposing colleagues' redemption amounts and work
  // emails. It is now restricted; these are ordinary tests again.

  const unauthorisedRoles: UserKey[] = ['employee', 'manager', 'sales', 'leader', 'ld'];

  for (const role of unauthorisedRoles) {
    test(`${role}: a direct visit to /redeems/summary is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/redeems/summary');
    });
  }

  test('employee: no other employee\'s redemption data is rendered', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/redeems/summary');
    await expect(page.locator('#sortable-benefits tbody tr')).toHaveCount(0);
  });

  test('employee: no colleague email addresses leak into the page', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/redeems/summary');
    const body = (await page.locator('body').innerText()).toLowerCase();
    const ownEmail = (process.env.EMPLOYEE_USER_EMAIL ?? '').toLowerCase();
    const others = Array.from(new Set(body.match(/[\w.+-]+@joshsoftware\.com/g) ?? []))
      .filter((e) => e !== ownEmail);
    expect(others, `leaked colleague emails: ${others.join(', ')}`).toEqual([]);
  });
});
