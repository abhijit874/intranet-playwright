import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';

test('discontinue existing asset', async ({ page }) => {
  const serialNumber = 'automation345';

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset(serialNumber);
  await inventoryPage.clickEditOnRow(serialNumber);

  await expect(page.locator('#asset_serial_number')).toHaveValue(serialNumber);
  await expect(page.locator('#select2-asset_availability_status-container')).toContainText('In Stock');
  await inventoryPage.selectAvailabilityStatus('Discontinue');
  await inventoryPage.fillDiscontinueDate('2026-05-10');
  await inventoryPage.submit();
});
