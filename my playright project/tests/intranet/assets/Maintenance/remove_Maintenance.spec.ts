import { test } from '@playwright/test';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';
import { createMaintenance, uniqueReason } from './maintenance_helpers';

// Self-contained: creates a fresh maintenance record, then finds that exact record
// by its unique reason and removes it from maintenance (marks the asset received).
test('removing maintenance', async ({ page }) => {
  const reason = uniqueReason('playwright removal');

  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();

  // create the record this test will remove
  await createMaintenance(maintenancePage, { reason });

  // find it and mark the asset as received
  await maintenancePage.navigateTo();
  await maintenancePage.searchMaintenance(reason);
  await maintenancePage.clickEditOnRow(reason);
  await maintenancePage.markAsReceived();
  await maintenancePage.submit();
  await maintenancePage.verifyUpdateSuccessAlert();
});
