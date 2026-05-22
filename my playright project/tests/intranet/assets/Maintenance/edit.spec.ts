import { test, expect } from '@playwright/test';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';

test('editing maintenance', async ({ page }) => {
  const maintenanceReason = 'playwright automation with codex';
  const updatedReason = 'playwright automation with codex edited';

  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();
  await maintenancePage.searchMaintenance(maintenanceReason);
  await maintenancePage.clickEditOnRow(maintenanceReason);

  await page.locator('#asset_maintainance_reason').clear();
  await maintenancePage.fillReason(updatedReason);
  await maintenancePage.submit();
});
