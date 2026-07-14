import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';
import { createAsset, uniqueSerial } from './inventory_helpers';

// Self-contained: creates an asset with a unique serial, then searches for that
// exact serial and confirms the row appears. No dependency on a pre-seeded record.
test('search asset in inventory', async ({ page }) => {
  const serialNumber = uniqueSerial();

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();

  await createAsset(inventoryPage, { serial: serialNumber, assetOf: 'Josh' });
  await inventoryPage.verifySuccessAlert();

  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset(serialNumber);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
