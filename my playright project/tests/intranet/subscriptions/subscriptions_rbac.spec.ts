import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';
import { SubscriptionsPage } from '../pages/SubscriptionsPage';

// Access matrix for Subscriptions (Inventory + Allocations):
//   admin / hr → nav group, both lists, add forms
//   everyone else → no nav entry, and a direct hit on any of the URLs is
//   redirected home with an authorization flash.
const GUARDED_PATHS = ['/software_subscriptions/new', '/software_allocations/new'];
// Not guarded today — see the open defect at the bottom.
const OPEN_LIST_PATHS = ['/software_subscriptions', '/software_allocations'];

test.describe('Subscriptions - access per role', () => {
  const allowedRoles: UserKey[] = ['admin', 'hr'];

  for (const role of allowedRoles) {
    test(`${role}: Subscriptions is in the navigation and both lists open`, async ({ page }) => {
      await login(page, role);
      const subs = new SubscriptionsPage(page);
      await expect(subs.navGroup()).toHaveCount(1);
      await subs.navigateToInventory();
      await expect(subs.inventoryTable()).toBeVisible();
      await subs.navigateToAllocations();
      await expect(subs.allocationsTable()).toBeVisible();
    });
  }

  const deniedRoles: UserKey[] = ['employee', 'manager', 'leader', 'sales', 'finance', 'ld'];

  for (const role of deniedRoles) {
    test(`${role}: Subscriptions is absent from the navigation`, async ({ page }) => {
      await login(page, role);
      await expect(page.locator('a[href="#softwareMenu"]')).toHaveCount(0);
      await expect(page.locator('a[href="/software_subscriptions"], a[href="/software_allocations"]')).toHaveCount(0);
    });

    for (const path of GUARDED_PATHS) {
      test(`${role}: a direct visit to ${path} is refused`, async ({ page }) => {
        await login(page, role);
        await expectAccessDenied(page, path);
      });
    }
  }

  // Open defect (found 2026-10-28): neither LIST is guarded. Every role except
  // finance can open /software_subscriptions and /software_allocations by URL
  // and sees the whole company's data, including spend, card holder and card
  // last-4 digits. Only the nav entry is hidden; the /new forms are refused.
  // Marked test.fail() so the suite stays green while the gap is open; they
  // will flag as "unexpectedly passed" once fixed.
  for (const role of ['employee', 'manager', 'leader', 'sales', 'ld'] as const) {
    for (const path of OPEN_LIST_PATHS) {
      test.fail(`${role}: a direct visit to ${path} is refused`, async ({ page }) => {
        await login(page, role);
        await expectAccessDenied(page, path);
      });
    }
  }

  for (const path of OPEN_LIST_PATHS) {
    test(`finance: a direct visit to ${path} is refused`, async ({ page }) => {
      await login(page, 'finance');
      await expectAccessDenied(page, path);
    });
  }
});
