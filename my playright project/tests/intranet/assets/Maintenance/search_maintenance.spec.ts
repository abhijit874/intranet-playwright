import { test, expect } from '@playwright/test';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';

test('search asset maintenance record', async ({ page }) => {
  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();
  await maintenancePage.searchMaintenance('VWK1VWVV76');
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
