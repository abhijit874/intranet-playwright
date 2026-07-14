import { test } from '@playwright/test';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';
import { createMaintenance, uniqueReason } from './maintenance_helpers';

test('adding maintenance', async ({ page }) => {
  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();

  // createMaintenance picks the first available asset and verifies the success alert.
  await createMaintenance(maintenancePage, { reason: 'playwright automation with codex' });
});

// Self-contained: creates a fresh maintenance record (on the first available asset)
// with a unique reason, then searches for that exact record and edits it.
test('editing maintenance', async ({ page }) => {
  const reason = uniqueReason();
  const updatedReason = `${reason} edited`;

  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();

  // create the record this test will edit
  await createMaintenance(maintenancePage, { reason });

  // search for that exact record and edit it
  await maintenancePage.navigateTo();
  await maintenancePage.searchMaintenance(reason);
  await maintenancePage.clickEditOnRow(reason);
  await page.locator('#asset_maintainance_reason').clear();
  await maintenancePage.fillReason(updatedReason);
  await maintenancePage.submit();
  await maintenancePage.verifyUpdateSuccessAlert();
});
