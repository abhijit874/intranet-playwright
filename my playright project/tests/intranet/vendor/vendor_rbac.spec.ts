import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Vendors access control.
 *
 * Vendors is the narrowest module in the app: admin, HR and finance only.
 * Notably leader and sales are refused even though they can reach Companies and
 * Projects, so this matrix is worth pinning down explicitly.
 */
test.describe('Vendors - access per role', () => {

  const SHARED_COLUMNS = ['#', 'Company', 'Category', 'GST No.', 'Name', 'Role', 'Phone No.', 'Email'];

  for (const role of ['admin', 'hr', 'finance'] as const) {
    test(`${role}: the vendor list opens with its expected columns`, async ({ page }) => {
      await login(page, role);
      await page.goto('/vendors');
      await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible();
      await expect(page.locator('#vendor_stream_table thead th')).toContainText(SHARED_COLUMNS);
    });
  }

  // admin and hr get write access; finance is read-only. The distinction shows
  // up as a ninth "Action" column and the Add Vendor control, both of which
  // finance does not get.
  for (const role of ['admin', 'hr'] as const) {
    test(`${role}: the list carries an Action column and the Add Vendor control`, async ({ page }) => {
      await login(page, role);
      await page.goto('/vendors');
      await expect(page.locator('#vendor_stream_table thead th')).toHaveCount(9);
      await expect(page.locator('#vendor_stream_table thead th').last()).toHaveText('Action');
      await expect(page.getByText('Add Vendor')).toBeVisible();
    });
  }

  test('finance: vendor access is read-only - no Action column, no Add Vendor', async ({ page }) => {
    await login(page, 'finance');
    await page.goto('/vendors');
    await expect(page.locator('#vendor_stream_table thead th')).toHaveCount(8);
    await expect(page.locator('#vendor_stream_table thead th')).not.toContainText(['Action']);
    await expect(page.getByText('Add Vendor')).toHaveCount(0);
  });

  const deniedRoles: UserKey[] = ['employee', 'manager', 'sales', 'leader', 'ld'];

  for (const role of deniedRoles) {
    test(`${role}: a direct visit to /vendors is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/vendors');
    });

    test(`${role}: the Vendors navigation entry is absent`, async ({ page }) => {
      await login(page, role);
      await expect(page.locator('a[href="/vendors"]')).toHaveCount(0);
    });
  }
});
