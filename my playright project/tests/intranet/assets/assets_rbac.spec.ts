import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Assets access control.
 *
 * Inventory, allocations and maintenance are admin/HR only. Every other role is
 * bounced home with an authorization flash on a direct URL hit, which these
 * tests lock in so a future permissions change cannot loosen it silently.
 */
const ASSET_PATHS = ['/organisation_assets', '/asset_allocations', '/asset_maintainances'];
const DENIED_ROLES: UserKey[] = ['employee', 'manager', 'finance', 'sales', 'leader', 'ld'];

test.describe('Assets - access per role', () => {

  for (const role of ['admin', 'hr'] as const) {
    test(`${role}: all three asset pages open`, async ({ page }) => {
      await login(page, role);
      for (const path of ASSET_PATHS) {
        await page.goto(path);
        await expect(page, `${path} should stay open for ${role}`).toHaveURL(new RegExp(`${path}$`));
      }
    });
  }

  for (const role of DENIED_ROLES) {
    for (const path of ASSET_PATHS) {
      test(`${role}: a direct visit to ${path} is refused`, async ({ page }) => {
        await login(page, role);
        await expectAccessDenied(page, path);
      });
    }

    test(`${role}: the Assets navigation entry is absent`, async ({ page }) => {
      await login(page, role);
      await expect(page.locator('a[href="/organisation_assets"]')).toHaveCount(0);
    });
  }
});
