import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';

test('return asset to client', async ({ page }) => {
  const serialNumber = 'automation-client-345';

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset(serialNumber);
  await inventoryPage.clickEditOnRow(serialNumber);

  await expect(page.locator('#asset_serial_number')).toHaveValue(serialNumber);
  await expect(page.locator('#select2-asset_asset_of-container')).toContainText('Client');
  await inventoryPage.selectAvailabilityStatus('Returned to Client');
  await inventoryPage.fillDiscontinueDate('2026-05-10');
  await inventoryPage.submit();
});
