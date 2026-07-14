import { test, expect } from '@playwright/test';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';
import { createMaintenance, uniqueReason } from './maintenance_helpers';

// Self-contained: creates a maintenance record, then searches for that exact
// record by its unique reason and confirms the row appears.
test('search asset maintenance record', async ({ page }) => {
  const reason = uniqueReason('playwright search');

  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();

  await createMaintenance(maintenancePage, { reason });

  await maintenancePage.navigateTo();
  await maintenancePage.searchMaintenance(reason);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
