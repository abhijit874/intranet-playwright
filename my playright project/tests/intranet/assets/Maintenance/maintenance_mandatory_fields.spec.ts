import { test } from '@playwright/test';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';

test('mandatory fields - asset maintenance must not be created without required data', async ({ page }) => {
  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('admin');
  await maintenancePage.navigateTo();
  await maintenancePage.clickAddAsset();
  // Submit without filling any required fields
  await maintenancePage.submit();
  // If the maintenance record is created successfully, validation was bypassed — fail the test
  await maintenancePage.assertNotCreated();
});
