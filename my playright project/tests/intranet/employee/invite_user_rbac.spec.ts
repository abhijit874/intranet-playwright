import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Invite Employee access control.
 *
 * /invite_user creates a user account and sends an invitation mail. It appears
 * in the navigation for admin and HR only.
 *
 * Trello #1310 (FIXED, verified 2026-09-23) — every role except a plain employee
 * used to reach this form by URL and successfully send an invitation, creating an
 * account and outbound mail. It is now restricted to admin and hr, so these are
 * ordinary tests again.
 *
 * Note: none of these tests submit the form. Submitting creates a real account
 * and sends real mail, which is not something a suite run should do on every
 * pass; reachability of the form is the thing under test.
 */
test.describe('Invite Employee - access per role', () => {

  for (const role of ['admin', 'hr'] as const) {
    test(`${role}: the Invite Employee form opens with its required fields`, async ({ page }) => {
      await login(page, role);
      await page.goto('/invite_user');
      await expect(page.getByRole('heading', { name: 'Invite Employee' })).toBeVisible();
      await expect(page.locator('#user_email')).toBeVisible();
      await expect(page.locator('#user_role')).toBeVisible();
      await expect(page.locator('#user_employee_detail_attributes_location')).toBeVisible();
    });
  }

  test('admin: the location dropdown lists the office locations', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/invite_user');
    const locations = page.locator('#user_employee_detail_attributes_location option');
    await expect(locations).toContainText(['Bengaluru', 'Dubai', 'Plano', 'Pune', 'Singapore']);
  });

  test('employee: a direct visit to /invite_user is refused', async ({ page }) => {
    await login(page, 'employee');
    await expectAccessDenied(page, '/invite_user');
  });

  // Trello #1310 (FIXED, verified 2026-09-23) — the form used to open for every
  // one of these roles, letting a non-admin create an account and send
  // invitation mail. It is now restricted to admin and hr.

  const unauthorisedRoles: UserKey[] = ['manager', 'finance', 'sales', 'leader', 'ld'];

  for (const role of unauthorisedRoles) {
    test(`${role}: a direct visit to /invite_user is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/invite_user');
    });
  }

  test('manager: the invite form does not render', async ({ page }) => {
    await login(page, 'manager');
    await page.goto('/invite_user');
    await expect(page.locator('#user_email')).toHaveCount(0);
  });
});
