import { test } from '@playwright/test';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';

test('removing maintenance', async ({ page }) => {
  const maintenanceReason = 'playwright automation with codex edited';

  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();
  await maintenancePage.searchMaintenance(maintenanceReason);
  await maintenancePage.clickEditOnRow(maintenanceReason);
  await maintenancePage.markAsReceived();
  await maintenancePage.submit();
});
