import { test, expect } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';

test('search asset allocation', async ({ page }) => {
  const assetAllocPage = new AssetAllocationPage(page);
  await assetAllocPage.loginAs('hr');
  await assetAllocPage.navigateTo();
  await assetAllocPage.searchAllocation('6TWR863');
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
