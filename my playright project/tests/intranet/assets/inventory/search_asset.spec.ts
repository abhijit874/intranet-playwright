import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';

test('search asset in inventory', async ({ page }) => {
  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset('test_bug234');
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
