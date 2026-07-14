import { test, expect } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';
import { FuturePoolPage } from '../pages/FuturePoolPage';

// Business rule under test:
//   In the current pool tab, an employee can have only ONE entry — regardless of which project
//   they are allocated to. Duplicate entries for the same employee are not allowed.

const employeeName = 'Abhijit Kasbe';  // change before running

test.describe('Pool report - one entry per employee in current pool', () => {

  test('employee appears exactly once in the current pool tab', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(employeeName);

    const employeeRows = page.locator('table tbody tr')
      .filter({ hasText: employeeName });

    await expect(employeeRows).toHaveCount(1);
  });

  test('add-to-pool icon is absent in future pool for an employee already in current pool', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('admin');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();

    const searchBox = page.locator('#dt-search-0').first();
    await searchBox.fill(employeeName);
    await searchBox.press('Enter');
    await page.waitForTimeout(1000);

    const row = page.locator('table tbody tr')
      .filter({ hasText: employeeName })
      .first();

    await expect(row).toBeVisible({ timeout: 10000 });

    // Employee is already in current pool — system must not allow adding them again
    await expect(row.locator('i.text-success.ri-user-add-fill')).toHaveCount(0);
  });

});
