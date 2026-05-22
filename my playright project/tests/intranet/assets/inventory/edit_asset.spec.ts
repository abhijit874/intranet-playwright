import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';

test('editing asset', async ({ page }) => {
  const serialNumber = 'automation345';
  const updatedProcessor = 'I7';

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset(serialNumber);
  await inventoryPage.clickEditOnRow(serialNumber);

  await expect(page.locator('#asset_serial_number')).toHaveValue(serialNumber);
  await inventoryPage.fillVersion(updatedProcessor);
  await inventoryPage.submit();
});
