import { test, expect } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';

test('editing allocation', async ({ page }) => {
  const allocationDate = '22/04/2026';
  const updatedPurpose = 'playwright automation edited';

  const assetAllocPage = new AssetAllocationPage(page);
  await assetAllocPage.loginAs('hr');
  await assetAllocPage.navigateTo();
  await assetAllocPage.searchAllocation(allocationDate);
  await assetAllocPage.clickEditOnRow(allocationDate);

  await page.locator('#asset_allocation_purpose').clear();
  await page.locator('#asset_allocation_purpose').fill(updatedPurpose);
  await expect(page.locator('#asset_allocation_purpose')).toHaveValue(updatedPurpose);
  await assetAllocPage.submit();
});
