import { test, expect } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';
import { FuturePoolPage } from '../pages/FuturePoolPage';

// Access matrix for Pool Report:
//   admin  → full access (edit / remove / add-to-pool visible)
//   hr     → full access (edit / remove / add-to-pool visible)
//   leader → read-only  (table visible, no action icons)
//   employee → no access (Pool Report not in navigation)
//   sales    → no access (Pool Report not in navigation)

test.describe('Pool report - access verification per role', () => {

  // ─── admin ────────────────────────────────────────────────────────────────

  test('admin: Pool Report navigation item is visible', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await expect(page.locator('span.fs-6.ms-2', { hasText: 'Pool Report' })).toBeVisible();
  });

  test('admin: current pool table loads successfully', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.assertPoolReportLoaded();
  });

  test('admin: edit and remove icons are visible in current pool table', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await expect(page.locator('table tbody tr i.ri-edit-2-line').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table tbody tr i.ri-user-minus-fill').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin: add-to-pool icon is visible in future pool table', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('admin');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await expect(page.locator('table tbody tr i.text-success.ri-user-add-fill').first()).toBeVisible({ timeout: 10000 });
  });

  // ─── hr ───────────────────────────────────────────────────────────────────

  test('hr: Pool Report navigation item is visible', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('hr');
    await expect(page.locator('span.fs-6.ms-2', { hasText: 'Pool Report' })).toBeVisible();
  });

  test('hr: current pool table loads successfully', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('hr');
    await poolPage.navigateTo();
    await poolPage.assertPoolReportLoaded();
  });

  test('hr: edit and remove icons are visible in current pool table', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('hr');
    await poolPage.navigateTo();
    await expect(page.locator('table tbody tr i.ri-edit-2-line').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table tbody tr i.ri-user-minus-fill').first()).toBeVisible({ timeout: 10000 });
  });

  test('hr: add-to-pool icon is visible in future pool table', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('hr');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await expect(page.locator('table tbody tr i.text-success.ri-user-add-fill').first()).toBeVisible({ timeout: 10000 });
  });

  // ─── leader ───────────────────────────────────────────────────────────────

  test('leader: Pool Report navigation item is visible', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('leader');
    await expect(page.locator('span.fs-6.ms-2', { hasText: 'Pool Report' })).toBeVisible();
  });

  test('leader: current pool table loads successfully', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('leader');
    await poolPage.navigateTo();
    await poolPage.assertPoolReportLoaded();
  });

  test('leader: edit and remove icons are NOT visible in current pool table', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('leader');
    await poolPage.navigateTo();
    await poolPage.assertPoolReportLoaded();
    await expect(page.locator('table tbody tr i.ri-edit-2-line')).toHaveCount(0);
    await expect(page.locator('table tbody tr i.ri-user-minus-fill')).toHaveCount(0);
  });

  test('leader: add-to-pool icon is NOT visible in future pool table', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('leader');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await futurePoolPage.assertPoolReportLoaded();
    await expect(page.locator('table tbody tr i.text-success.ri-user-add-fill')).toHaveCount(0);
  });

  test('leader: can open employee public profile from current pool tab', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('leader');
    await poolPage.navigateTo();
    await poolPage.searchEmployee('Aastha Bhargava');
    await poolPage.clickEmployeeProfileLink('Aastha Bhargava');
    await poolPage.assertProfilePageOpened('Aastha Bhargava');
  });

  test('leader: can open employee public profile from future pool tab', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('leader');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await futurePoolPage.searchEmployee('Abhijit Kasbe');
    await futurePoolPage.clickEmployeeProfileLink('Abhijit Kasbe');
    await futurePoolPage.assertProfilePageOpened('Abhijit Kasbe');
  });

  test('leader: can view past projects of an employee from future pool', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('leader');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await futurePoolPage.searchEmployee('Aastha Bhargava', 'Pool-BFSI');
    await futurePoolPage.clickViewPastProjects('Aastha Bhargava');
    await futurePoolPage.assertPastProjectsPageOpened();
  });

  // ─── employee ─────────────────────────────────────────────────────────────

  test('employee: Pool Report navigation item is NOT visible', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('employee');
    await expect(page.locator('span.fs-6.ms-2', { hasText: 'Pool Report' })).toHaveCount(0);
  });

  // ─── sales ────────────────────────────────────────────────────────────────

  test('sales: Pool Report navigation item is NOT visible', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('sales');
    await expect(page.locator('span.fs-6.ms-2', { hasText: 'Pool Report' })).toHaveCount(0);
  });

});
