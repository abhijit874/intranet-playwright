import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';

test('return asset to vendor', async ({ page }) => {
  const serialNumber = 'automation-vendor-345';

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset(serialNumber);
  await inventoryPage.clickEditOnRow(serialNumber);

  await expect(page.locator('#asset_serial_number')).toHaveValue(serialNumber);
  await expect(page.locator('#select2-asset_asset_of-container')).toContainText('Vendor');
  await inventoryPage.selectAvailabilityStatus('Returned to Vendor');
  await inventoryPage.fillDiscontinueDate('2026-05-10');
  await inventoryPage.submit();
});
