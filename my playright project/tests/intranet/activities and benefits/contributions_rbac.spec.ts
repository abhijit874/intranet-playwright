import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Contributions access control.
 *
 * Four surfaces, four different matrices:
 *   /contributions                          own contributions, every role
 *   /contributions/employee_activity_list   approval queue: admin, hr, finance, leader
 *   /contributions/summary                  Benefits Summary: admin, hr only
 *   /contributions/new_l_and_d_contribution L&D record: hr
 */
test.describe('Contributions - access per role', () => {

  test('employee: own contributions page opens', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/contributions');
    await expect(page.getByRole('heading', { name: 'Contributions' })).toBeVisible();
    await expect(page.getByText('Add Contribution')).toBeVisible();
  });

  for (const role of ['admin', 'hr', 'finance', 'leader'] as const) {
    test(`${role}: the approval queue opens with all four status tabs`, async ({ page }) => {
      await login(page, role);
      await page.goto('/contributions/employee_activity_list');
      for (const tab of ['Pending', 'Approved', 'Rejected', 'Frozen']) {
        await expect(page.getByRole('tab', { name: tab })).toBeVisible();
      }
    });
  }

  for (const role of ['employee', 'manager', 'sales', 'ld'] as const) {
    test(`${role}: a direct visit to the approval queue is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/contributions/employee_activity_list');
    });
  }

  test('hr: the Benefits Summary opens with a year and quarter filter', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/contributions/summary');
    await expect(page.getByRole('heading', { name: 'Benefits Summary' })).toBeVisible();
    await expect(page.locator('#year')).toBeVisible();
    await expect(page.locator('#quarter')).toBeVisible();
  });

  const summaryDenied: UserKey[] = ['employee', 'manager', 'finance', 'sales', 'leader', 'ld'];

  for (const role of summaryDenied) {
    test(`${role}: a direct visit to /contributions/summary is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/contributions/summary');
    });
  }
});
