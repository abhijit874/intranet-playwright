import { test } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';

test('mandatory fields - asset must not be created without required data', async ({ page }) => {
  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('admin');
  await inventoryPage.navigateTo();
  await inventoryPage.clickAddAsset();
  // Submit without filling any required fields
  await inventoryPage.submit();
  // If the asset is created successfully, validation was bypassed — fail the test
  await inventoryPage.assertNotCreated();
});
