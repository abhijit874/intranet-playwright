import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';
import { FuturePoolPage } from '../pages/FuturePoolPage';

test.describe('Pool report - role-based access control', () => {

  // --- Authorized roles: read-only access ---

  test('leader can view current pool report but has no edit or remove icons', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('leader');
    await poolPage.navigateTo();
    await poolPage.assertPoolReportLoaded();
    await poolPage.assertEditIconNotVisible();
    await poolPage.assertRemoveIconNotVisible();
  });

  test('leader can view future pool report but has no add-to-pool icons', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('leader');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await futurePoolPage.assertPoolReportLoaded();
    await futurePoolPage.assertAddToPoolIconNotVisible();
  });

  // --- Unauthorized roles: Pool Report should not appear in navigation ---

  test('employee role does not have Pool Report in navigation', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('employee');
    await poolPage.assertPoolReportMenuItemNotVisible();
  });

  test('sales role does not have Pool Report in navigation', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('sales');
    await poolPage.assertPoolReportMenuItemNotVisible();
  });

});
